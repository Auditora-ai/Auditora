/**
 * Authenticated Scan Save API
 *
 * POST /api/scan/save — Save radiografia results to an existing organization
 * Creates ProcessDefinition + ProcessRisk records from the anonymous session data.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, type RiskType } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";

export async function POST(request: NextRequest) {
	// 1. Verify authenticated user
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 2. Verify anonymous scan session exists (has the results)
	const scanResult = await verifyAnonymousSession(request);
	if (scanResult.error) return scanResult.error;

	const scanSession = scanResult.session;

	// 3. Get organizationId from request body
	const body = await request.json();
	const { organizationId } = body;

	if (!organizationId) {
		return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
	}

	// 4. Verify user is a member of this organization
	const member = await db.member.findFirst({
		where: {
			userId: session.user.id,
			organizationId,
		},
	});

	if (!member) {
		return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
	}

	// 5. Parse scan results
	const riskResults = scanSession.riskResults
		? (JSON.parse(scanSession.riskResults as string) as {
				newRisks: Array<{
					title: string;
					description: string;
					riskType: string;
					severity: number;
					probability: number;
					affectedStep?: string;
					suggestedMitigations: string[];
					isOpportunity: boolean;
				}>;
				riskSummary: {
					totalRiskScore: number;
					criticalCount: number;
					highCount: number;
					topRiskArea: string;
				};
			})
		: null;

	const industryData = scanSession.industry
		? (typeof scanSession.industry === "string"
				? JSON.parse(scanSession.industry)
				: scanSession.industry) as {
				industry?: string;
				selectedProcess?: { name?: string; description?: string };
			}
		: null;

	const processName = industryData?.selectedProcess?.name || scanSession.processName || "Proceso principal";
	const processDescription = industryData?.selectedProcess?.description || "";

	// 6. Get or create ProcessArchitecture
	let architecture = await db.processArchitecture.findUnique({
		where: { organizationId },
	});

	if (!architecture) {
		architecture = await db.processArchitecture.create({
			data: { organizationId },
		});
	}

	// 7. Check for duplicate process name
	const existing = await db.processDefinition.findFirst({
		where: {
			architectureId: architecture.id,
			name: { equals: processName, mode: "insensitive" },
		},
	});

	if (existing) {
		return NextResponse.json(
			{ error: "duplicate", message: `El proceso "${processName}" ya existe en tu organización.` },
			{ status: 409 },
		);
	}

	// 8. Create ProcessDefinition + ProcessRisks in transaction
	const result = await db.$transaction(async (tx) => {
		// Parse BPMN XML if available
		let bpmnXml: string | null = null;
		if (scanSession.diagramNodes) {
			try {
				const { buildBpmnXml } = await import("@repo/process-engine");
				const nodesData = JSON.parse(scanSession.diagramNodes as string);
				bpmnXml = await buildBpmnXml(nodesData);
			} catch {
				// Diagram generation optional
			}
		}

		const definition = await tx.processDefinition.create({
			data: {
				architectureId: architecture!.id,
				name: processName,
				description: processDescription,
				level: "PROCESS",
				category: "core",
				processStatus: "DRAFT",
				bpmnXml,
			},
		});

		// Create ProcessRisk records
		if (riskResults?.newRisks) {
			await tx.processRisk.createMany({
				data: riskResults.newRisks.map((risk) => ({
					processDefinitionId: definition.id,
					title: risk.title,
					description: risk.description,
					riskType: risk.riskType as RiskType,
					severity: risk.severity,
					probability: risk.probability,
					riskScore: risk.severity * risk.probability,
					status: "IDENTIFIED" as const,
					source: "AI_AUDIT" as const,
					affectedStep: risk.affectedStep || null,
					createdBy: session.user.id,
				})),
			});
		}

		return definition;
	});

	// 9. Mark anonymous session as converted
	await db.anonymousSession.update({
		where: { id: scanSession.id },
		data: {
			convertedToUserId: session.user.id,
			convertedAt: new Date(),
		},
	}).catch(() => {});

	// Get org slug for redirect
	const org = await db.organization.findUnique({
		where: { id: organizationId },
		select: { slug: true },
	});

	return NextResponse.json({
		success: true,
		processDefinitionId: result.id,
		redirectUrl: `/${org?.slug || organizationId}/processes/${result.id}`,
	});
}
