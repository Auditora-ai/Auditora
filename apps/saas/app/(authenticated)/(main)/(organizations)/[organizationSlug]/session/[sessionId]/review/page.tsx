import { db } from "@repo/database";
import { redirect } from "next/navigation";
import { RetryButton } from "./RetryButton";
import { ReviewPoller } from "./ReviewPoller";
import { ExportPdfButton } from "./ExportPdfButton";
import { MaturityScore } from "./MaturityScore";
import { ProcessMap } from "./ProcessMap";
import { SipocDashboard, computeSipocCoverage } from "./SipocDashboard";
import { ActivityCards } from "./ActivityCards";
import { RiskHeatMap } from "./RiskHeatMap";
import { NextSessionIntel } from "./NextSessionIntel";
import { ShareReportButton } from "./ShareReportButton";
import { ReportSection } from "./ReportSection";
import { CopyActionsButton } from "./CopyActionsButton";
import { RegenerateButton } from "./RegenerateButton";

export const metadata = {
	title: "Process Intelligence Report — Auditora.ai",
};

// -- Type helpers --

interface SummaryData {
	summary: string;
	actionItems: string[];
}

interface AuditGap {
	category: string;
	question: string;
	context: string;
	priority: number;
}

interface ProcessAuditData {
	completenessScore: number;
	updatedScores: Record<string, number>;
	newGaps: AuditGap[];
	contradictions?: Array<{ topic: string; claim1: string; claim2: string }>;
	followUpSuggestion?: {
		shouldSchedule: boolean;
		focusAreas: string[];
		estimatedDuration: string;
		unresolved: number;
	};
}

interface RaciAssignment {
	activityName: string;
	role: string;
	assignment: "R" | "A" | "C" | "I";
}

interface RaciData {
	assignments: RaciAssignment[];
}

interface RiskAuditData {
	newRisks: Array<{
		title: string;
		description: string;
		riskType: string;
		severity: number;
		probability: number;
		affectedStep?: string;
		isOpportunity: boolean;
		suggestedMitigations: string[];
	}>;
	riskSummary: {
		totalRiskScore: number;
		criticalCount: number;
		highCount: number;
		topRiskArea: string;
	};
}

interface ComplexityData {
	score: number;
	breakdown: Record<string, number>;
	explanation: string;
	recommendation: string;
}

// -- Helpers --

function formatDuration(startedAt: Date | null, endedAt: Date | null): string {
	if (!startedAt || !endedAt) return "--";
	const ms = endedAt.getTime() - startedAt.getTime();
	const mins = Math.round(ms / 60_000);
	if (mins < 60) return `${mins} min`;
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return `${h}h ${m}m`;
}

