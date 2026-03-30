import { ReportSection } from "./ReportSection";

/**
 * SIPOC Coverage Dashboard
 *
 * 5 horizontal progress bars showing coverage per SIPOC dimension.
 * Derived from process_audit deliverable's updatedScores + newGaps.
 */

interface SipocGap {
	category: string;
	question: string;
}

interface SipocDashboardProps {
	updatedScores: Record<string, number>;
	gaps: SipocGap[];
}

interface SipocDimension {
	key: string;
	label: string;
	labelEs: string;
	scoreKeys: string[];
	gapCategories: string[];
	weight: number;
}

const SIPOC_DIMENSIONS: SipocDimension[] = [
	{ key: "suppliers", label: "Suppliers", labelEs: "Proveedores", scoreKeys: ["roles"], gapCategories: ["MISSING_ROLE"], weight: 0.15 },
	{ key: "inputs", label: "Inputs", labelEs: "Entradas", scoreKeys: ["triggers", "formats"], gapCategories: ["MISSING_TRIGGER"], weight: 0.2 },
	{ key: "process", label: "Process", labelEs: "Proceso", scoreKeys: ["steps", "decisions", "exceptions"], gapCategories: ["MISSING_PATH", "MISSING_DECISION", "MISSING_EXCEPTION"], weight: 0.3 },
	{ key: "outputs", label: "Outputs", labelEs: "Salidas", scoreKeys: ["outputs"], gapCategories: ["MISSING_OUTPUT"], weight: 0.2 },
	{ key: "customers", label: "Customers", labelEs: "Clientes", scoreKeys: ["interProcessLinks"], gapCategories: ["UNCLEAR_HANDOFF"], weight: 0.15 },
];

// Normalize: if any value > 1, scores are 0-100 integers; else 0-1 floats
function normalizeScore(value: number, isPercentScale: boolean): number {
	return isPercentScale ? value : value * 100;
}

export function computeSipocCoverage(updatedScores: Record<string, number>): number {
	const isPercentScale = Object.values(updatedScores).some((v) => v > 1);
	let totalWeighted = 0;
	let totalWeight = 0;
	for (const dim of SIPOC_DIMENSIONS) {
		const scores = dim.scoreKeys.map((k) => updatedScores[k] ?? 0);
		const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
		totalWeighted += normalizeScore(avg, isPercentScale) * dim.weight;
		totalWeight += dim.weight;
	}
	return totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
}

function dimensionScore(dim: SipocDimension, scores: Record<string, number>): number {
	const isPercentScale = Object.values(scores).some((v) => v > 1);
	const vals = dim.scoreKeys.map((k) => scores[k] ?? 0);
	if (vals.length === 0) return 0;
	const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
	return Math.round(normalizeScore(avg, isPercentScale));
}

function barColor(pct: number): string {
	if (pct >= 75) return "bg-green-500";
	if (pct >= 50) return "bg-amber-500";
	if (pct >= 25) return "bg-orange-500";
	return "bg-red-500";
}

export function SipocDashboard({ updatedScores, gaps, actions }: SipocDashboardProps & { actions?: React.ReactNode }) {
	const overallCoverage = computeSipocCoverage(updatedScores);
	const hasData = Object.keys(updatedScores).length > 0;

	if (!hasData) {
		return (
			<ReportSection title="Cobertura SIPOC" actions={actions}>
				<p className="text-sm text-slate-400">Analisis de cobertura pendiente.</p>
			</ReportSection>
		);
	}

	return (
		<ReportSection title="Cobertura SIPOC" actions={actions}>
			<p className="mb-5 text-sm text-slate-500">
				Cobertura global: <span className="font-semibold text-slate-800">{overallCoverage}%</span>
			</p>
			<div className="space-y-4">
				{SIPOC_DIMENSIONS.map((dim) => {
					const pct = dimensionScore(dim, updatedScores);
					const dimGaps = gaps.filter((g) => dim.gapCategories.includes(g.category));
					return (
						<div key={dim.key}>
							<div className="flex items-center justify-between mb-1.5">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-slate-700">
										{dim.labelEs}
									</span>
									<span className="text-xs text-slate-400">
										({dim.label})
									</span>
									<span className="text-xs text-slate-400">
										{Math.round(dim.weight * 100)}%
									</span>
								</div>
								<span className="text-sm font-semibold text-slate-800">
									{pct}%
								</span>
							</div>
							<div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
								<div
									className={`h-full rounded-full transition-all ${barColor(pct)}`}
									style={{ width: `${pct}%` }}
								/>
							</div>
							{dimGaps.length > 0 && (
								<div className="mt-1.5 space-y-1">
									{dimGaps.slice(0, 3).map((gap, i) => (
										<p key={i} className="text-xs text-slate-500 pl-2 border-l-2 border-slate-200">
											{gap.question}
										</p>
									))}
									{dimGaps.length > 3 && (
										<p className="text-xs text-slate-400 pl-2">
											+{dimGaps.length - 3} mas
										</p>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</ReportSection>
	);
}

