"use client";

import { EmptyState } from "@shared/components/EmptyState";
import { GraduationCapIcon, UserIcon, AlertTriangleIcon, CheckCircle2Icon, PlayCircleIcon } from "lucide-react";
import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { useTranslations } from "next-intl";

type EvaluacionTemplateStatus = "GENERATING" | "GENERATION_FAILED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type EvaluacionTargetRole = "DIRECTOR_OPERACIONES" | "DIRECTOR_COMPRAS" | "DIRECTOR_CALIDAD" | "DIRECTOR_FINANZAS" | "DIRECTOR_LOGISTICA" | "GERENTE_PLANTA" | "CONTROLLER" | "CEO" | "CUSTOM";
type EvaluacionRunStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

interface TemplateItem {
	id: string;
	title: string;
	status: EvaluacionTemplateStatus;
	targetRole: EvaluacionTargetRole;
	customRoleName: string | null;
	processDefinition: { name: string };
	scenarios: Array<{
		runs: Array<{ status: EvaluacionRunStatus; overallScore: number | null }>;
	}>;
}

interface RunItem {
	id: string;
	status: EvaluacionRunStatus;
	overallScore: number | null;
	createdAt: Date;
	user: { name: string; image: string | null };
	scenario: {
		template: { title: string; targetRole: EvaluacionTargetRole };
	};
}

interface EvaluacionHubProps {
	templates: TemplateItem[];
	recentRuns: RunItem[];
	organizationSlug: string;
}

function scoreColor(score: number | null): string {
	if (score === null) return "text-muted-foreground";
	if (score >= 80) return "text-emerald-500";
	if (score >= 60) return "text-amber-500";
	return "text-destructive";
}

function riskIndicator(avgScore: number | null): { label: string; color: string; bg: string } {
	if (avgScore === null) return { label: "—", color: "text-muted-foreground", bg: "bg-muted/50" };
	if (avgScore >= 80) return { label: "LOW", color: "text-emerald-500", bg: "bg-emerald-500/10" };
	if (avgScore >= 60) return { label: "MED", color: "text-amber-500", bg: "bg-amber-500/10" };
	return { label: "HIGH", color: "text-destructive", bg: "bg-destructive/10" };
}

function statusVariant(status: EvaluacionTemplateStatus): { status?: "success" | "info" | "warning" | "error"; variant?: "secondary" } {
	switch (status) {
		case "PUBLISHED": return { status: "success" };
		case "GENERATING": return { status: "info" };
		case "GENERATION_FAILED": return { status: "error" };
		default: return { variant: "secondary" };
	}
}

function runStatusVariant(status: EvaluacionRunStatus): { status?: "success" | "info"; variant?: "secondary" } {
	switch (status) {
		case "COMPLETED": return { status: "success" };
		case "IN_PROGRESS": return { status: "info" };
		default: return { variant: "secondary" };
	}
}

