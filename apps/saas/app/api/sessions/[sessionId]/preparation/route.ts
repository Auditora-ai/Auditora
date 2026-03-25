/**
 * GET /api/sessions/[sessionId]/preparation
 *
 * Returns a preparation brief for a scheduled session:
 * - 6 checklist items with status (done/partial/missing)
 * - Completeness score, RACI gaps, uncontrolled risks, intake progress
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

interface PreparationItem {
	key: string;
	status: "done" | "partial" | "missing";
	label: string;
	detail: string;
	count?: number;
}

interface PreparationBrief {
	items: PreparationItem[];
	completenessScore: number | null;
	raciGapCount: number;
	uncontrolledRiskCount: number;
	intakeProgress: { answered: number; total: number };
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;
	const result = await requireSessionAuth(sessionId);
	if (isAuthError(result)) return result;

	const { session } = result;
	const processId = session.processDefinitionId;

	// If no process assigned, return all missing
	if (!processId) {
		return NextResponse.json({
			items: [
				{ key: "diagram", status: "missing", label: "Diagrama base", detail: "Sin proceso asignado" },
				{ key: "raci", status: "missing", label: "RACI", detail: "Sin proceso asignado" },
				{ key: "context", status: "missing", label: "Contexto organizacional", detail: "Sin proceso asignado" },
				{ key: "gaps", status: "missing", label: "Gaps de conocimiento", detail: "Sin proceso asignado" },
				{ key: "risks", status: "missing", label: "Riesgos", detail: "Sin proceso asignado" },
				{ key: "intake", status: "missing", label: "Info del cliente", detail: "Sin intake generado" },
			],
			completenessScore: null,
			raciGapCount: 0,
			uncontrolledRiskCount: 0,
			intakeProgress: { answered: 0, total: 0 },
		} satisfies PreparationBrief);
	}

	// Fetch all data in parallel
	const [process, intelligence, raciEntries, risks, companyBrain, intakeResponses] = await Promise.all([
		db.processDefinition.findUnique({
			where: { id: processId },
			select: { bpmnXml: true, name: true },
		}),
		db.processIntelligence.findUnique({
			where: { processDefinitionId: processId },
			include: {
				items: { where: { status: "OPEN" } },
			},
		}),
		db.raciEntry.findMany({
			where: { processId },
		}),
		db.processRisk.findMany({
			where: { processDefinitionId: processId },
			include: { _count: { select: { controls: true } } },
		}),
		db.companyBrain.findFirst({
			where: {
				organizationId: session.organizationId,
			},
			include: { orgContext: true },
		}),
		db.clientIntakeResponse.findMany({
			where: { sessionId },
		}),
	]);

	const items: PreparationItem[] = [];

	// 1. Diagram base
	if (process?.bpmnXml) {
		items.push({ key: "diagram", status: "done", label: "Diagrama base", detail: "Diagrama BPMN existente" });
	} else {
		items.push({ key: "diagram", status: "missing", label: "Diagrama base", detail: "Sin diagrama previo" });
	}

	// 2. RACI — count activities without ACCOUNTABLE
	const activitiesWithRaci = new Set(raciEntries.map((r) => r.activityName));
	const activitiesWithAccountable = new Set(
		raciEntries.filter((r) => r.assignment === "ACCOUNTABLE").map((r) => r.activityName),
	);
	const raciGapCount = activitiesWithRaci.size > 0
		? [...activitiesWithRaci].filter((a) => !activitiesWithAccountable.has(a)).length
		: 0;

	if (raciEntries.length === 0) {
		items.push({ key: "raci", status: "missing", label: "RACI", detail: "Sin asignaciones RACI", count: 0 });
	} else if (raciGapCount > 0) {
		items.push({ key: "raci", status: "partial", label: "RACI", detail: `${raciGapCount} actividades sin responsable`, count: raciGapCount });
	} else {
		items.push({ key: "raci", status: "done", label: "RACI", detail: `${activitiesWithRaci.size} actividades asignadas` });
	}

	// 3. Organizational context
	if (companyBrain?.orgContext?.mission || companyBrain?.orgContext?.industrySector) {
		items.push({ key: "context", status: "done", label: "Contexto organizacional", detail: "CompanyBrain con contexto" });
	} else if (companyBrain) {
		items.push({ key: "context", status: "partial", label: "Contexto organizacional", detail: "CompanyBrain sin contexto completo" });
	} else {
		items.push({ key: "context", status: "missing", label: "Contexto organizacional", detail: "Sin CompanyBrain" });
	}

	// 4. Knowledge gaps
	const openGaps = intelligence?.items?.length ?? 0;
	if (openGaps === 0) {
		items.push({ key: "gaps", status: "done", label: "Gaps de conocimiento", detail: "Sin gaps pendientes" });
	} else {
		items.push({ key: "gaps", status: "partial", label: "Gaps de conocimiento", detail: `${openGaps} preguntas abiertas`, count: openGaps });
	}

	// 5. Risks without controls
	const uncontrolledRiskCount = risks.filter((r) => r._count.controls === 0).length;
	if (risks.length === 0) {
		items.push({ key: "risks", status: "missing", label: "Riesgos", detail: "Sin riesgos registrados", count: 0 });
	} else if (uncontrolledRiskCount > 0) {
		items.push({ key: "risks", status: "partial", label: "Riesgos", detail: `${uncontrolledRiskCount} riesgos sin control`, count: uncontrolledRiskCount });
	} else {
		items.push({ key: "risks", status: "done", label: "Riesgos", detail: `${risks.length} riesgos con controles` });
	}

	// 6. Client intake
	const totalIntake = intakeResponses.length;
	const answeredIntake = intakeResponses.filter((r) => r.response !== null).length;
	if (totalIntake === 0) {
		items.push({ key: "intake", status: "missing", label: "Info del cliente", detail: "Sin intake generado" });
	} else if (answeredIntake === totalIntake) {
		items.push({ key: "intake", status: "done", label: "Info del cliente", detail: `${answeredIntake}/${totalIntake} respondidas` });
	} else {
		items.push({ key: "intake", status: "partial", label: "Info del cliente", detail: `${answeredIntake}/${totalIntake} respondidas`, count: totalIntake - answeredIntake });
	}

	const brief: PreparationBrief = {
		items,
		completenessScore: intelligence?.completenessScore ?? null,
		raciGapCount,
		uncontrolledRiskCount,
		intakeProgress: { answered: answeredIntake, total: totalIntake },
	};

	return NextResponse.json(brief);
}
