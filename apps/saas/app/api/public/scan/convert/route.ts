/**
 * Conversion Endpoint for Radiografia
 *
 * POST — Convert an anonymous session into a real user account.
 * Creates: User → Organization → ProcessArchitecture → ProcessDefinition → ProcessRisk records
 * in a single Prisma transaction.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import {
	getClientIp,
	checkRateLimit,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";

interface ConvertBody {
	email: string;
	name: string;
	organizationName?: string;
}

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
	}

	const ip = getClientIp(request);
	if (!(await checkRateLimit(ip, 5, "convert"))) {
		return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
	}

	const sessionResult = await verifyAnonymousSession(request);
	if (sessionResult.error) return sessionResult.error;
	const session = sessionResult.session;

	const body = (await request.json()) as ConvertBody;
	const { email, name, organizationName } = body;

	if (!email?.trim() || !name?.trim()) {
		return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
	}

	// Check if user already exists
	const existingUser = await db.user.findUnique({
		where: { email: email.trim().toLowerCase() },
	});

	if (existingUser) {
		return NextResponse.json({
			error: "existing_user",
			message: "Ya tienes una cuenta. Inicia sesion para guardar esta radiografia.",
		}, { status: 409 });
	}

	try {
		// Get diagram data for ProcessDefinition
		const diagramNodes = session.diagramNodes as unknown[] | null;
		const riskResults = (session.deepRiskResults || session.riskResults) as Record<string, unknown> | null;
		const risks = riskResults as { newRisks?: Array<Record<string, unknown>> } | null;

		// Single transaction: create everything
		const result = await db.$transaction(async (tx) => {
			// 1. Create Organization
			const org = await tx.organization.create({
				data: {
					name: organizationName || `${name.trim()}'s Organization`,
					slug: generateSlug(organizationName || name),
					createdAt: new Date(),
					industry: session.industry || undefined,
				},
			});

			// 2. Create User (minimal — actual auth handled by better-auth)
			const user = await tx.user.create({
				data: {
					name: name.trim(),
					email: email.trim().toLowerCase(),
					emailVerified: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					onboardingComplete: true,
					lastActiveOrganizationId: org.id,
				},
			});

			// 3. Create Member (link user to org)
			await tx.member.create({
				data: {
					userId: user.id,
					organizationId: org.id,
					role: "owner",
					createdAt: new Date(),
				},
			});

			// 4. Create ProcessArchitecture
			const architecture = await tx.processArchitecture.create({
				data: {
					organization: { connect: { id: org.id } },
				},
			});

			// 5. Create ProcessDefinition from radiografia
			let processDefId: string | null = null;
			if (session.processName) {
				const processDef = await tx.processDefinition.create({
					data: {
						architecture: { connect: { id: architecture.id } },
						name: session.processName,
						description: session.industry
							? `Proceso de ${session.industry}`
							: undefined,
						level: "PROCESS",
					},
				});
				processDefId = processDef.id;

				// 6. Create ProcessRisk records from risk results
				if (risks?.newRisks && processDefId) {
					for (const risk of risks.newRisks) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						await tx.processRisk.create({
							data: {
								processDefinitionId: processDefId,
								title: (risk.title as string) || "Riesgo detectado",
								description: (risk.description as string) || "",
								riskType: (risk.riskType as string) || "OPERATIONAL",
								severity: (risk.severity as number) || 3,
								probability: (risk.probability as number) || 3,
								riskScore:
									((risk.severity as number) || 3) *
									((risk.probability as number) || 3),
								status: "IDENTIFIED",
								source: "AI_AUDIT",
								isOpportunity: (risk.isOpportunity as boolean) || false,
								affectedStep: (risk.affectedStep as string) || null,
							} as any,
						});
					}
				}
			}

			// 7. Mark anonymous session as converted
			await tx.anonymousSession.update({
				where: { id: session.id },
				data: {
					convertedToUserId: user.id,
					convertedAt: new Date(),
				},
			});

			return {
				userId: user.id,
				organizationId: org.id,
				organizationSlug: org.slug,
				processDefinitionId: processDefId,
			};
		});

		// Clear the session cookie
		const response = NextResponse.json({
			success: true,
			...result,
			redirectUrl: `/${result.organizationSlug}`,
		});

		response.cookies.delete("scan_session");

		return response;
	} catch (error) {
		console.error("[radiografia/convert] Transaction error:", error);
		return NextResponse.json(
			{ error: "Hubo un problema guardando tu radiografia. Por favor intenta de nuevo." },
			{ status: 500 },
		);
	}
}

function generateSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 50)
		+ `-${Date.now().toString(36)}`;
}