export function EvaluacionHub({ templates, recentRuns, organizationSlug }: EvaluacionHubProps) {
	const t = useTranslations("evaluaciones.hub");

	if (templates.length === 0) {
		return (
			<EmptyState
				icon={GraduationCapIcon}
				title={t("emptyTitle")}
				description={t("emptyDescription")}
				actions={[
					{
						label: t("goToProcesses"),
						href: `/${organizationSlug}/`,
						variant: "primary",
					},
				]}
			/>
		);
	}

	const totalRuns = templates.reduce(
		(acc, tpl) => acc + tpl.scenarios.reduce((s, sc) => s + sc.runs.length, 0),
		0,
	);
	const completedRuns = templates.reduce(
		(acc, tpl) =>
			acc + tpl.scenarios.reduce(
				(s, sc) => s + sc.runs.filter((r) => r.status === "COMPLETED").length,
				0,
			),
		0,
	);
	const avgScore =
		completedRuns > 0
			? Math.round(
					templates.reduce(
						(acc, tpl) =>
							acc +
							tpl.scenarios.reduce(
								(s, sc) =>
									s +
									sc.runs
										.filter((r) => r.overallScore !== null)
										.reduce((sum, r) => sum + (r.overallScore ?? 0), 0),
								0,
							),
						0,
					) / completedRuns,
				)
			: null;

	return (
		<div className="flex flex-col gap-5 md:gap-6">
			{/* Stats row — 3 columns, compact on mobile */}
			<div className="grid grid-cols-3 gap-2 md:gap-4" role="list">
			<div className="rounded-2xl border border-border/50 bg-card p-4 md:p-4">
				<p className="text-[10px] md:text-xs text-muted-foreground">{t("evaluations")}</p>
				<p className="mt-0.5 text-xl md:text-2xl font-semibold text-foreground">{templates.length}</p>
			</div>
			<div className="rounded-2xl border border-border/50 bg-card p-4 md:p-4">
				<p className="text-[10px] md:text-xs text-muted-foreground truncate">{t("completed")}</p>
				<p className="mt-0.5 text-xl md:text-2xl font-semibold text-foreground">{completedRuns}</p>
			</div>
			<div className="rounded-2xl border border-border/50 bg-card p-4 md:p-4">
					<p className="text-[10px] md:text-xs text-muted-foreground">{t("avgScore")}</p>
				<p className={cn("mt-0.5 text-xl md:text-2xl font-semibold tabular-nums", scoreColor(avgScore))}>
					{avgScore !== null ? avgScore : "—"}
				</p>
				</div>
			</div>

			{/* Templates — Harvard-case style cards */}
			<div>
				<h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t("catalog")}
				</h2>
				<div className="grid gap-3">
					{templates.map((template) => {
						const scenarioCount = template.scenarios.length;
						const runCount = template.scenarios.reduce((s, sc) => s + sc.runs.length, 0);
						const completedCount = template.scenarios.reduce(
							(s, sc) => s + sc.runs.filter((r) => r.status === "COMPLETED").length,
							0,
						);
						const templateAvg = completedCount > 0
							? Math.round(
								template.scenarios.reduce(
									(s, sc) => s + sc.runs.filter((r) => r.overallScore !== null).reduce((sum, r) => sum + (r.overallScore ?? 0), 0),
									0,
								) / completedCount
							)
							: null;
						const completionRate = runCount > 0 ? Math.round((completedCount / runCount) * 100) : 0;
						const risk = riskIndicator(templateAvg);
						const roleName = template.targetRole === "CUSTOM"
							? template.customRoleName ?? t("customRole")
							: t(`roleLabels.${template.targetRole}`);
						const sv = statusVariant(template.status);

						return (
							<Link
								key={template.id}
								href={`/${organizationSlug}/evaluaciones/${template.id}`}
								className="group block rounded-2xl border border-border/50 bg-card p-4 md:p-5 transition-all hover:border-border hover:bg-accent/30 active:bg-accent/50 active:scale-[0.99]"
							>
								{/* Top: Title + Status */}
								<div className="flex items-start justify-between gap-2 mb-2">
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-sm md:text-base text-foreground truncate">
											{template.title}
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5 truncate">
											{template.processDefinition.name} · {roleName}
										</p>
									</div>
									<Badge {...sv} className="shrink-0 text-[10px]">
										{template.status === "PUBLISHED" ? t("statusActive")
											: template.status === "GENERATING" ? "…"
											: template.status === "GENERATION_FAILED" ? "Error"
											: template.status === "ARCHIVED" ? "Archived"
											: t("statusDraft")}
									</Badge>
								</div>

								{/* Middle: Key metrics row */}
								<div className="flex items-center gap-3 md:gap-4 mt-3 flex-wrap">
									{/* Risk level badge */}
									<div className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[10px] md:text-xs font-semibold", risk.bg, risk.color)}>
										<AlertTriangleIcon className="size-3" />
										{risk.label}
									</div>

									{/* Scenario count */}
									<div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
										<PlayCircleIcon className="size-3" />
										<span>{t("scenarioCount", { count: scenarioCount })}</span>
									</div>

									{/* Completion rate */}
									{runCount > 0 && (
										<div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
											<CheckCircle2Icon className="size-3" />
											<span>{completionRate}%</span>
										</div>
									)}

									{/* Avg score */}
									{templateAvg !== null && (
										<span className={cn("text-xs md:text-sm font-semibold tabular-nums ml-auto", scoreColor(templateAvg))}>
											{templateAvg}
										</span>
									)}
								</div>

								{/* Bottom: Progress bar (completion) */}
								{runCount > 0 && (
									<div className="mt-3">
										<div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden">
											<div
												className={cn(
													"h-full rounded-full transition-all duration-500",
													completionRate >= 80 ? "bg-emerald-500" : completionRate >= 60 ? "bg-amber-500" : "bg-destructive"
												)}
												style={{ width: `${completionRate}%` }}
											/>
										</div>
									</div>
								)}
							</Link>
						);
					})}
				</div>
			</div>

			{/* Recent runs */}
			{recentRuns.length > 0 && (
				<div>
					<h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{t("recentRuns")}
					</h2>
					<div className="grid gap-2">
						{recentRuns.map((run) => {
							const rsv = runStatusVariant(run.status);
							return (
								<div
									key={run.id}
									className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3 md:px-4 md:py-3 min-h-[52px]"
								>
									<div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
										<div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 shrink-0">
											<UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
										</div>
										<div className="min-w-0">
											<span className="text-sm text-foreground truncate block">{run.user.name}</span>
											<span className="text-[10px] md:text-xs text-muted-foreground truncate block">
												{run.scenario.template.title}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
										<span className={cn("text-sm font-medium tabular-nums", scoreColor(run.overallScore))}>
											{run.overallScore !== null ? run.overallScore : "—"}
										</span>
										<Badge {...rsv} className="text-[10px]">
											{run.status === "COMPLETED" ? t("statusCompleted") : run.status === "IN_PROGRESS" ? t("statusInProgress") : "—"}
										</Badge>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
