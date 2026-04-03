"use client";

import { EmptyState } from "@shared/components/EmptyState";
import { GraduationCapIcon, UserIcon } from "lucide-react";
import { cn } from "@repo/ui";
import Link from "next/link";

type SimulationTemplateStatus = "GENERATING" | "GENERATION_FAILED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type SimulationTargetRole = "DIRECTOR_OPERACIONES" | "DIRECTOR_COMPRAS" | "DIRECTOR_CALIDAD" | "DIRECTOR_FINANZAS" | "DIRECTOR_LOGISTICA" | "GERENTE_PLANTA" | "CONTROLLER" | "CEO" | "CUSTOM";
type SimulationRunStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

interface TemplateItem {
	id: string;
	title: string;
	status: SimulationTemplateStatus;
	targetRole: SimulationTargetRole;
	customRoleName: string | null;
	processDefinition: { name: string };
	scenarios: Array<{
		runs: Array<{ status: SimulationRunStatus; overallScore: number | null }>;
	}>;
}

interface RunItem {
	id: string;
	status: SimulationRunStatus;
	overallScore: number | null;
	createdAt: Date;
	user: { name: string; image: string | null };
	scenario: {
		template: { title: string; targetRole: SimulationTargetRole };
	};
}

interface EvaluacionHubProps {
	templates: TemplateItem[];
	recentRuns: RunItem[];
	organizationSlug: string;
}

const roleLabels: Record<SimulationTargetRole, string> = {
	DIRECTOR_OPERACIONES: "Dir. Operaciones",
	DIRECTOR_COMPRAS: "Dir. Compras",
	DIRECTOR_CALIDAD: "Dir. Calidad",
	DIRECTOR_FINANZAS: "Dir. Finanzas",
	DIRECTOR_LOGISTICA: "Dir. Logística",
	GERENTE_PLANTA: "Ger. Planta",
	CONTROLLER: "Controller",
	CEO: "CEO",
	CUSTOM: "Personalizado",
};

function scoreColor(score: number | null): string {
	if (score === null) return "text-muted-foreground";
	if (score >= 75) return "text-emerald-400";
	if (score >= 50) return "text-amber-400";
	return "text-red-400";
}

export function EvaluacionHub({ templates, recentRuns, organizationSlug }: EvaluacionHubProps) {
	if (templates.length === 0) {
		return (
			<EmptyState
				icon={GraduationCapIcon}
			title="Sin evaluaciones creadas"
			description="Las evaluaciones se generan a partir de tus procesos y riesgos documentados. Primero mapea un proceso y detecta sus riesgos."
				actions={[
					{
						label: "Ir a Procesos",
						href: `/${organizationSlug}/processes`,
						variant: "primary",
					},
				]}
			/>
		);
	}

	const totalRuns = templates.reduce(
		(acc, t) => acc + t.scenarios.reduce((s, sc) => s + sc.runs.length, 0),
		0,
	);
	const completedRuns = templates.reduce(
		(acc, t) =>
			acc + t.scenarios.reduce(
				(s, sc) => s + sc.runs.filter((r) => r.status === "COMPLETED").length,
				0,
			),
		0,
	);
	const avgScore =
		completedRuns > 0
			? Math.round(
					templates.reduce(
						(acc, t) =>
							acc +
							t.scenarios.reduce(
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
			<div className="grid grid-cols-3 gap-2 md:gap-4">
				<div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
					<p className="text-[10px] md:text-xs text-muted-foreground">Evaluaciones</p>
					<p className="mt-0.5 text-xl md:text-2xl font-semibold text-foreground">{templates.length}</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
					<p className="text-[10px] md:text-xs text-muted-foreground truncate">Completadas</p>
					<p className="mt-0.5 text-xl md:text-2xl font-semibold text-foreground">{completedRuns}</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
					<p className="text-[10px] md:text-xs text-muted-foreground">Score prom.</p>
					<p className={cn("mt-0.5 text-xl md:text-2xl font-semibold", scoreColor(avgScore))}>
						{avgScore !== null ? avgScore : "—"}
					</p>
				</div>
			</div>

			{/* Templates list */}
			<div>
				<h2 className="mb-3 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
					Catálogo de evaluaciones
				</h2>
				<div className="grid gap-3">
					{templates.map((template) => {
						const runCount = template.scenarios.reduce((s, sc) => s + sc.runs.length, 0);
						const roleName = template.targetRole === "CUSTOM"
							? template.customRoleName ?? "Personalizado"
							: roleLabels[template.targetRole];

						return (
							<Link
								key={template.id}
								href={`/${organizationSlug}/evaluaciones/${template.id}`}
								className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 md:p-4 transition-colors hover:border-border hover:bg-accent/30 active:bg-accent/50 min-h-[64px]"
							>
								<div className="flex items-start gap-2.5 md:gap-3 min-w-0 flex-1">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
										<GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
									</div>
									<div className="min-w-0 flex-1">
										<span className="font-medium text-sm text-foreground block truncate">
											{template.title}
										</span>
										<div className="mt-0.5 flex items-center gap-1.5 md:gap-2 text-xs text-muted-foreground flex-wrap">
											<span className="truncate max-w-[120px] md:max-w-none">{template.processDefinition.name}</span>
											<span className="hidden md:inline">·</span>
											<span className="hidden md:inline">{roleName}</span>
											<span>·</span>
											<span className="whitespace-nowrap">{runCount} eval.</span>
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0 ml-2">
									<span className={cn(
										"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
										template.status === "PUBLISHED"
											? "bg-emerald-500/20 text-emerald-400"
											: "bg-slate-500/20 text-slate-400",
									)}>
										{template.status === "PUBLISHED" ? "Activa" : "Borrador"}
									</span>
								</div>
							</Link>
						);
					})}
				</div>
			</div>

			{/* Recent runs */}
			{recentRuns.length > 0 && (
				<div>
					<h2 className="mb-3 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
						Evaluaciones recientes
					</h2>
					<div className="grid gap-2">
						{recentRuns.map((run) => (
							<div
								key={run.id}
								className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2.5 md:px-4 md:py-3 min-h-[52px]"
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
									<span className={cn(
										"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
										run.status === "COMPLETED"
											? "bg-emerald-500/20 text-emerald-400"
											: run.status === "IN_PROGRESS"
												? "bg-blue-500/20 text-blue-400"
												: "bg-slate-500/20 text-slate-400",
									)}>
										{run.status === "COMPLETED" ? "Ok" : run.status === "IN_PROGRESS" ? "En curso" : "—"}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
