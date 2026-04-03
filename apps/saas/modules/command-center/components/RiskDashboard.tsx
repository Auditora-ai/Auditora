"use client";

import { RiskMaturityRing } from "@shared/components/RiskMaturityRing";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	FileTextIcon,
	LightbulbIcon,
	MicIcon,
	PlusIcon,
	SearchIcon,
	ShieldAlertIcon,
	SparklesIcon,
	TrendingUpIcon,
	UserPlusIcon,
	UsersIcon,
	WorkflowIcon,
	BarChart3Icon,
	TargetIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState } from "@shared/components/EmptyState";
import { SessionWizard } from "./SessionWizard";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EvaluacionesSummary {
	orgAvgScore: number;
	totalSimulations: number;
	membersEvaluated: number;
	completionRate: number;
	dimensionAverages: {
		alignment: number;
		riskLevel: number;
		criterio: number;
	};
	scoreTrend: Array<{ month: string; score: number }>;
}

export interface VulnerableProcess {
	name: string;
	avgScore: number;
	processId: string;
	simulationCount: number;
}

export interface NextStepRecommendation {
	id: string;
	message: string;
	href: string;
	icon: "scan" | "evaluate" | "improve" | "remind" | "grow";
}

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
	evaluaciones?: EvaluacionesSummary | null;
	vulnerableProcesses?: VulnerableProcess[];
	nextSteps?: NextStepRecommendation[];
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
	type:
		| "session_ended"
		| "risk_found"
		| "process_updated"
		| "evaluation_completed";
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
	evaluaciones,
	vulnerableProcesses = [],
	nextSteps = [],
}: RiskDashboardProps) {
	const router = useRouter();
	const t = useTranslations("dashboard.riskDashboard");
	const tc = useTranslations("common");
	const [showWizard, setShowWizard] = useState(false);
	const basePath = `/${organizationSlug}`;

	const isEmpty = processCount === 0 && riskCount === 0;

	// Onboarding progress for empty/new state
	const onboardingSteps = [
		{
			label: t("onboardingStep1"),
			done: processCount > 0,
			href: `${basePath}/descubrir`,
		},
		{
			label: t("onboardingStep2"),
			done: (evaluaciones?.totalSimulations ?? 0) > 0,
			href: `${basePath}/evaluaciones`,
		},
		{
			label: t("onboardingStep3"),
			done: false, // We don't have member count here, always show as pending
			href: `${basePath}/settings/members`,
		},
	];

	return (
		<div className="flex h-full flex-col overflow-auto">
			{/* Header */}
			<div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
				<div>
					<h1 className="font-display text-xl font-semibold text-foreground md:text-2xl">
						{t("title")}
					</h1>
					<p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
						{organizationName}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{hasActiveSession && (
						<span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
							<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
							{t("live")}
						</span>
					)}
					<Link
						href={`${basePath}/evaluaciones`}
						className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 sm:flex-none md:min-h-0"
					>
						<ClipboardCheckIcon className="size-4" />
						{t("createEvaluation")}
					</Link>
					<Link
						href={`${basePath}/descubrir`}
						className="hidden items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/80 md:inline-flex md:min-h-0"
					>
						<PlusIcon className="size-4" />
						{t("quickActionCapture")}
					</Link>
				</div>
			</div>

			<div className="flex-1 space-y-5 overflow-auto p-3 md:p-6 md:pb-6">
				{/* Empty state with onboarding guide */}
				{isEmpty ? (
					<div className="space-y-6">
						<EmptyState
							icon={ShieldAlertIcon}
							title={t("emptyWelcomeTitle")}
							description={t("emptyWelcomeDesc")}
							actions={[
								{
									label: t("emptyCtaCapture"),
									href: `${basePath}/descubrir`,
								},
								{
									label: t("emptyCtaExplore"),
									href: `${basePath}/processes`,
									variant: "outline",
								},
							]}
						/>
						{/* Onboarding checklist */}
						<div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60">
							<h3 className="mb-3 text-sm font-semibold text-foreground">
								{t("nextStepsTitle")}
							</h3>
							<div className="space-y-3">
								{onboardingSteps.map((step, i) => (
									<Link
										key={i}
										href={step.href}
										className="group flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm dark:border-white/5"
									>
										<span
											className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
												step.done
													? "bg-green-500/10 text-green-500"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{step.done ? (
												<CheckCircle2Icon className="size-4" />
											) : (
												i + 1
											)}
										</span>
										<span
											className={`text-sm ${step.done ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"}`}
										>
											{step.label}
										</span>
										<ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
									</Link>
								))}
							</div>
						</div>
					</div>
				) : (
					<>
						{/* ═══ Hero Score + Stats row ═══ */}
						<div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
							<div className="rounded-2xl border border-white/10 bg-card/80 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 p-4 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60 md:p-6">
								<div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
									{/* Large maturity ring — hero element */}
									<div className="flex flex-col items-center">
										<RiskMaturityRing
											score={maturityScore}
											size="lg"
										/>
									</div>

									{/* Stats grid — 4 key metrics */}
									<div className="w-full flex-1">
										<div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4 md:text-left">
											{/* Documented processes: X of Y */}
											<Link
												href={`${basePath}/processes`}
												className="group rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-accent/30 md:bg-transparent md:p-0"
											>
												<p className="text-xl font-bold tabular-nums text-foreground transition-colors group-hover:text-primary md:text-2xl">
													{documentedCount}
													<span className="text-sm font-normal text-muted-foreground">
														/{processCount}
													</span>
												</p>
												<p className="text-[10px] text-muted-foreground md:text-xs">
													{t("documented")}
												</p>
											</Link>

											{/* Risk count */}
											<Link
												href={`${basePath}/processes`}
												className="group rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-accent/30 md:bg-transparent md:p-0"
											>
												<p className="text-xl font-bold tabular-nums text-foreground transition-colors group-hover:text-amber-500 md:text-2xl">
													{riskCount}
												</p>
												<p className="text-[10px] text-muted-foreground md:text-xs">
													{t("risks")}
												</p>
											</Link>

											{/* Evaluations completed */}
											<Link
												href={`${basePath}/evaluaciones`}
												className="group rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-accent/30 md:bg-transparent md:p-0"
											>
												<p className="text-xl font-bold tabular-nums text-foreground transition-colors group-hover:text-blue-500 md:text-2xl">
													{evaluaciones?.totalSimulations ??
														0}
												</p>
												<p className="text-[10px] text-muted-foreground md:text-xs">
													{t(
														"evaluationsThisMonth",
													)}
												</p>
											</Link>

											{/* Active evaluators */}
											<Link
												href={`${basePath}/evaluaciones?tab=dashboard`}
												className="group rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-accent/30 md:bg-transparent md:p-0"
											>
												<p className="text-xl font-bold tabular-nums text-foreground transition-colors group-hover:text-green-500 md:text-2xl">
													{evaluaciones?.membersEvaluated ??
														0}
												</p>
												<p className="text-[10px] text-muted-foreground md:text-xs">
													{t("activeEvaluators")}
												</p>
											</Link>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* ═══ Quick Actions ═══ */}
						<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<Link
									href={`${basePath}/descubrir`}
									className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md active:bg-accent/80 dark:border-white/5 dark:bg-card/60"
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
										<SearchIcon className="size-5 text-blue-500" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
											{t("quickActionCapture")}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{t("quickActionCaptureDesc")}
										</p>
									</div>
									<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</Link>

								<Link
									href={`${basePath}/evaluaciones`}
									className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md active:bg-accent/80 dark:border-white/5 dark:bg-card/60"
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
										<ClipboardCheckIcon className="size-5 text-primary" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
											{t("quickActionEvaluate")}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{t("quickActionEvaluateDesc")}
										</p>
									</div>
									<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</Link>

								<Link
									href={`${basePath}/settings/members`}
									className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md active:bg-accent/80 dark:border-white/5 dark:bg-card/60"
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
										<UserPlusIcon className="size-5 text-green-500" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
											{t("quickActionInvite")}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{t("quickActionInviteDesc")}
										</p>
									</div>
									<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</Link>
							</div>
						</div>

						{/* ═══ Two-column: Top Risks + Vulnerable Processes ═══ */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{/* Left: Top Risks */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									{t("topRisks")}
								</h2>
								{topRisks.length === 0 ? (
									<div className="rounded-2xl border border-white/10 bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60">
										<p className="text-sm text-muted-foreground">
											{t("noRisksDesc")}
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{topRisks.map((risk) => (
											<Link
												key={risk.id}
												href={`${basePath}/processes`}
												className={`block rounded-2xl border border-l-4 border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-white/5 dark:bg-card/60 ${
													risk.riskScore >= 16
														? "border-l-[#DC2626] dark:border-red-900/30"
														: risk.riskScore >= 12
															? "border-l-[#D97706] dark:border-amber-900/30"
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
																		? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
																		: risk.riskScore >=
																			  12
																			? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
																			: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
																}`}
															>
																{
																	risk.riskScore
																}
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
															{
																risk.processName
															}{" "}
															·{" "}
															{tc("severity")}:{" "}
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

							{/* Right: Vulnerable Processes */}
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									{t("vulnerableProcesses")}
								</h2>
								{vulnerableProcesses.length === 0 ? (
									<div className="rounded-2xl border border-white/10 bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60">
										<p className="text-sm text-muted-foreground">
											{t("noVulnerableProcesses")}
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{vulnerableProcesses.map((proc) => {
											const scoreColor =
												proc.avgScore < 50
													? "text-red-500"
													: proc.avgScore < 70
														? "text-amber-500"
														: "text-green-500";
											const barColor =
												proc.avgScore < 50
													? "bg-red-500"
													: proc.avgScore < 70
														? "bg-amber-500"
														: "bg-green-500";
											return (
												<Link
													key={proc.processId}
													href={`${basePath}/evaluaciones`}
													className="block rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-white/5 dark:bg-card/60"
												>
													<div className="mb-2 flex items-center justify-between">
														<h3 className="truncate text-sm font-medium text-foreground">
															{proc.name}
														</h3>
														<span
															className={`text-sm font-bold tabular-nums ${scoreColor}`}
														>
															{proc.avgScore}
														</span>
													</div>
													<div className="h-1.5 rounded-full bg-accent">
														<div
															className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
															style={{
																width: `${proc.avgScore}%`,
															}}
														/>
													</div>
													<p className="mt-1.5 text-[11px] text-muted-foreground">
														{t(
															"evaluationsCount",
															{
																count: proc.simulationCount,
															},
														)}
													</p>
												</Link>
											);
										})}
									</div>
								)}
							</div>
						</div>

						{/* ═══ Evaluaciones Summary ═══ */}
						{evaluaciones && (
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
								<div className="mb-3 flex items-center justify-between">
									<h2 className="text-sm font-semibold text-foreground">
										{t("evaluaciones")}
									</h2>
									<Link
										href={`${basePath}/evaluaciones?tab=dashboard`}
										className="text-xs font-medium text-primary hover:underline"
									>
										{t("viewAll")}
									</Link>
								</div>
								<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
									{/* Org Score */}
									<Link
										href={`${basePath}/evaluaciones?tab=dashboard`}
										className="group rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-card/60"
									>
										<div className="flex items-center gap-3">
											<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
												<TargetIcon className="size-5 text-primary" />
											</div>
											<div>
												<p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-primary">
													{evaluaciones.orgAvgScore}
													<span className="text-sm font-normal text-muted-foreground">
														/100
													</span>
												</p>
												<p className="text-[11px] text-muted-foreground">
													{t("teamAlignment")}
												</p>
											</div>
										</div>
									</Link>

									{/* Total Evaluations */}
									<Link
										href={`${basePath}/evaluaciones`}
										className="group rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-card/60"
									>
										<div className="flex items-center gap-3">
											<div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
												<ClipboardCheckIcon className="size-5 text-blue-500" />
											</div>
											<div>
												<p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-blue-500">
													{
														evaluaciones.totalSimulations
													}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{t(
														"evaluationsCompleted",
													)}
												</p>
											</div>
										</div>
									</Link>

									{/* Members Evaluated */}
									<Link
										href={`${basePath}/evaluaciones?tab=dashboard`}
										className="group rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-card/60"
									>
										<div className="flex items-center gap-3">
											<div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
												<UsersIcon className="size-5 text-green-500" />
											</div>
											<div>
												<p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-green-500">
													{
														evaluaciones.membersEvaluated
													}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{t("membersEvaluated")}
												</p>
											</div>
										</div>
									</Link>

									{/* Completion Rate */}
									<Link
										href={`${basePath}/evaluaciones?tab=dashboard`}
										className="group rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-card/60"
									>
										<div className="flex items-center gap-3">
											<div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
												<BarChart3Icon className="size-5 text-amber-500" />
											</div>
											<div>
												<p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-amber-500">
													{
														evaluaciones.completionRate
													}
													%
												</p>
												<p className="text-[11px] text-muted-foreground">
													{t("completionRate")}
												</p>
											</div>
										</div>
									</Link>
								</div>

								{/* Dimension mini-bars */}
								<div className="mt-4 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60">
									<div className="space-y-3">
										{[
											{
												label: t("alignment"),
												value: evaluaciones
													.dimensionAverages
													.alignment,
												color: "bg-primary",
											},
											{
												label: t("controlLevel"),
												value:
													100 -
													evaluaciones
														.dimensionAverages
														.riskLevel,
												color: "bg-blue-500",
											},
											{
												label: t("criterio"),
												value: evaluaciones
													.dimensionAverages.criterio,
												color: "bg-green-500",
											},
										].map((dim) => (
											<div key={dim.label}>
												<div className="mb-1 flex items-center justify-between text-xs">
													<span className="text-muted-foreground">
														{dim.label}
													</span>
													<span className="font-medium tabular-nums text-foreground">
														{dim.value}%
													</span>
												</div>
												<div className="h-2 rounded-full bg-accent">
													<div
														className={`h-full rounded-full ${dim.color} transition-all duration-1000 ease-out`}
														style={{
															width: `${dim.value}%`,
														}}
													/>
												</div>
											</div>
										))}
									</div>

									{/* Score trend mini-sparkline */}
									{evaluaciones.scoreTrend.length >= 2 && (
										<div className="mt-4 border-t border-border pt-3">
											<p className="mb-2 text-xs text-muted-foreground">
												{t("scoreTrend")}
											</p>
											<div className="flex h-8 items-end gap-1">
												{evaluaciones.scoreTrend
													.slice(-6)
													.map((point, i) => {
														const maxScore =
															Math.max(
																...evaluaciones.scoreTrend
																	.slice(-6)
																	.map(
																		(p) =>
																			p.score,
																	),
																1,
															);
														const height =
															(point.score /
																maxScore) *
															100;
														return (
															<div
																key={i}
																className="flex flex-1 flex-col items-center gap-0.5"
															>
																<div
																	className="min-h-[2px] w-full rounded-t bg-primary/60 transition-all duration-700"
																	style={{
																		height: `${height}%`,
																	}}
																	title={`${point.month}: ${point.score}`}
																/>
															</div>
														);
													})}
											</div>
											<div className="mt-1 flex justify-between">
												<span className="text-[11px] text-muted-foreground">
													{
														evaluaciones.scoreTrend.slice(
															-6,
														)[0]?.month
													}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{
														evaluaciones.scoreTrend.slice(
															-1,
														)[0]?.month
													}
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* ═══ Next Steps Recommendations ═══ */}
						{nextSteps.length > 0 && (
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									<span className="flex items-center gap-2">
										<LightbulbIcon className="size-4 text-amber-400" />
										{t("nextStepsTitle")}
									</span>
								</h2>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{nextSteps.map((step) => {
										const iconMap = {
											scan: (
												<SearchIcon className="size-4 text-blue-400" />
											),
											evaluate: (
												<ClipboardCheckIcon className="size-4 text-primary" />
											),
											improve: (
												<TrendingUpIcon className="size-4 text-green-400" />
											),
											remind: (
												<UsersIcon className="size-4 text-amber-400" />
											),
											grow: (
												<SparklesIcon className="size-4 text-purple-400" />
											),
										};
										return (
											<Link
												key={step.id}
												href={step.href}
												className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md dark:border-white/5 dark:bg-card/60"
											>
												<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
													{iconMap[step.icon]}
												</div>
												<div className="min-w-0 flex-1">
													<p className="text-sm text-foreground transition-colors group-hover:text-primary">
														{step.message}
													</p>
												</div>
												<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
											</Link>
										);
									})}
								</div>
							</div>
						)}

						{/* ═══ Next Session ═══ */}
						{nextSession && (
							<div className="animate-in fade-in slide-in-from-bottom-2 delay-200 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm duration-500 dark:border-white/5 dark:bg-card/60">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
										<CalendarIcon className="size-5" />
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
										className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
									>
										{t("viewDetails")}
									</Link>
								</div>
							</div>
						)}

						{/* ═══ Recent Activity ═══ */}
						{recentActivity.length > 0 && (
							<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
								<h2 className="mb-3 text-sm font-semibold text-foreground">
									{t("recentActivity")}
								</h2>
								<div className="space-y-2">
									{recentActivity.map((item, i) => (
										<div
											key={i}
											className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/80 px-4 py-3 backdrop-blur-sm dark:border-white/5 dark:bg-card/60"
										>
											<span
												className={`size-2 rounded-full ${
													item.type === "risk_found"
														? "bg-amber-500"
														: item.type ===
															  "session_ended"
															? "bg-blue-500"
															: item.type ===
																  "evaluation_completed"
																? "bg-primary"
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
