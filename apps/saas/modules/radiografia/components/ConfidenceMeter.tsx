"use client";

import { useTranslations } from "next-intl";

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface ConfidenceMeterProps {
	score: number;
	coverage?: SipocCoverage | null;
	threshold?: number;
}

const SEGMENTS = [
	{ key: "suppliers", label: "S" },
	{ key: "inputs", label: "I" },
	{ key: "process", label: "P" },
	{ key: "outputs", label: "O" },
	{ key: "customers", label: "C" },
] as const;

export function ConfidenceMeter({ score, coverage, threshold = 70 }: ConfidenceMeterProps) {
	const t = useTranslations("scan");
	const isReady = score >= threshold;

	return (
		<div className="rounded-lg border border-border bg-card p-4">
			{/* Circular progress */}
			<div className="relative mx-auto mb-3 h-20 w-20">
				<svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
					<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
					<circle
						cx="50" cy="50" r="42" fill="none"
						stroke={isReady ? "var(--success)" : "#D97706"}
						strokeWidth="6" strokeLinecap="round"
						strokeDasharray={`${(score / 100) * 264} 264`}
						className="transition-all duration-500"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-lg font-bold" style={{ color: isReady ? "var(--success)" : "#D97706" }}>
						{score}%
					</span>
				</div>
			</div>

			<p className="mb-3 text-center text-xs text-muted-foreground">
				{isReady ? t("readyForDiagram") : t("keepAnswering")}
			</p>

			{/* SIPOC segment bars */}
			{coverage && (
				<div className="space-y-1.5">
					{SEGMENTS.map(({ key, label }) => {
						const value = coverage[key as keyof SipocCoverage] || 0;
						return (
							<div key={key} className="flex items-center gap-2">
								<span className="w-4 text-center text-xs font-bold text-[#D97706]" title={t(key as any)}>
									{label}
								</span>
								<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
									<div
										className="h-full rounded-full transition-all duration-500"
										style={{
											width: `${Math.min(value, 100)}%`,
											backgroundColor: value >= 70 ? "var(--success)" : "#D97706",
										}}
									/>
								</div>
								<span className="w-8 text-right text-xs text-muted-foreground">{value}</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
