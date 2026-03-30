import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { generateProcedure } from "@repo/ai";
import type { ProcedureResult } from "@repo/ai";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ procedureId: string }> },
) {
	try {
		const { procedureId } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const procedure = await db.procedure.findUnique({
			where: { id: procedureId },
			include: {
				processDefinition: {
					select: {
						name: true,
						description: true,
						goals: true,
						triggers: true,
						outputs: true,
						architecture: { select: { organizationId: true } },
					},
				},
				linkedRisks: {
					select: { title: true, riskType: true, description: true },
				},
			},
		});

		if (!procedure) return NextResponse.json({ error: "Not found" }, { status: 404 });

		const orgId = procedure.organizationId;

		// Build context for AI generation
		const riskContext = procedure.linkedRisks.length > 0
			? procedure.linkedRisks.map((r) => `- ${r.title} (${r.riskType}): ${r.description || ""}`).join("\n")
			: undefined;

		const result: ProcedureResult = await generateProcedure({
			organizationId: orgId,
			processName: procedure.processDefinition.name,
			activityName: procedure.title,
			processDescription: procedure.processDefinition.description || undefined,
			roles: [],
			systems: [],
			transcriptExcerpts: riskContext ? [`RIESGOS IDENTIFICADOS:\n${riskContext}`] : undefined,
		});

		// Auto-generate controlPointsSummary from steps controls
		const allControls = result.steps
			.flatMap((s) => s.controls)
			.filter(Boolean);
		const controlPointsSummary = allControls.length > 0
			? allControls.slice(0, 15).join(". ") + "."
			: null;

		const updated = await db.procedure.update({
			where: { id: procedureId },
			data: {
				objective: result.objective,
				scope: result.scope,
				responsible: result.responsible,
				frequency: result.frequency || null,
				prerequisites: result.prerequisites,
				steps: result.steps as any,
				indicators: result.indicators as any,
				controlPointsSummary,
			},
			include: {
				processDefinition: { select: { name: true, level: true } },
				linkedRisks: {
					select: { id: true, title: true, riskType: true, severity: true, probability: true, riskScore: true },
				},
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("[Procedure Generate] Error:", error);
		return NextResponse.json({ error: "Error al generar procedimiento" }, { status: 500 });
	}
}
