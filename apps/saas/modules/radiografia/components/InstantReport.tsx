"use client";

import { useTranslations } from "next-intl";
import type { SipocResult } from "@repo/ai";
import type { IndustryInferenceResult } from "@radiografia/lib/industry-inference";
import type { DiagramNode } from "@radiografia/lib/sipoc-to-nodes";
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

interface InstantReportProps {
	industry: IndustryInferenceResult | null;
	sipoc: SipocResult | null;
	nodes: DiagramNode[] | null;
	risks: RiskData | null;
	status: "streaming" | "complete" | "error";
	statusMessage: string;
	onDeepen: () => void;
}

export function InstantReport({
	industry,
	sipoc,
	risks,
	status,
	statusMessage,
	onDeepen,
}: InstantReportProps) {
	const t = useTranslations("scan");

	return (
		<div className="min-h-screen bg-background px-4 py-12">
			<div className="mx-auto max-w-3xl">
				{/* Status indicator */}
				{status === "streaming" && (
					<div className="mb-8 flex items-center gap-3 text-sm text-muted-foreground">
						<span className="h-2 w-2 animate-pulse rounded-full bg-[#D97706]" />
						{statusMessage}
					</div>
				)}

				{/* Industry header */}
				{industry && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2">
						<span className="mb-2 inline-block rounded-full border border-[#D97706] bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#D97706]">
							{industry.industry}
						</span>
						<h1 className="text-3xl md:text-5xl tracking-tight font-display text-foreground">
							{industry.selectedProcess.name}
						</h1>
						<p className="mt-2 text-base leading-relaxed text-stone-600 dark:text-stone-400">
							{industry.selectedProcess.description}
						</p>
					</div>
				)}

				{/* SIPOC table */}
				{sipoc && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "200ms" }}>
						<h2 className="mb-4 text-2xl font-display text-foreground">
							{t("sipocAnalysis")}
						</h2>
						<div className="space-y-3 md:space-y-0 md:grid md:grid-cols-5 md:gap-px md:overflow-hidden md:rounded-lg md:border md:border-border">
							{SIPOC_COLS.map((col) => (
								<div key={col} className="overflow-hidden rounded-lg border border-border md:rounded-none md:border-0">
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
				)}

				{/* Risk report */}
				{risks && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "400ms" }}>
						<h2 className="mb-4 text-2xl font-display text-foreground">
							{t("risksIdentified")}
						</h2>

						{/* Summary bar */}
						<div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary p-4 md:flex md:items-center md:gap-6">
							<div className="text-center">
								<p className="text-2xl md:text-3xl font-bold text-destructive">
									{risks.riskSummary.totalRiskScore}
								</p>
								<p className="text-xs text-muted-foreground">{t("totalScore")}</p>
							</div>
							<div className="text-center">
								<p className="text-2xl md:text-3xl font-bold text-destructive">
									{risks.riskSummary.criticalCount}
								</p>
								<p className="text-xs text-muted-foreground">{t("critical")}</p>
							</div>
							<div className="text-center">
								<p className="text-2xl md:text-3xl font-bold text-[#D97706]">
									{risks.riskSummary.highCount}
								</p>
								<p className="text-xs text-muted-foreground">{t("high")}</p>
							</div>
							<div className="text-center md:flex-1 md:text-right">
								<p className="text-sm font-medium text-foreground">{t("highestRiskArea")}</p>
								<p className="text-sm text-muted-foreground">
									{risks.riskSummary.topRiskArea}
								</p>
							</div>
						</div>

						{/* Risk cards */}
						<div className="space-y-4">
							{risks.newRisks.map((risk, i) => (
								<RiskCard key={i} risk={risk} index={i} />
							))}
						</div>
					</div>
				)}

				{/* AI Disclaimer */}
				{status === "complete" && (
					<div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-center">
						<p className="text-xs text-muted-foreground">
							{t("aiDisclaimer")}
						</p>
					</div>
				)}

				{/* CTA to deepen */}
				{status === "complete" && (
					<div
						className="animate-in fade-in slide-in-from-bottom-4 rounded-xl border-2 border-primary bg-accent p-8 text-center"
						style={{ animationDelay: "600ms" }}
					>
						<h3 className="mb-2 text-xl font-display text-foreground">
							{t("firstScan")}
						</h3>
						<p className="mb-6 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
							{t("deepenCta")}
						</p>
						<button
							type="button"
							onClick={onDeepen}
							className="min-h-[44px] rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
						>
							{t("deepenButton")}
						</button>
					</div>
				)}

				{/* Error state */}
				{status === "error" && (
					<div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
						<p className="text-sm text-destructive">{statusMessage}</p>
					</div>
				)}
			</div>
		</div>
	);
}