function formatDate(date: Date | null): string {
	if (!date) return "--";
	return date.toLocaleDateString("es-MX", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// -- Skeleton component --

function SectionSkeleton({ title }: { title: string }) {
	return (
		<section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
			<div className="border-b border-slate-100 px-4 py-4 md:px-6">
			<h2 className="text-lg font-semibold text-slate-900">
				{title}
			</h2>
		</div>
		<div className="px-4 py-4 space-y-3 md:px-6 md:py-5">
			<div className="h-4 w-full animate-pulse rounded bg-slate-100" />
			<div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
			<div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
		</div>
	</section>
	);
}

function FailedSection({ title, error, sessionId, type }: { title: string; error: string | null; sessionId: string; type: string }) {
	return (
		<section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
			<div className="border-b border-slate-100 px-4 py-4 md:px-6">
				<h2 className="text-lg font-semibold text-slate-900">
					{title}
				</h2>
			</div>
			<div className="px-4 py-4 flex items-center justify-between md:px-6 md:py-5">
				<p className="text-sm text-red-600">Error al generar.{error ? ` ${error}` : ""}</p>
				<RetryButton sessionId={sessionId} type={type} />
			</div>
		</section>
	);
}

// -- RACI Section (kept inline, polished) --

function RaciSection({ data, actions }: { data: RaciData | null; actions?: React.ReactNode }) {
	const activities: string[] = [];
	const roles: string[] = [];
	const matrix: Record<string, Record<string, string>> = {};

	if (data?.assignments) {
		for (const a of data.assignments) {
			if (!activities.includes(a.activityName)) activities.push(a.activityName);
			if (!roles.includes(a.role)) roles.push(a.role);
			if (!matrix[a.activityName]) matrix[a.activityName] = {};
			matrix[a.activityName][a.role] = a.assignment;
		}
	}

	const cellColor: Record<string, string> = {
		R: "bg-blue-100 text-blue-800 font-semibold",
		A: "bg-purple-100 text-purple-800 font-semibold",
		C: "bg-slate-100 text-slate-500",
		I: "bg-slate-50 text-slate-400",
	};

	if (!data || activities.length === 0) return null;

	return (
		<ReportSection title="Matriz RACI" actions={actions}>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200">
								<th className="py-2 pr-4 text-left font-medium text-slate-500">Actividad</th>
								{roles.map((role) => (
									<th key={role} className="px-3 py-2 text-center font-medium text-slate-500" style={{ fontVariantNumeric: "tabular-nums" }}>
										{role}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{activities.map((activity) => (
								<tr key={activity} className="border-b border-slate-50 last:border-0">
									<td className="py-2.5 pr-4 text-slate-700">{activity}</td>
									{roles.map((role) => {
										const val = matrix[activity]?.[role];
										return (
											<td key={role} className="px-3 py-2.5 text-center">
												{val ? (
													<span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs ${cellColor[val] ?? ""}`}>
														{val}
													</span>
												) : (
													<span className="text-slate-300">-</span>
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
					<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 md:gap-4">
						<span><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-semibold text-blue-800">R</span> Responsable</span>
						<span><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-semibold text-purple-800">A</span> Accountable</span>
						<span><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">C</span> Consultado</span>
						<span><span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">I</span> Informado</span>
					</div>
				</div>
		</ReportSection>
	);
}

// -- Knowledge Gaps (enhanced, grouped by category) --

function priorityBadge(priority: number): { label: string; classes: string } {
	if (priority >= 70) return { label: "P1", classes: "bg-red-100 text-red-700" };
	if (priority >= 40) return { label: "P2", classes: "bg-amber-100 text-amber-700" };
	return { label: "P3", classes: "bg-slate-100 text-slate-500" };
}

function KnowledgeGapsSection({ gaps, actions }: { gaps: AuditGap[]; actions?: React.ReactNode }) {
	if (gaps.length === 0) return null;

	// Sort all gaps by priority descending, then group
	const sorted = [...gaps].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
	const grouped = new Map<string, AuditGap[]>();
	for (const gap of sorted) {
		const cat = gap.category || "GENERAL_GAP";
		if (!grouped.has(cat)) grouped.set(cat, []);
		grouped.get(cat)!.push(gap);
	}

	const categoryLabels: Record<string, string> = {
		MISSING_PATH: "Caminos faltantes",
		MISSING_ROLE: "Roles sin asignar",
		MISSING_EXCEPTION: "Excepciones no definidas",
		MISSING_DECISION: "Decisiones sin criterio",
		MISSING_TRIGGER: "Disparadores no claros",
		MISSING_OUTPUT: "Salidas no definidas",
		CONTRADICTION: "Contradicciones",
		UNCLEAR_HANDOFF: "Handoffs no claros",
		MISSING_SLA: "SLAs faltantes",
		MISSING_SYSTEM: "Sistemas no identificados",
		GENERAL_GAP: "Otros",
	};

	return (
		<ReportSection title={`Brechas de Conocimiento (${gaps.length})`} actions={actions}>
			<div className="space-y-5">
				{Array.from(grouped.entries()).map(([category, catGaps]) => (
					<div key={category}>
						<h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-amber-500" />
							{categoryLabels[category] || category.replace(/_/g, " ")}
							<span className="text-xs font-normal text-slate-400">({catGaps.length})</span>
						</h3>
						<div className="space-y-1.5">
							{catGaps.map((gap, i) => {
								const badge = priorityBadge(gap.priority ?? 0);
								return (
									<div key={i} className="rounded border border-slate-100 bg-slate-50 px-4 py-2.5">
										<div className="flex items-center gap-2 mb-0.5">
											<span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.classes}`}>
												{badge.label}
											</span>
										</div>
										<p className="text-sm text-slate-700">{gap.question}</p>
										{gap.context && (
											<p className="mt-1 text-xs text-slate-400">{gap.context}</p>
										)}
									</div>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</ReportSection>
	);
}

// -- Main Page Component --

export default async function SessionReviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { organizationSlug, sessionId } = await params;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			organization: { select: { name: true, slug: true } },
			sessionDeliverables: true,
			diagramNodes: {
				where: { state: { not: "REJECTED" } },
				orderBy: { formedAt: "asc" },
			},
			_count: { select: { transcriptEntries: true } },
		},
	});

	if (!session) {
		redirect(`/${organizationSlug}/descubrir`);
	}

	if (session.organization.slug !== organizationSlug) {
		redirect(`/${organizationSlug}/descubrir`);
	}

	// Build deliverable map
	const deliverableMap = new Map(session.sessionDeliverables.map((d) => [d.type, d]));

	// Timeout stale deliverables
	const DELIVERABLE_TIMEOUT_MS = 5 * 60 * 1000;
	for (const [type, del] of deliverableMap) {
		if (del.status === "running" && del.startedAt && Date.now() - new Date(del.startedAt).getTime() > DELIVERABLE_TIMEOUT_MS) {
			await db.sessionDeliverable.update({
				where: { sessionId_type: { sessionId, type } },
				data: { status: "failed", error: "Timeout: la generacion tomo mas de 5 minutos", completedAt: new Date() },
			});
			del.status = "failed";
			del.error = "Timeout: la generacion tomo mas de 5 minutos";
		}
	}

	// Extract deliverables
	const summaryDel = deliverableMap.get("summary");
	const auditDel = deliverableMap.get("process_audit");
	const raciDel = deliverableMap.get("raci");
	const riskDel = deliverableMap.get("risk_audit");
	const complexityDel = deliverableMap.get("complexity_score");

	const summaryData = summaryDel?.status === "completed" ? (summaryDel.data as unknown as SummaryData) : null;
	const auditData = auditDel?.status === "completed" ? (auditDel.data as unknown as ProcessAuditData) : null;
	const raciData = raciDel?.status === "completed" ? (raciDel.data as unknown as RaciData) : null;
	const riskData = riskDel?.status === "completed" ? (riskDel.data as unknown as RiskAuditData) : null;
	const complexityData = complexityDel?.status === "completed" ? (complexityDel.data as unknown as ComplexityData) : null;

	const processName = session.processDefinition?.name ?? "Proceso";
	const hasBpmnXml = !!(session.bpmnXml || session.processDefinition?.bpmnXml);
	const confirmedNodes = session.diagramNodes.filter((n) => n.state === "CONFIRMED");
	const sipocCoverage = auditData?.updatedScores ? computeSipocCoverage(auditData.updatedScores) : null;

	// Polling
	const terminalStatuses = new Set(["completed", "failed", "skipped"]);
	const allStatuses = [summaryDel?.status, auditDel?.status, raciDel?.status, riskDel?.status, complexityDel?.status];
	const hasInProgress = allStatuses.some((s) => !s || !terminalStatuses.has(s));

	return (
		<div className="min-h-screen bg-slate-50">
			<ReviewPoller hasInProgress={hasInProgress} />

			{/* 1. Hero — Process Maturity Score */}
			<MaturityScore
				processName={processName}
				orgName={session.organization.name}
				date={formatDate(session.startedAt)}
				duration={formatDuration(session.startedAt, session.endedAt)}
				transcriptCount={session._count.transcriptEntries}
				nodeCount={session.diagramNodes.length}
				confirmedCount={confirmedNodes.length}
				completenessScore={auditData?.completenessScore ?? null}
				complexityScore={complexityData?.score ?? null}
				sipocCoverage={sipocCoverage}
			/>

			{/* Action bar */}
			<div className="bg-slate-900 border-b border-slate-800">
				<div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:px-6">
					<a
						href={`/${organizationSlug}/session/${sessionId}/live`}
						className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
					>
						← Volver a la sesion
					</a>
					<div className="flex items-center gap-2 overflow-x-auto">
						{hasBpmnXml && (
							<a
								href={`/api/sessions/${session.id}/export/bpmn`}
								className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
							>
								BPMN XML
							</a>
						)}
						<ExportPdfButton sessionId={sessionId} />
						<ShareReportButton sessionId={sessionId} shareToken={session.shareToken} />
					</div>
				</div>
			</div>

			{/* Report body — Risk-First order */}
			<main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">

				{/* 2. Risk Heat Map + Opportunities (HERO) */}
				{riskDel?.status === "completed" && riskData ? (
					<RiskHeatMap
						risks={riskData.newRisks || []}
						summary={riskData.riskSummary || { totalRiskScore: 0, criticalCount: 0, highCount: 0, topRiskArea: "" }}
						actions={<RegenerateButton sessionId={sessionId} type="risk_audit" />}
					/>
				) : riskDel?.status === "failed" ? (
					<FailedSection title="Mapa de Riesgos" error={riskDel.error} sessionId={sessionId} type="risk_audit" />
				) : (
					<SectionSkeleton title="Mapa de Riesgos" />
				)}

				{/* 3. Executive Summary */}
				{summaryDel?.status === "completed" && summaryData ? (
					<ReportSection title="Resumen Ejecutivo" actions={<RegenerateButton sessionId={sessionId} type="summary" />}>
						<div className="space-y-5">
							<p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
								{summaryData.summary}
							</p>
							{summaryData.actionItems.length > 0 && (
								<div>
									<div className="flex items-center justify-between mb-2">
										<h3 className="text-sm font-medium text-slate-700">Acciones Pendientes</h3>
										<CopyActionsButton items={summaryData.actionItems} />
									</div>
									<ul className="space-y-1.5">
										{summaryData.actionItems.map((item, i) => (
											<li key={i} className="flex items-start gap-2 text-sm text-slate-600">
												<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-400">
													{i + 1}
												</span>
												{item}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</ReportSection>
				) : summaryDel?.status === "failed" ? (
					<FailedSection title="Resumen Ejecutivo" error={summaryDel.error} sessionId={sessionId} type="summary" />
				) : (
					<SectionSkeleton title="Resumen Ejecutivo" />
				)}

				{/* 4. Knowledge Gaps */}
				{auditData && <KnowledgeGapsSection gaps={auditData.newGaps || []} actions={<RegenerateButton sessionId={sessionId} type="process_audit" />} />}

				{/* 5. Process Map */}
				<ProcessMap
					nodes={session.diagramNodes.map((n) => ({
						id: n.id,
						label: n.label,
						nodeType: n.nodeType,
						lane: n.lane,
						state: n.state,
						confidence: n.confidence,
					}))}
				/>

				{/* 6. SIPOC Dashboard */}
				{auditDel?.status === "completed" && auditData?.updatedScores ? (
					<SipocDashboard
						updatedScores={auditData.updatedScores}
						gaps={auditData.newGaps || []}
						actions={<RegenerateButton sessionId={sessionId} type="process_audit" />}
					/>
				) : auditDel?.status === "failed" ? (
					<FailedSection title="Cobertura SIPOC" error={auditDel.error} sessionId={sessionId} type="process_audit" />
				) : (
					<SectionSkeleton title="Cobertura SIPOC" />
				)}

				{/* 7. Activity Detail Cards with SOPs */}
				<ActivityCards
					nodes={session.diagramNodes.map((n) => ({
						id: n.id,
						label: n.label,
						nodeType: n.nodeType,
						lane: n.lane,
						state: n.state,
						confidence: n.confidence,
						properties: (n.properties as any) || null,
						procedure: (n.procedure as any) || null,
					}))}
				/>

				{/* 8. RACI Matrix */}
				{raciDel?.status === "completed" ? (
					<RaciSection data={raciData} actions={<RegenerateButton sessionId={sessionId} type="raci" />} />
				) : raciDel?.status === "failed" ? (
					<FailedSection title="Matriz RACI" error={raciDel.error} sessionId={sessionId} type="raci" />
				) : raciDel?.status === "skipped" ? null : (
					<SectionSkeleton title="Matriz RACI" />
				)}

				{/* 9. Recommendations */}
				{(auditDel?.status === "completed" || complexityData) ? (
					<NextSessionIntel
						followUp={auditData?.followUpSuggestion || null}
						gapCount={auditData?.newGaps?.length || 0}
						complexityExplanation={complexityData?.explanation}
						complexityRecommendation={complexityData?.recommendation}
						contradictions={auditData?.contradictions}
						actions={<RegenerateButton sessionId={sessionId} type="complexity_score" />}
					/>
				) : auditDel?.status !== "failed" && auditDel?.status !== "skipped" ? (
					<SectionSkeleton title="Recomendaciones" />
				) : null}
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white">
				<div className="mx-auto max-w-5xl px-4 py-4 md:px-6 space-y-3">
					<p className="text-[10px] text-slate-400 text-center leading-relaxed">
						Este reporte fue generado por inteligencia artificial. Los análisis y recomendaciones son puntos de partida analíticos y no constituyen asesoramiento profesional, legal ni financiero. Los resultados deben ser validados por profesionales calificados antes de tomar decisiones de negocio.
					</p>
					<div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
						<span>Generado por Auditora.ai</span>
						<a
							href={`/${organizationSlug}/session/${sessionId}/live`}
							className="text-blue-600 hover:text-blue-700"
						>
							Volver a la sesion
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
