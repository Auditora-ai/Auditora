import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { MaturityScore } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/MaturityScore";
import { ProcessMap } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/ProcessMap";
import { SipocDashboard, computeSipocCoverage } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/SipocDashboard";
import { ActivityCards } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/ActivityCards";
import { RiskHeatMap } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/RiskHeatMap";
import { NextSessionIntel } from "@/app/(authenticated)/(main)/(organizations)/[organizationSlug]/session/[sessionId]/review/NextSessionIntel";

export const metadata = {
	title: "Process Intelligence Report — Auditora.ai",
};

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
	return date.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

export default async function SharedReportPage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;

	const session = await db.meetingSession.findFirst({
		where: { shareToken: token },
		include: {
			processDefinition: true,
			organization: { select: { name: true } },
			sessionDeliverables: true,
			diagramNodes: {
				where: { state: { not: "REJECTED" } },
				orderBy: { formedAt: "asc" },
			},
			_count: { select: { transcriptEntries: true } },
		},
	});

	if (!session) notFound();

	// Only allow access to ended sessions (prevents access to in-progress sessions)
	if (session.status !== "ENDED") notFound();

	const deliverableMap = new Map(session.sessionDeliverables.map((d) => [d.type, d]));
	const summaryDel = deliverableMap.get("summary");
	const auditDel = deliverableMap.get("process_audit");
	const raciDel = deliverableMap.get("raci");
	const riskDel = deliverableMap.get("risk_audit");
	const complexityDel = deliverableMap.get("complexity_score");

	const processName = session.processDefinition?.name ?? "Proceso";
	const auditData = auditDel?.status === "completed" ? (auditDel.data as any) : null;
	const complexityData = complexityDel?.status === "completed" ? (complexityDel.data as any) : null;
	const summaryData = summaryDel?.status === "completed" ? (summaryDel.data as any) : null;
	const riskData = riskDel?.status === "completed" ? (riskDel.data as any) : null;
	const raciData = raciDel?.status === "completed" ? (raciDel.data as any) : null;

	const sipocCoverage = auditData?.updatedScores ? computeSipocCoverage(auditData.updatedScores) : null;
	const confirmedNodes = session.diagramNodes.filter((n) => n.state === "CONFIRMED");

	return (
		<div className="min-h-screen bg-stone-50">
			{/* Branding banner */}
			<div className="bg-stone-900 border-b border-stone-800 px-4 py-2 md:px-6">
				<div className="mx-auto max-w-5xl flex items-center justify-between">
					<span className="text-xs text-stone-400">
						Powered by <span className="font-semibold text-stone-200">Auditora.ai</span>
					</span>
					<a
						href="https://auditora.ai"
						className="text-xs text-blue-400 hover:text-blue-300"
						target="_blank"
						rel="noopener noreferrer"
					>
						Conocer mas
					</a>
				</div>
			</div>

			{/* Hero */}
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

			{/* Body */}
			<main className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-8">
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

				{auditData?.updatedScores && (
					<SipocDashboard
						updatedScores={auditData.updatedScores}
						gaps={auditData.newGaps || []}
					/>
				)}

				{summaryData && (
					<section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
						<div className="border-b border-stone-100 px-4 py-4 md:px-6">
							<h2 className="text-lg text-stone-900" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
								Resumen Ejecutivo
							</h2>
						</div>
						<div className="px-4 py-4 space-y-4 md:px-6 md:py-5">
							<p className="text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">{summaryData.summary}</p>
							{summaryData.actionItems?.length > 0 && (
								<div>
									<h3 className="mb-2 text-sm font-medium text-stone-700">Acciones Pendientes</h3>
									<ul className="space-y-1.5">
										{summaryData.actionItems.map((item: string, i: number) => (
											<li key={i} className="flex items-start gap-2 text-sm text-stone-600">
												<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-200 text-xs text-stone-400">
													{i + 1}
												</span>
												{item}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</section>
				)}

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

				{riskData && (
					<RiskHeatMap
						risks={riskData.newRisks || []}
						summary={riskData.riskSummary || { totalRiskScore: 0, criticalCount: 0, highCount: 0, topRiskArea: "" }}
					/>
				)}

				{auditData && (
					<NextSessionIntel
						followUp={auditData.followUpSuggestion || null}
						gapCount={auditData.newGaps?.length || 0}
					/>
				)}
			</main>

			{/* Footer */}
			<footer className="border-t border-stone-200 bg-white">
				<div className="mx-auto max-w-5xl px-4 py-4 md:px-6 space-y-3">
					<p className="text-[10px] text-stone-400 text-center leading-relaxed">
						Este reporte fue generado por inteligencia artificial. Los análisis y recomendaciones son puntos de partida analíticos y no constituyen asesoramiento profesional, legal ni financiero. Los resultados deben ser validados por profesionales calificados antes de tomar decisiones de negocio. Auditora.ai no asume responsabilidad por decisiones basadas en este reporte.
					</p>
					<p className="text-xs text-stone-400 text-center">
						Generado por Auditora.ai · Reporte de Inteligencia de Proceso
					</p>
				</div>
			</footer>
		</div>
	);
}
