"use client";

import { useTranslations } from "next-intl";
import { AlertTriangleIcon, ArrowRightIcon, ShieldAlertIcon } from "lucide-react";
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
					<div className="mb-8 overflow-hidden rounded-lg border border-orientation/20 bg-orientation-subtle/30 px-4 py-3">
						<div className="flex items-center gap-3">
							<span className="relative flex size-3">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-orientation opacity-40" />
								<span className="relative inline-flex size-3 rounded-full bg-orientation" />
							</span>
							<span className="text-sm font-medium text-foreground">{statusMessage}</span>
						</div>
						<div
							className="mt-2 h-0.5 w-full rounded-full animate-shimmer"
							style={{
								backgroundImage: "linear-gradient(90deg, transparent, var(--palette-orientation), transparent)",
								backgroundSize: "200% 100%",
							}}
						/>
					</div>
				)}

				{/* Industry header */}
				{industry && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2">
						<span className="mb-2 inline-block rounded-full border border-orientation bg-orientation-subtle px-3 py-1 text-xs font-medium text-orientation">
							{industry.industry}
						</span>
						<h1 className="text-3xl md:text-5xl tracking-tight font-display text-foreground">
							{industry.selectedProcess.name}
						</h1>
						<p className="mt-2 text-base leading-relaxed text-muted-foreground">
							{industry.selectedProcess.description}
						</p>
					</div>
				)}

				{/* Risk score hero banner — the editorial "wow" moment */}
				{risks && (
					<div
						className="mb-8 animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-xl border border-chrome-border bg-chrome-base"
						style={{ animationDelay: "200ms" }}
					>
						<div className="flex items-stretch">
							{/* Giant risk score */}
							<div className="flex flex-col items-center justify-center border-r border-chrome-border px-8 py-6 md:px-12">
								<ShieldAlertIcon className="mb-2 size-5 text-destructive" />
								<p className="font-display text-5xl md:text-6xl font-bold text-destructive">
									{risks.riskSummary.totalRiskScore}
								</p>
								<p className="mt-1 text-xs font-medium uppercase tracking-wider text-chrome-text-muted">
									{t("totalScore")}
								</p>
							</div>

							{/* Severity breakdown */}
							<div className="flex flex-1 flex-col justify-center gap-3 px-6 py-6">
								<div className="flex items-center gap-3">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-destructive/20 text-sm font-bold text-destructive">
										{risks.riskSummary.criticalCount}
									</span>
									<div>
										<p className="text-sm font-semibold text-chrome-text">{t("critical")}</p>
										<p className="text-xs text-chrome-text-muted">{t("highestRiskArea")}: {risks.riskSummary.topRiskArea}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-orientation/20 text-sm font-bold text-orientation">
										{risks.riskSummary.highCount}
									</span>
									<p className="text-sm font-semibold text-chrome-text">{t("high")}</p>
								</div>
								<div className="flex items-center gap-3">
									<span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
										{risks.newRisks.length - risks.riskSummary.criticalCount - risks.riskSummary.highCount}
									</span>
									<p className="text-sm font-semibold text-chrome-text">{t("medium")} / {t("low")}</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* SIPOC table */}
				{sipoc && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "300ms" }}>
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

				{/* Risk cards */}
				{risks && (
					<div className="mb-8 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: "400ms" }}>
						<h2 className="mb-4 text-2xl font-display text-foreground">
							{t("risksIdentified")}
						</h2>
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

				{/* CTA to deepen — dramatic, dark */}
				{status === "complete" && (
					<div
						className="animate-in fade-in slide-in-from-bottom-4 mt-6 overflow-hidden rounded-xl border border-chrome-border bg-chrome-base p-8 text-center"
						style={{ animationDelay: "600ms" }}
					>
						<AlertTriangleIcon className="mx-auto mb-3 size-8 text-orientation" />
						<h3 className="mb-2 text-2xl font-display text-chrome-text">
							{t("firstScan")}
						</h3>
						<p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-chrome-text-secondary">
							{t("deepenCta")}
						</p>
						<button
							type="button"
							onClick={onDeepen}
							className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-all hover:bg-action-hover"
						>
							{t("deepenButton")}
							<ArrowRightIcon className="size-4" />
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
