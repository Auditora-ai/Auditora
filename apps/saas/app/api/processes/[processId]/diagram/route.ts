import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
			query: { disableCookieCache: true },
		});
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { processId } = await params;
		const { bpmnXml } = await request.json();

		if (!bpmnXml || typeof bpmnXml !== "string") {
			return NextResponse.json(
				{ error: "bpmnXml is required" },
				{ status: 400 },
			);
		}

		// Verify ownership
		const process = await db.processDefinition.findUnique({
			where: { id: processId },
			include: {
				architecture: {
					select: { organizationId: true },
				},
			},
		});

		if (!process) {
			return NextResponse.json({ error: "Process not found" }, { status: 404 });
		}

		// Save BPMN XML
		await db.processDefinition.update({
			where: { id: processId },
			data: { bpmnXml },
		});

		// Auto-create version
		const lastVersion = await db.processVersion.findFirst({
			where: { processDefinitionId: processId },
			orderBy: { version: "desc" },
		});
		const nextVersion = (lastVersion?.version ?? 0) + 1;

		await db.processVersion.create({
			data: {
				processDefinitionId: processId,
				version: nextVersion,
				name: process.name,
				description: process.description,
				bpmnXml,
				goals: process.goals,
				triggers: process.triggers,
				outputs: process.outputs,
				changeNote: "Manual diagram edit",
				createdBy: session.user.id,
			},
		});

		return NextResponse.json({ ok: true, version: nextVersion });
	} catch (error) {
		console.error("[SaveProcessDiagram] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
