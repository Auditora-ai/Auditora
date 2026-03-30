"use client";

import { RiskMaturityRing } from "@shared/components/RiskMaturityRing";
import {
	CalendarIcon,
	MicIcon,
	PlusIcon,
	ShieldAlertIcon,
	TrendingUpIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@shared/components/EmptyState";
import { SessionWizard } from "./SessionWizard";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RiskDashboardProps {
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	maturityScore: number;
	topRisks: TopRisk[];
	nextSession: {
		id: string;
		scheduledFor: string;
		processName: string | null;
		status: string;
	} | null;
	recentActivity: ActivityItem[];
	processCount: number;
	documentedCount: number;
	riskCount: number;
	hasActiveSession: boolean;
}

export interface TopRisk {
	id: string;
	title: string;
	description: string | null;
	processName: string;
	severity: number;
	probability: number;
	riskScore: number;
}

export interface ActivityItem {
	type: "session_ended" | "risk_found" | "process_updated";
	title: string;
	subtitle: string;
	date: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskDashboard({
	organizationId,
	organizationName,
	organizationSlug,
	maturityScore,
	topRisks,
	nextSession,
	recentActivity,
	processCount,
	documentedCount,
	riskCount,
	hasActiveSession,
}: RiskDashboardProps) {
	const router = useRouter();
	const t = useTranslations("dashboard.riskDashboard");
	const tc = useTranslations("common");
	const [showWizard, setShowWizard] = useState(false);
	const basePath = `/${organizationSlug}`;

	const isEmpty = processCount === 0 && riskCount === 0;

	return (
		<div className="flex h-full flex-col overflow-auto">
			{/* Header */}
			<div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
				<div>
					<h1 className="font-display text-2xl font-semibold text-foreground">
						{t("title")}
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{organizationName}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{hasActiveSession && (
						<span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
							<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
							{t("live")}
						</span>
					)}
					<button
						type="button"
						onClick={() => setShowWizard(true)}
						className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 md:w-auto md:min-h-0"
					>
						<PlusIcon className="size-4" />
						{t("newSession")}
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4 pb-24 space-y-6 md:p-6 md:pb-6">
				{/* Empty state */}
				{isEmpty ? (
					<EmptyState
						icon={ShieldAlertIcon}
						title={t("emptyTitle")}
						description={t("emptyDesc")}
						actions={[
							{
								label: t("scanCta"),
								href: "/scan",
							},
							{
								label: t("newSession"),
								onClick: () => setShowWizard(true),
								variant: "outline",
							},
						]}
					/>
				) : (
					<>
						{/* Two-column layout: Maturity + Top Risks */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							{/* Left: Maturity Score + Quick Actions */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
								<div className="rounded-xl border border-border bg-background p-6">
									<RiskMaturityRing
										score={maturityScore}
										size="md"
									/>
									<div className="mt-4 grid grid-cols-3 gap-3 text-center">
										<div>
											<p className="text-lg font-semibold tabular-nums text-foreground">
												{riskCount}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{t("risks")}
											</p>
										</div>
										<div>
											<p className="text-lg font-semibold tabular-nums text-foreground">
												{processCount}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{t("processes")}
											</p>
										</div>
										<div>
											<p className="text-lg font-semibold tabular-nums text-foreground">
												{processCount > 0
													? Math.round(
															(documentedCount /
																processCount) *
																100,
														)
													: 0}
												%
											</p>
											<p className="text-[10px] text-muted-foreground">
												{t("coverage")}
											</p>
										</div>
									</div>
								</div>

								{/* Quick Actions — horizontal scroll on mobile, vertical on desktop */}
								<div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:space-y-2 md:gap-0 md:overflow-visible md:pb-0">
									<Link
										href={`${basePath}/deliverables/risks`}
										className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-accent/50"
									>
										<ShieldAlertIcon className="size-4 text-amber-500" />
										<span className="whitespace-nowrap text-foreground">
											{t("viewAllRisks")}
										</span>
									</Link>
									<Link
										href={`${basePath}/processes`}
										className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-accent/50"
									>
										<WorkflowIcon className="size-4 text-blue-500" />
										<span className="whitespace-nowrap text-foreground">
											{t("viewProcesses")}
										</span>
									</Link>
									<Link
										href={`${basePath}/deliverables`}
										className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-accent/50"
									>
										<TrendingUpIcon className="size-4 text-green-500" />
										<span className="whitespace-nowrap text-foreground">
											{t("viewDeliverables")}
										</span>
									</Link>
								</div>
							</div>

							{/* Right: Top Risks (2/3 width) */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 lg:col-span-2">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									{t("topRisks")}
								</h2>
								{topRisks.length === 0 ? (
									<div className="rounded-xl border border-border bg-background p-8 text-center">
										<p className="text-sm text-muted-foreground">
											{t("noRisksDesc")}
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{topRisks.map((risk) => (
											<Link
												key={risk.id}
												href={`${basePath}/deliverables/risks`}
												className={`block rounded-xl border bg-background p-4 transition-all duration-300 hover:shadow-sm border-l-4 ${
											risk.riskScore >= 16
												? "border-l-[#DC2626] border-red-100"
												: risk.riskScore >= 12
													? "border-l-[#D97706] border-amber-100"
													: "border-l-[#0EA5E9] border-border"
										}`}
											>
												<div className="flex items-start justify-between">
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span
																className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded text-xs font-semibold ${
																	risk.riskScore >=
																	16
																		? "bg-red-100 text-red-800"
																		: risk.riskScore >=
																			  12
																			? "bg-amber-100 text-amber-800"
																			: "bg-yellow-100 text-yellow-800"
																}`}
															>
																{risk.riskScore}
															</span>
															<h3 className="truncate text-sm font-medium text-foreground">
																{risk.title}
															</h3>
														</div>
														{risk.description && (
															<p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
																{
																	risk.description
																}
															</p>
														)}
														<p className="mt-1.5 text-[11px] text-muted-foreground">
															{risk.processName}{" "}
															· {tc("severity")}:{" "}
															{risk.severity} ·
															{tc("probability")}:{" "}
															{risk.probability}
														</p>
													</div>
												</div>
											</Link>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Next Session */}
						{nextSession && (
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 rounded-xl border border-border bg-background p-4">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
										<MicIcon className="size-5" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium text-foreground">
											{t("nextSessionLabel")}
										</p>
										<p className="text-xs text-muted-foreground">
											{nextSession.processName ??
												t("noProcess")}{" "}
											·{" "}
											{new Date(
												nextSession.scheduledFor,
											).toLocaleDateString(undefined, {
												weekday: "long",
												day: "numeric",
												month: "short",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
									<Link
										href={`${basePath}/session/${nextSession.id}`}
										className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
									>
										{t("viewDetails")}
									</Link>
								</div>
							</div>
						)}

						{/* Recent Activity */}
						{recentActivity.length > 0 && (
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									{t("recentActivity")}
								</h2>
								<div className="space-y-2">
									{recentActivity.map((item, i) => (
										<div
											key={i}
											className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
										>
											<span
												className={`size-2 rounded-full ${
													item.type ===
													"risk_found"
														? "bg-amber-500"
														: item.type ===
															  "session_ended"
															? "bg-blue-500"
															: "bg-green-500"
												}`}
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm text-foreground">
													{item.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{item.subtitle}
												</p>
											</div>
											<span className="shrink-0 text-xs text-muted-foreground">
												{item.date}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Session Wizard */}
			{showWizard && (
				<SessionWizard
					open={showWizard}
					onClose={() => setShowWizard(false)}
					organizationSlug={organizationSlug}
					onCreated={() => {
						setShowWizard(false);
						router.refresh();
					}}
				/>
			)}
		</div>
	);
}
