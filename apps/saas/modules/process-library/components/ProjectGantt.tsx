"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useTranslations } from "next-intl";
import {
	CalendarIcon,
	SparklesIcon,
	EyeOffIcon,
	EyeIcon,
	Loader2Icon,
} from "lucide-react";
import {
	transformToGanttTasks,
	generateAutoSchedule,
	type ProjectPlan,
	type ProcessForGantt,
} from "../lib/gantt-transformer";
import "gantt-task-react/dist/index.css";

// Dynamic import for gantt-task-react (SSR-unsafe)
import dynamic from "next/dynamic";
const GanttChart = dynamic(
	() => import("gantt-task-react").then((mod) => {
		// Also need to import the CSS
		return { default: mod.Gantt };
	}),
	{ ssr: false, loading: () => <div className="space-y-3 p-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-80 w-full" /></div> },
);

interface ProjectGanttProps {
	organizationId: string;
	organizationSlug: string;
	processes: ProcessForGantt[];
	initialPlan: ProjectPlan | null;
	architectureId: string;
}

type ViewModeType = "Day" | "Week" | "Month";

export function ProjectGantt({
	organizationId,
	organizationSlug,
	processes,
	initialPlan,
	architectureId,
}: ProjectGanttProps) {
	const tc = useTranslations("common");
	const [plan, setPlan] = useState<ProjectPlan | null>(initialPlan);
	const [viewMode, setViewMode] = useState<ViewModeType>("Week");
	const [saving, setSaving] = useState(false);

	// Auto-generate plan if none exists
	useEffect(() => {
		if (!plan && processes.length > 0) {
			const generated = generateAutoSchedule(processes);
			setPlan(generated);
			savePlan(generated);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const savePlan = useCallback(
		async (planData: ProjectPlan) => {
			setSaving(true);
			try {
				const res = await fetch(`/api/organizations/${organizationId}/project-plan`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ architectureId, projectPlan: planData }),
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
			} catch {
				toastError({ title: tc("errorSaving") });
			} finally {
				setSaving(false);
			}
		},
		[organizationId, architectureId],
	);

	const handleRegenerate = useCallback(() => {
		const generated = generateAutoSchedule(processes);
		setPlan(generated);
		savePlan(generated);
		toastSuccess({ title: "Plan regenerado" });
	}, [processes, savePlan]);

	const handleToggleScope = useCallback(
		(processId: string) => {
			if (!plan) return;
			const entry = plan.processSchedule[processId];
			if (!entry) return;

			const updated: ProjectPlan = {
				...plan,
				processSchedule: {
					...plan.processSchedule,
					[processId]: { ...entry, inScope: !entry.inScope },
				},
			};
			setPlan(updated);
			savePlan(updated);
		},
		[plan, savePlan],
	);

	const handleDateChange = useCallback(
		(task: any) => {
			if (!plan) return;

			// Parse task ID to find process + phase
			const parts = task.id.split("-");

			// General tasks (project-start, project-close)
			if (task.id.startsWith("project-")) {
				const updated: ProjectPlan = {
					...plan,
					generalTasks: plan.generalTasks.map((t) =>
						t.id === task.id
							? { ...t, startDate: fmt(task.start), endDate: fmt(task.end) }
							: t,
					),
				};
				setPlan(updated);
				savePlan(updated);
				return;
			}

			// Phase tasks: "{processId}-{phaseKey}"
			const phaseKey = parts[parts.length - 1];
			const processId = parts.slice(0, -1).join("-");

			if (["contexto", "captura", "modelo", "analisis"].includes(phaseKey)) {
				const entry = plan.processSchedule[processId];
				if (!entry?.phases) return;

				const updated: ProjectPlan = {
					...plan,
					processSchedule: {
						...plan.processSchedule,
						[processId]: {
							...entry,
							phases: {
								...entry.phases,
								[phaseKey]: {
									startDate: fmt(task.start),
									endDate: fmt(task.end),
								},
							},
						},
					},
				};
				setPlan(updated);
				savePlan(updated);
			}
		},
		[plan, savePlan],
	);

	const handleProgressChange = useCallback(
		(task: any) => {
			if (!plan) return;

			// Only general tasks have manual progress
			if (task.id.startsWith("project-")) {
				const updated: ProjectPlan = {
					...plan,
					generalTasks: plan.generalTasks.map((t) =>
						t.id === task.id ? { ...t, progress: task.progress } : t,
					),
				};
				setPlan(updated);
				savePlan(updated);
			}
			// Phase progress is auto-calculated, ignore drag
		},
		[plan, savePlan],
	);

	if (!plan || processes.length === 0) {
		return (
			<div className="flex h-96 flex-col items-center justify-center text-chrome-text-secondary">
				<CalendarIcon className="mb-3 h-10 w-10 opacity-30" />
				<p className="text-sm">No hay procesos para planificar</p>
				<p className="mt-1 text-xs">Agrega procesos a la arquitectura primero</p>
			</div>
		);
	}

	const ganttTasks = transformToGanttTasks(processes, plan);

	// Scope toggles
	const processesWithScope = processes.map((p) => ({
		...p,
		inScope: plan.processSchedule[p.id]?.inScope ?? true,
	}));

	return (
		<div className="flex h-full flex-col" style={{ fontFamily: "'Geist Sans', system-ui, sans-serif" }}>
			{/* Toolbar */}
			<div className="flex items-center gap-3 border-b border-border bg-secondary px-6 py-3">
				<h2 className="text-sm font-semibold text-foreground">Plan de Trabajo</h2>

				<div className="ml-auto flex items-center gap-2">
					{saving && (
						<span className="flex items-center gap-1 text-xs text-chrome-text-secondary">
							<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							Guardando...
						</span>
					)}

					{/* View mode toggle */}
					<div className="flex rounded-lg border border-border bg-background">
						{(["Day", "Week", "Month"] as const).map((mode) => (
							<button
								key={mode}
								type="button"
								onClick={() => setViewMode(mode)}
								className={`px-3 py-1.5 text-xs font-medium transition-colors ${
									viewMode === mode
										? "bg-chrome-base text-white"
										: "text-chrome-text-muted hover:bg-muted"
								} ${mode === "Day" ? "rounded-l-lg" : mode === "Month" ? "rounded-r-lg" : ""}`}
							>
								{mode === "Day" ? "Día" : mode === "Week" ? "Semana" : "Mes"}
							</button>
						))}
					</div>

					{/* Regenerate */}
					<button
						type="button"
						onClick={handleRegenerate}
						className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-action-hover"
					>
						<SparklesIcon className="h-3.5 w-3.5" />
						Generar plan
					</button>
				</div>
			</div>

			{/* Scope toggles */}
			<div className="flex flex-wrap items-center gap-2 border-b border-muted bg-background px-6 py-2">
				<span className="text-[10px] font-medium uppercase tracking-wider text-chrome-text-secondary">Scope:</span>
				{processesWithScope.map((p) => (
					<button
						key={p.id}
						type="button"
						onClick={() => handleToggleScope(p.id)}
						className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
							p.inScope
								? "bg-accent text-primary"
								: "bg-muted text-chrome-text-secondary line-through"
						}`}
					>
						{p.inScope ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeOffIcon className="h-3.5 w-3.5" />}
						{p.name}
					</button>
				))}
			</div>

			{/* Gantt chart */}
			<div className="flex-1 overflow-auto bg-background">
				<GanttChart
					tasks={ganttTasks}
					viewMode={viewMode as any}
					locale="es"
					onDateChange={handleDateChange}
					onProgressChange={handleProgressChange}
					onExpanderClick={(task: any) => {
						// Toggle hideChildren for project rows
						const idx = ganttTasks.findIndex((t) => t.id === task.id);
						if (idx >= 0) {
							ganttTasks[idx].hideChildren = !ganttTasks[idx].hideChildren;
						}
					}}
					listCellWidth="155px"
					columnWidth={viewMode === "Month" ? 300 : viewMode === "Week" ? 250 : 65}
					ganttHeight={0}
					barCornerRadius={4}
					barFill={75}
					fontSize="12px"
					fontFamily="'Geist Sans', system-ui, sans-serif"
					headerHeight={50}
					rowHeight={42}
					todayColor="rgba(37, 99, 235, 0.06)"
					arrowColor="var(--muted-foreground)"
					arrowIndent={20}
				/>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-4 border-t border-border bg-secondary px-6 py-2">
				<span className="text-[10px] text-chrome-text-secondary">Fases:</span>
			{[
				{ label: "Contexto", cls: "bg-violet-600" },
				{ label: "Captura", cls: "bg-blue-500" },
				{ label: "Modelo", cls: "bg-sky-500" },
				{ label: "Análisis", cls: "bg-emerald-600" },
			].map((phase) => (
				<div key={phase.label} className="flex items-center gap-1">
					<div className={`h-3.5 w-3.5 rounded-sm ${phase.cls}`} />
					<span className="text-[10px] text-chrome-text-muted">{phase.label}</span>
				</div>
			))}
				<div className="flex items-center gap-1">
					<div className="h-3.5 w-3.5 rounded-sm bg-border" />
					<span className="text-[10px] text-chrome-text-secondary">Fuera de scope</span>
				</div>
			</div>
		</div>
	);
}

function fmt(date: Date): string {
	return date.toISOString().split("T")[0];
}
