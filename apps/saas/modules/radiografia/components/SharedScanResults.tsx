"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	ShieldAlertIcon,
	LinkIcon,
	ArrowRightIcon,
	Loader2Icon,
	AlertTriangleIcon,
	ClockIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import type { RiskData } from "@radiografia/lib/types";
import { RiskCard } from "./RiskCard";
import { ScanHeader } from "./ScanHeader";

interface SharedScanData {
	industry: string | null;
	processName: string | null;
	sipocData: Record<string, unknown> | null;
	riskResults: RiskData | null;
	createdAt: string;
}

type LoadingState = "loading" | "loaded" | "not-found" | "expired" | "error";

const SIPOC_COLS = ["suppliers", "inputs", "processSteps", "outputs", "customers"] as const;
const SIPOC_LABELS: Record<string, string> = {
	suppliers: "Proveedores",
	inputs: "Entradas",
	processSteps: "Proceso",
	outputs: "Salidas",
	customers: "Clientes",
};

export function SharedScanResults() {
	const t = useTranslations("scan");
	const { shareToken } = useParams<{ shareToken: string }>();
	const [state, setState] = useState<LoadingState>("loading");
	const [data, setData] = useState<SharedScanData | null>(null);

	// Theatrical reveal state
	const [revealedSections, setRevealedSections] = useState(0);
	const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!shareToken) return;

		fetch(`/api/public/scan/results/${shareToken}`)
			.then(async (res) => {
				if (res.status === 404) {
					setState("not-found");
					return;
				}
				if (res.status === 410) {
					setState("expired");
					return;
				}
				if (!res.ok) {
					setState("error");
					return;
				}
				const json = await res.json();
				setData(json);
				setState("loaded");
			})
			.catch(() => setState("error"));
	}, [shareToken]);

	// Progressive reveal: show sections one by one after data loads
	useEffect(() => {
		if (state !== "loaded") return;

		// 5 sections to reveal: header, risk-banner, sipoc, risks, cta
		let sectionIndex = 0;
		const delays = [200, 600, 1000, 1400, 1800];

		for (const delay of delays) {
			const timer = setTimeout(() => {
				sectionIndex++;
				setRevealedSections(sectionIndex);
			}, delay);
			revealTimerRef.current = timer;
		}

		return () => {
			if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
		};
	}, [state]);

	if (state === "loading") {
		return (
			<>
				<ScanHeader progress={0} />
				<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-12">
					<Loader2Icon className="size-8 animate-spin text-primary" />
					<p className="mt-4 text-sm text-muted-foreground">
						{t("v2.processing")}
					</p>
				</div>
			</>
		);
	}

	if (state === "not-found") {
		return (
			<>
				<ScanHeader progress={0} />
				<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-12 px-4">
					<AlertTriangleIcon className="size-12 text-muted-foreground/50" />
					<h2 className="mt-4 text-xl font-display font-semibold text-foreground">
						{t("share.notFound")}
					</h2>
					<p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
						{t("share.notFoundDesc")}
					</p>
					<Button
						className="mt-6 gap-2"
						onClick={() => (window.location.href = "/scan")}
					>
						{t("share.runYourOwn")}
						<ArrowRightIcon className="size-4" />
					</Button>
				</div>
			</>
		);
	}

	if (state === "expired") {
		return (
			<>
				<ScanHeader progress={0} />
				<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-12 px-4">
					<ClockIcon className="size-12 text-muted-foreground/50" />
					<h2 className="mt-4 text-xl font-display font-semibold text-foreground">
						{t("share.expired")}
					</h2>
					<p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
						{t("share.expiredDesc")}
					</p>
					<Button
						className="mt-6 gap-2"
						onClick={() => (window.location.href = "/scan")}
					>
						{t("share.runYourOwn")}
						<ArrowRightIcon className="size-4" />
					</Button>
				</div>
			</>
		);
	}

	if (state === "error" || !data) {
		return (
			<>
				<ScanHeader progress={0} />
				<div className="flex min-h-screen flex-col items-center justify-center bg-background pt-12 px-4">
					<AlertTriangleIcon className="size-12 text-destructive/50" />
					<h2 className="mt-4 text-xl font-display font-semibold text-foreground">
						{t("connectionError")}
					</h2>
					<Button
						variant="outline"
						className="mt-6"
						onClick={() => window.location.reload()}
					>
						{t("share.retry")}
					</Button>
				</div>
			</>
		);
	}

	const risks = data.riskResults;
	const sipoc = data.sipocData;

	return (
		<>
			<ScanHeader progress={100} />

			<div className="flex min-h-screen flex-col bg-background pt-12">
				<div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6 md:px-6 md:py-8">
					{/* Shared badge */}
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<LinkIcon className="size-3.5" />
						<span>{t("share.sharedResult")}</span>
						<span className="text-muted-foreground/50">·</span>
						<span>{new Date(data.createdAt).toLocaleDateString()}</span>
					</div>

					{/* Section 1: Industry header */}
					<div
						className={cn(
							"transition-all duration-700 ease-out",
							revealedSections >= 1
								? "translate-y-0 opacity-100"
								: "translate-y-8 opacity-0",
						)}
					>
						{data.industry && (
							<span className="mb-2 inline-block rounded-full border border-orientation bg-orientation-subtle px-3 py-1 text-xs font-medium text-orientation">
								{data.industry}
							</span>
						)}
						<h2 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
							{data.processName || t("v2.stepResultados")}
						</h2>
					</div>

					{/* Section 2: Risk score banner */}
					{risks && (
						<div
							className={cn(
								"transition-all duration-700 ease-out delay-100",
								revealedSections >= 2
									? "translate-y-0 opacity-100 scale-100"
									: "translate-y-8 opacity-0 scale-95",
							)}
						>
							<div className="overflow-hidden rounded-xl border border-chrome-border bg-chrome-base">
								<div className="flex items-stretch">
									<div className="flex flex-col items-center justify-center border-r border-chrome-border px-8 py-6 md:px-12">
										<ShieldAlertIcon className="mb-2 size-5 text-destructive" />
										<p className="font-display text-5xl md:text-6xl font-bold text-destructive">
											{risks.riskSummary.totalRiskScore}
										</p>
										<p className="mt-1 text-xs font-medium uppercase tracking-wider text-chrome-text-muted">
											{t("totalScore")}
										</p>
									</div>
									<div className="flex flex-1 flex-col justify-center gap-3 px-6 py-6">
										<div className="flex items-center gap-3">
											<span className="inline-flex size-8 items-center justify-center rounded-lg bg-destructive/20 text-sm font-bold text-destructive">
												{risks.riskSummary.criticalCount}
											</span>
											<div>
												<p className="text-sm font-semibold text-chrome-text">
													{t("critical")}
												</p>
												<p className="text-xs text-chrome-text-muted">
													{t("highestRiskArea")}:{" "}
													{risks.riskSummary.topRiskArea}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span className="inline-flex size-8 items-center justify-center rounded-lg bg-orientation/20 text-sm font-bold text-orientation">
												{risks.riskSummary.highCount}
											</span>
											<p className="text-sm font-semibold text-chrome-text">
												{t("high")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Section 3: SIPOC table */}
					{sipoc && (
						<div
							className={cn(
								"transition-all duration-700 ease-out",
								revealedSections >= 3
									? "translate-y-0 opacity-100"
									: "translate-y-8 opacity-0",
							)}
						>
							<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								SIPOC
							</h3>
							<div className="overflow-x-auto rounded-lg border border-border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border bg-accent/50">
											{SIPOC_COLS.map((col) => (
												<th
													key={col}
													className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
												>
													{SIPOC_LABELS[col]}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										<tr>
											{SIPOC_COLS.map((col) => {
												const items = (sipoc as Record<string, unknown>)[col];
												const list = Array.isArray(items) ? items : [];
												return (
													<td
														key={col}
														className="px-3 py-3 align-top text-foreground/80"
													>
														{list.length > 0 ? (
															<ul className="space-y-1">
																{list.map(
																	(
																		item:
																			| string
																			| { name?: string; step?: string },
																		j: number,
																	) => (
																		<li
																			key={j}
																			className="text-xs leading-relaxed"
																		>
																			{typeof item === "string"
																				? item
																				: (
																						item as {
																							name?: string;
																							step?: string;
																						}
																					).name ||
																					(
																						item as {
																							name?: string;
																							step?: string;
																						}
																					).step ||
																					JSON.stringify(item)}
																		</li>
																	),
																)}
															</ul>
														) : (
															<span className="text-xs text-muted-foreground">
																—
															</span>
														)}
													</td>
												);
											})}
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Section 4: Risk cards */}
					{risks && risks.newRisks.length > 0 && (
						<div
							className={cn(
								"space-y-4 transition-all duration-700 ease-out",
								revealedSections >= 4
									? "translate-y-0 opacity-100"
									: "translate-y-8 opacity-0",
							)}
						>
							<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								{t("v2.risksDetected", { count: risks.newRisks.length })}
							</h3>
							{risks.newRisks.map((risk, i) => (
								<RiskCard key={risk.title} risk={risk} index={i} />
							))}
						</div>
					)}

					{/* AI disclaimer */}
					<p className="text-xs leading-relaxed text-muted-foreground/70">
						{t("aiDisclaimer")}
					</p>

					{/* Section 5: CTA */}
					<div
						className={cn(
							"transition-all duration-700 ease-out",
							revealedSections >= 5
								? "translate-y-0 opacity-100"
								: "translate-y-8 opacity-0",
						)}
					>
						<div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 text-center space-y-4">
							<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
								<ShieldAlertIcon className="size-6 text-primary" />
							</div>
							<h3 className="text-xl font-display font-semibold text-foreground">
								{t("share.ctaTitle")}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md mx-auto">
								{t("share.ctaDesc")}
							</p>
							<Button
								size="lg"
								className="gap-2 px-8"
								onClick={() => (window.location.href = "/scan")}
							>
								{t("share.runYourOwn")}
								<ArrowRightIcon className="size-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
