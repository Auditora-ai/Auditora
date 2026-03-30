"use client";

import { useTranslations } from "next-intl";
import { ShieldAlertIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ConfidenceMeter } from "../ConfidenceMeter";
import type { RiskData } from "@radiografia/lib/types";

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface ExploracionSidebarProps {
	completenessScore: number;
	sipocCoverage: SipocCoverage | null;
	risks: RiskData | null;
	onViewResults: () => void;
	canViewResults: boolean;
	loading: boolean;
}

export function ExploracionSidebar({
	completenessScore,
	sipocCoverage,
	risks,
	onViewResults,
	canViewResults,
	loading,
}: ExploracionSidebarProps) {
	const t = useTranslations("scan");

	return (
		<>
			{/* Desktop sidebar */}
			<div className="hidden w-72 shrink-0 flex-col gap-4 border-l border-border bg-card p-5 md:flex">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{t("processCoverage")}
				</h3>

				<ConfidenceMeter
					score={completenessScore}
					coverage={sipocCoverage}
					threshold={70}
				/>

				{/* Risk summary */}
				{risks && (
					<div className="rounded-lg border border-border bg-background p-4 animate-in fade-in duration-500">
						<div className="flex items-center gap-2 mb-3">
							<ShieldAlertIcon className="size-4 text-destructive" />
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{t("v2.risksDetected", { count: risks.newRisks.length })}
							</span>
						</div>

						<div className="space-y-2">
							{risks.riskSummary.criticalCount > 0 && (
								<div className="flex items-center gap-2">
									<span className="inline-flex size-6 items-center justify-center rounded bg-destructive/20 text-xs font-bold text-destructive">
										{risks.riskSummary.criticalCount}
									</span>
									<span className="text-xs text-foreground">{t("critical")}</span>
								</div>
							)}
							{risks.riskSummary.highCount > 0 && (
								<div className="flex items-center gap-2">
									<span className="inline-flex size-6 items-center justify-center rounded bg-orientation/20 text-xs font-bold text-orientation">
										{risks.riskSummary.highCount}
									</span>
									<span className="text-xs text-foreground">{t("high")}</span>
								</div>
							)}
							{(risks.newRisks.length - risks.riskSummary.criticalCount - risks.riskSummary.highCount) > 0 && (
								<div className="flex items-center gap-2">
									<span className="inline-flex size-6 items-center justify-center rounded bg-primary/20 text-xs font-bold text-primary">
										{risks.newRisks.length - risks.riskSummary.criticalCount - risks.riskSummary.highCount}
									</span>
									<span className="text-xs text-foreground">{t("medium")} / {t("low")}</span>
								</div>
							)}
						</div>

						<p className="mt-2 text-[10px] text-muted-foreground">
							{t("highestRiskArea")}: {risks.riskSummary.topRiskArea}
						</p>
					</div>
				)}

				{/* Loading indicator */}
				{loading && !risks && (
					<div className="rounded-lg border border-orientation/20 bg-orientation-subtle/30 p-3">
						<div className="flex items-center gap-2">
							<span className="relative flex size-2">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-orientation opacity-40" />
								<span className="relative inline-flex size-2 rounded-full bg-orientation" />
							</span>
							<span className="text-xs text-foreground">{t("v2.analyzing")}</span>
						</div>
					</div>
				)}

				<div className="mt-auto">
					<Button
						onClick={onViewResults}
						disabled={!canViewResults}
						className="w-full gap-2"
					>
						{t("v2.viewResults")}
						<ArrowRightIcon className="size-4" />
					</Button>
				</div>
			</div>

			{/* Mobile floating pill */}
			<div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 md:hidden">
				<button
					type="button"
					onClick={onViewResults}
					disabled={!canViewResults}
					className="flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all disabled:opacity-50"
				>
					<span className="text-xs font-medium text-foreground">
						{completenessScore}%
					</span>
					{risks && (
						<>
							<span className="size-1 rounded-full bg-border" />
							<span className="text-xs text-destructive font-medium">
								{risks.newRisks.length} {t("risksIdentified").toLowerCase()}
							</span>
						</>
					)}
					<ArrowRightIcon className="size-3.5 text-primary" />
				</button>
			</div>
		</>
	);
}
