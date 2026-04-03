import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	const { processId } = await params;

	const authResult = await requireProcessAuth(processId);
	if (isAuthError(authResult)) return authResult;

	// Get the process with BPMN data
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: {
			id: true,
			name: true,
			description: true,
			bpmnXml: true,
			architecture: { select: { organizationId: true } },
		},
	});

	if (!process) {
		return NextResponse.json({ error: "Process not found" }, { status: 404 });
	}

	// Create a draft procedure from available process info
	const procedure = await db.procedure.create({
		data: {
			processDefinitionId: processId,
			organizationId: process.architecture.organizationId,
			title: `SOP: ${process.name}`,
			status: "DRAFT",
			version: 1,
			objective: process.description ?? `Procedimiento operativo estándar para ${process.name}`,
			createdBy: authResult.authCtx.userId,
		},
		select: {
			id: true,
			title: true,
			status: true,
			version: true,
			responsible: true,
			nodeId: true,
			updatedAt: true,
		},
	});

	return NextResponse.json({
		...procedure,
		updatedAt: procedure.updatedAt.toISOString(),
	});
}
