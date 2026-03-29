"use client";

import { useTranslations } from "next-intl";
import type { SipocResult } from "@repo/ai";
import type { RiskData } from "@radiografia/lib/types";
import { RiskCard } from "./RiskCard";

const SIPOC_COLS = ["suppliers", "inputs", "processSteps", "outputs", "customers"] as const;
const SIPOC_KEYS: Record<string, string> = {
	suppliers: "suppliers",
	inputs: "inputs",
	processSteps: "process",
	outputs: "outputs",
	customers: "customers",
};

interface DeepRiskReportProps {
	processName: string;
	industry: string;
	sipoc: SipocResult;
	risks: RiskData;
	instantRisksCount: number;
	onConvert: () => void;
}

export function DeepRiskReport({
	processName,
	industry,
	sipoc,
	risks,
	instantRisksCount,
	onConvert,
}: DeepRiskReportProps) {
	const t = useTranslations("scan");
	const deepRisksCount = risks.newRisks.length;
	const improvement = deepRisksCount - instantRisksCount;

	return (
		<div className="min-h-screen bg-background px-4 py-12">
			<div className="mx-auto max-w-3xl">
				{/* Header */}
				<div className="mb-8">
					<span className="mb-2 inline-block rounded-full border border-[#D97706] bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#D97706]">
						{industry}
					</span>
					<h1 className="text-5xl tracking-tight font-display text-foreground">
						{t("completeScan")}
					</h1>
					<p className="mt-1 text-lg text-muted-foreground">{processName}</p>
				</div>

				{/* Improvement callout */}
				{improvement > 0 && (
					<div className="mb-8 rounded-lg border-l-4 border-l-primary bg-accent px-5 py-4">
						<p className="text-sm font-medium text-foreground">
							{t("additionalRisks", { count: improvement })}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("initialVsDeep", { initial: instantRisksCount, deep: deepRisksCount })}
						</p>
					</div>
				)}

				{/* Summary bar */}
				<div className="mb-8 flex items-center gap-6 rounded-lg border border-border bg-secondary p-5">
					<div className="text-center">
						<p className="text-4xl font-bold text-destructive">{risks.riskSummary.totalRiskScore}</p>
						<p className="text-xs text-muted-foreground">{t("totalScore")}</p>
					</div>
					<div className="text-center">
						<p className="text-4xl font-bold text-destructive">{risks.riskSummary.criticalCount}</p>
						<p className="text-xs text-muted-foreground">{t("critical")}</p>
					</div>
					<div className="text-center">
						<p className="text-4xl font-bold text-[#D97706]">{risks.riskSummary.highCount}</p>
						<p className="text-xs text-muted-foreground">{t("high")}</p>
					</div>
					<div className="flex-1 text-right">
						<p className="text-sm font-medium text-foreground">{t("highestRiskArea")}</p>
						<p className="text-sm text-muted-foreground">{risks.riskSummary.topRiskArea}</p>
					</div>
				</div>

				{/* SIPOC table */}
				<div className="mb-8">
					<h2 className="mb-4 text-2xl font-display text-foreground">{t("sipocDetailed")}</h2>
					<div className="grid grid-cols-5 gap-px overflow-hidden rounded-lg border border-border">
						{SIPOC_COLS.map((col) => (
							<div key={col}>
								<div className="border-b border-border bg-secondary px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-foreground">
									{t(SIPOC_KEYS[col]!)}
								</div>
								<div className="space-y-0.5 bg-secondary p-2">
									{col === "processSteps"
										? sipoc.processSteps.map((item, i) => (
												<p key={i} className="text-xs leading-relaxed text-foreground/80">
													{item.order}. {item.name}
												</p>
										  ))
										: (sipoc[col] as Array<{ name: string }>).map((item, i) => (
												<p key={i} className="text-xs leading-relaxed text-foreground/80">
													{item.name}
												</p>
										  ))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Risk cards */}
				<div className="mb-8">
					<h2 className="mb-4 text-2xl font-display text-foreground">{t("riskRegistry")}</h2>
					<div className="space-y-4">
						{risks.newRisks
							.sort((a, b) => b.severity * b.probability - a.severity * a.probability)
							.map((risk, i) => (
								<RiskCard key={i} risk={risk} index={i} />
							))}
					</div>
				</div>

				{/* Conversion CTA */}
				<div className="rounded-xl border-2 border-primary bg-accent p-8 text-center">
					<h3 className="mb-2 text-xl font-display text-foreground">{t("saveScan")}</h3>
					<p className="mb-6 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
						{t("saveDescription", { count: deepRisksCount, process: processName })}
					</p>
					<button
						type="button"
						onClick={onConvert}
						className="min-h-[44px] rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
					>
						{t("createAccount")}
					</button>
				</div>
			</div>
		</div>
	);
}
