import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getOrgId() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;
	const orgs = await auth.api.listOrganizations({ headers: await headers() });
	return orgs?.[0]?.id ?? null;
}

export async function POST(request: NextRequest) {
	const orgId = await getOrgId();
	if (!orgId)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { bpmnXml, processId, name, architectureId } = body;

	if (!bpmnXml || typeof bpmnXml !== "string") {
		return NextResponse.json(
			{ error: "bpmnXml is required" },
			{ status: 400 },
		);
	}

	// Basic BPMN XML validation
	if (
		!bpmnXml.includes("bpmn:definitions") &&
		!bpmnXml.includes("definitions")
	) {
		return NextResponse.json(
			{ error: "Invalid BPMN XML format" },
			{ status: 400 },
		);
	}

	// Size limit: 10MB
	if (bpmnXml.length > 10 * 1024 * 1024) {
		return NextResponse.json(
			{ error: "File too large (max 10MB)" },
			{ status: 400 },
		);
	}

	if (processId) {
		// Update existing process
		const process = await db.processDefinition.findFirst({
			where: {
				id: processId,
				architecture: { organizationId: orgId },
			},
		});

		if (!process) {
			return NextResponse.json(
				{ error: "Process not found" },
				{ status: 404 },
			);
		}

		const updated = await db.processDefinition.update({
			where: { id: processId },
			data: { bpmnXml },
		});

		return NextResponse.json({ process: updated });
	}

	// Create new process from imported BPMN
	if (!architectureId) {
		return NextResponse.json(
			{ error: "architectureId required for new import" },
			{ status: 400 },
		);
	}

	// Verify architecture belongs to org
	const arch = await db.processArchitecture.findFirst({
		where: {
			id: architectureId,
			organizationId: orgId,
		},
	});

	if (!arch) {
		return NextResponse.json(
			{ error: "Architecture not found" },
			{ status: 404 },
		);
	}

	// Extract process name from BPMN XML if not provided
	const processName =
		name || extractNameFromBpmn(bpmnXml) || "Imported Process";

	const created = await db.processDefinition.create({
		data: {
			architectureId,
			name: processName,
			description: "Imported from BPMN file",
			level: "PROCESS",
			bpmnXml,
			processStatus: "MAPPED",
		},
	});

	return NextResponse.json({ process: created }, { status: 201 });
}

function extractNameFromBpmn(xml: string): string | null {
	// Try to extract process name from BPMN XML
	const match = xml.match(
		/<bpmn:process[^>]*name="([^"]*)"[^>]*>/,
	);
	return match?.[1] || null;
}
