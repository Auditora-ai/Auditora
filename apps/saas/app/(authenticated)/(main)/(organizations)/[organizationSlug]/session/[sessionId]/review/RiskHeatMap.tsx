"use client";

import { useState } from "react";
import { ReportSection } from "./ReportSection";

interface RiskItem {
	title: string;
	description: string;
	riskType: string;
	severity: number;
	probability: number;
	affectedStep?: string;
	isOpportunity: boolean;
	suggestedMitigations: string[];
}

interface RiskSummary {
	totalRiskScore: number;
	criticalCount: number;
	highCount: number;
	topRiskArea: string;
}

interface RiskHeatMapProps {
	risks: RiskItem[];
	summary: RiskSummary;
	actions?: React.ReactNode;
}

const SEVERITY_LABELS = ["", "Insignificante", "Menor", "Moderado", "Mayor", "Catastrofico"];
const PROBABILITY_LABELS = ["", "Raro", "Improbable", "Posible", "Probable", "Casi seguro"];

function cellColor(severity: number, probability: number): string {
	const score = severity * probability;
	if (score >= 15) return "bg-red-600 text-white";
	if (score >= 10) return "bg-orange-500 text-white";
	if (score >= 5) return "bg-amber-500 text-white";
	if (score >= 2) return "bg-yellow-400 text-stone-900";
	return "bg-green-200 text-green-900";
}

function severityBadge(severity: number): { text: string; classes: string } {
	if (severity >= 4) return { text: "Critico", classes: "bg-red-100 text-red-700" };
	if (severity >= 3) return { text: "Alto", classes: "bg-orange-100 text-orange-700" };
	if (severity >= 2) return { text: "Medio", classes: "bg-amber-100 text-amber-700" };
	return { text: "Bajo", classes: "bg-green-100 text-green-700" };
}

export function RiskHeatMap({ risks, summary, actions }: RiskHeatMapProps) {
	const [selectedCell, setSelectedCell] = useState<{ s: number; p: number } | null>(null);

	const actualRisks = risks.filter((r) => !r.isOpportunity);
	const opportunities = risks.filter((r) => r.isOpportunity);

	// Fix: if newRisks is empty but summary has counts, data is inconsistent
	const dataInconsistent = actualRisks.length === 0 && (summary.criticalCount > 0 || summary.highCount > 0);
	const effectiveSummary = actualRisks.length === 0
		? { totalRiskScore: 0, criticalCount: 0, highCount: 0, topRiskArea: "" }
		: summary;

	// Build heat map grid
	const grid: Map<string, RiskItem[]> = new Map();
	for (const risk of actualRisks) {
		const key = `${risk.severity}-${risk.probability}`;
		if (!grid.has(key)) grid.set(key, []);
		grid.get(key)!.push(risk);
	}

	const filteredRisks = selectedCell
		? actualRisks.filter((r) => r.severity === selectedCell.s && r.probability === selectedCell.p)
		: actualRisks;

	return (
		<>
			<ReportSection title="Mapa de Riesgos" actions={actions}>
				{/* Inconsistency banner */}
				{dataInconsistent && (
					<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						Los datos de riesgo estan incompletos. Intenta regenerar el analisis de riesgos.
					</div>
				)}

				{/* Summary cards */}
				<div className="grid grid-cols-4 gap-3 mb-6">
					<SummaryCard value={effectiveSummary.totalRiskScore} label="Score Total" variant="default" />
					<SummaryCard value={effectiveSummary.criticalCount} label="Criticos" variant="critical" />
					<SummaryCard value={effectiveSummary.highCount} label="Altos" variant="high" />
					<SummaryCard value={(effectiveSummary.topRiskArea ?? "").replace(/_/g, " ") || "—"} label="Area Principal" variant="default" isText />
				</div>

				{/* Heat map grid */}
				{actualRisks.length > 0 && (
					<div className="mb-6">
						<div className="flex gap-2">
							<div className="flex flex-col justify-center items-center w-6">
								<span className="text-[10px] text-stone-400 -rotate-90 whitespace-nowrap">
									Severidad
								</span>
							</div>
							<div>
								<div className="grid grid-cols-5 gap-1">
									{[5, 4, 3, 2, 1].map((s) =>
										[1, 2, 3, 4, 5].map((p) => {
											const key = `${s}-${p}`;
											const count = grid.get(key)?.length || 0;
											const isSelected = selectedCell?.s === s && selectedCell?.p === p;
											return (
												<button
													key={key}
													type="button"
													onClick={() => setSelectedCell(count > 0 ? (isSelected ? null : { s, p }) : null)}
													className={`w-10 h-10 rounded text-xs font-medium flex items-center justify-center transition-all ${cellColor(s, p)} ${count > 0 ? "cursor-pointer ring-1 ring-inset ring-white/30" : "cursor-default opacity-50"} ${isSelected ? "ring-2 ring-stone-900 scale-110 z-10" : ""}`}
													title={`${SEVERITY_LABELS[s]} x ${PROBABILITY_LABELS[p]}: ${count} riesgo(s)`}
												>
													{count > 0 ? count : ""}
												</button>
											);
										}),
									)}
								</div>
								<p className="text-[10px] text-stone-400 text-center mt-1">Probabilidad</p>
							</div>
						</div>
					</div>
				)}

				{/* Risk list */}
				{filteredRisks.length > 0 ? (
					<div className="space-y-2">
						{selectedCell && (
							<p className="text-xs text-stone-500 mb-2">
								Mostrando: {SEVERITY_LABELS[selectedCell.s]} x {PROBABILITY_LABELS[selectedCell.p]}
								<button type="button" onClick={() => setSelectedCell(null)} className="ml-2 text-blue-600 hover:underline">
									Ver todos
								</button>
							</p>
						)}
						{filteredRisks.map((risk, i) => (
							<RiskCard key={i} risk={risk} />
						))}
					</div>
				) : !dataInconsistent ? (
					<p className="text-sm text-stone-400">No se identificaron riesgos en esta sesion.</p>
				) : null}
			</ReportSection>

			{/* Opportunities Section */}
			{opportunities.length > 0 && (
				<ReportSection title="Oportunidades">
					<p className="mb-4 text-sm text-stone-500">
						{opportunities.length} oportunidad(es) identificadas
					</p>
					<div className="space-y-2">
						{opportunities.map((opp, i) => (
							<div key={i} className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
										Oportunidad
									</span>
									<span className="text-xs text-stone-500">{(opp.riskType ?? "").replace(/_/g, " ")}</span>
								</div>
								<p className="text-sm font-medium text-stone-800">{opp.title}</p>
								<p className="mt-0.5 text-sm text-stone-600">{opp.description}</p>
								{(opp.suggestedMitigations?.length ?? 0) > 0 && (
									<div className="mt-2">
										<p className="text-xs font-medium text-green-700">Acciones sugeridas:</p>
										<ul className="mt-1 list-disc list-inside text-xs text-green-700">
											{(opp.suggestedMitigations ?? []).map((m, j) => (
												<li key={j}>{m}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						))}
					</div>
				</ReportSection>
			)}
		</>
	);
}

function RiskCard({ risk }: { risk: RiskItem }) {
	const sev = severityBadge(risk.severity);
	return (
		<div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
			<div className="mb-1.5 flex items-center gap-2">
				<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sev.classes}`}>
					{sev.text}
				</span>
				<span className="text-xs text-stone-500">{(risk.riskType ?? "").replace(/_/g, " ")}</span>
			</div>
			<p className="text-sm font-medium text-stone-800">{risk.title}</p>
			<p className="mt-0.5 text-sm text-stone-500">{risk.description}</p>
			{risk.affectedStep && (
				<p className="mt-1 text-xs text-stone-400">Paso afectado: {risk.affectedStep}</p>
			)}
			{(risk.suggestedMitigations?.length ?? 0) > 0 && (
				<div className="mt-2">
					<p className="text-xs font-medium text-stone-500">Mitigaciones:</p>
					<ul className="mt-1 list-disc list-inside text-xs text-stone-500">
						{(risk.suggestedMitigations ?? []).map((m, j) => (
							<li key={j}>{m}</li>
						))}
					</ul>
				</div>
			)}
			<div className="mt-2 flex gap-3 text-xs text-stone-400">
				<span>Severidad: {risk.severity}/5</span>
				<span>Probabilidad: {risk.probability}/5</span>
				<span>RPN: {risk.severity * risk.probability}</span>
			</div>
		</div>
	);
}

function SummaryCard({ value, label, variant, isText }: { value: number | string; label: string; variant: "default" | "critical" | "high"; isText?: boolean }) {
	const styles = { default: "border-stone-200 bg-stone-50", critical: "border-red-200 bg-red-50", high: "border-amber-200 bg-amber-50" };
	const valueStyles = { default: "text-stone-800", critical: "text-red-700", high: "text-amber-700" };
	return (
		<div className={`rounded-lg border p-3 text-center ${styles[variant]}`}>
			<p className={`${isText ? "text-sm" : "text-2xl"} font-semibold ${valueStyles[variant]}`}>{value}</p>
			<p className="text-xs text-stone-500">{label}</p>
		</div>
	);
}
