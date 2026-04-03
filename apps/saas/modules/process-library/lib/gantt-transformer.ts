import type { Task } from "gantt-task-react";

// ─── Types ───────────────────────────────────────────────────────────

export interface ProjectPlan {
	generalTasks: GeneralTask[];
	processSchedule: Record<string, ProcessScheduleEntry>;
}

export interface GeneralTask {
	id: string;
	name: string;
	startDate: string; // ISO date
	endDate: string;
	progress: number;
}

export interface ProcessScheduleEntry {
	inScope: boolean;
	phases?: {
		contexto?: PhaseSchedule;
		captura?: PhaseSchedule;
		modelo?: PhaseSchedule;
		analisis?: PhaseSchedule;
	};
}

export interface PhaseSchedule {
	startDate: string;
	endDate: string;
}

export interface ProcessForGantt {
	id: string;
	name: string;
	owner: string | null;
	priority: number;
	processStatus: string;
	description: string | null;
	bpmnXml: string | null;
	_count: {
		sessions: number;
		children: number;
		raciEntries: number;
		risks: number;
	};
	goals: string[];
	triggers: string[];
	outputs: string[];
	intelligence: { id: string } | null;
}

// ─── Phase config ────────────────────────────────────────────────────

const PHASES = [
	{ key: "contexto", label: "Contexto", color: "#7C3AED", progressColor: "#6D28D9" },
	{ key: "captura", label: "Captura", color: "#3B8FE8", progressColor: "#2E7FD6" },
	{ key: "modelo", label: "Modelo", color: "#0EA5E9", progressColor: "#0284C7" },
	{ key: "analisis", label: "Análisis", color: "#16A34A", progressColor: "#15803D" },
] as const;

// ─── Phase progress calculation (matches ProcessPhaseDashboard) ──────

function calcPhaseProgress(process: ProcessForGantt, phase: string): number {
	switch (phase) {
		case "contexto": {
			let score = 0;
			if (process.description) score += 33;
			if (process._count.children > 0) score += 34;
			if ((process.goals.length + process.triggers.length + process.outputs.length) > 0) score += 33;
			return score;
		}
		case "captura":
			return process._count.sessions > 0 ? 100 : 0;
		case "modelo":
			return process.bpmnXml ? 100 : 0;
		case "analisis": {
			let score = 0;
			if (process._count.raciEntries > 0) score += 33;
			if (process.intelligence) score += 34;
			if (process._count.risks > 0) score += 33;
			return score;
		}
		default:
			return 0;
	}
}

// ─── Auto-schedule ───────────────────────────────────────────────────

export function generateAutoSchedule(
	processes: ProcessForGantt[],
	startDate: Date = new Date(),
): ProjectPlan {
	const sorted = [...processes].sort((a, b) => (b.priority || 0) - (a.priority || 0));
	const daysPerPhase = 3;
	const maxParallel = 2;

	// Project start
	const projectStart = new Date(startDate);
	projectStart.setHours(0, 0, 0, 0);

	const generalTasks: GeneralTask[] = [
		{
			id: "project-start",
			name: "Inicio del proyecto",
			startDate: fmt(projectStart),
			endDate: fmt(addDays(projectStart, 1)),
			progress: 0,
		},
	];

	const processSchedule: Record<string, ProcessScheduleEntry> = {};

	// Schedule processes in parallel batches
	let batchStart = addDays(projectStart, 2);

	for (let i = 0; i < sorted.length; i += maxParallel) {
		const batch = sorted.slice(i, i + maxParallel);
		let batchMaxEnd = batchStart;

		for (const proc of batch) {
			let phaseStart = new Date(batchStart);
			const phases: Record<string, PhaseSchedule> = {};

			for (const phase of PHASES) {
				const phaseEnd = addDays(phaseStart, daysPerPhase);
				phases[phase.key] = {
					startDate: fmt(phaseStart),
					endDate: fmt(phaseEnd),
				};
				phaseStart = addDays(phaseEnd, 1); // 1 day gap between phases
			}

			if (phaseStart > batchMaxEnd) batchMaxEnd = phaseStart;

			processSchedule[proc.id] = { inScope: true, phases: phases as any };
		}

		batchStart = addDays(batchMaxEnd, 1);
	}

	// Project close
	generalTasks.push({
		id: "project-close",
		name: "Cierre del proyecto",
		startDate: fmt(batchStart),
		endDate: fmt(addDays(batchStart, 2)),
		progress: 0,
	});

	return { generalTasks, processSchedule };
}

// ─── Transform to gantt-task-react Tasks ─────────────────────────────

export function transformToGanttTasks(
	processes: ProcessForGantt[],
	plan: ProjectPlan,
): Task[] {
	const tasks: Task[] = [];
	let order = 0;

	// General task: project start
	const startTask = plan.generalTasks.find((t) => t.id === "project-start");
	if (startTask) {
		tasks.push({
			id: startTask.id,
			type: "milestone",
			name: startTask.name,
			start: new Date(startTask.startDate),
			end: new Date(startTask.endDate),
			progress: startTask.progress,
			displayOrder: order++,
			styles: { backgroundColor: "#0A1428", progressColor: "#1E293B" },
		});
	}

	// Process groups + phases
	for (const proc of processes) {
		const schedule = plan.processSchedule[proc.id];
		if (!schedule) continue;

		const isOutOfScope = !schedule.inScope;

		// Process group row (project type = collapsible group)
		const phaseStarts = schedule.phases
			? Object.values(schedule.phases).map((p) => new Date(p.startDate))
			: [new Date()];
		const phaseEnds = schedule.phases
			? Object.values(schedule.phases).map((p) => new Date(p.endDate))
			: [new Date()];

		const procStart = new Date(Math.min(...phaseStarts.map((d) => d.getTime())));
		const procEnd = new Date(Math.max(...phaseEnds.map((d) => d.getTime())));

		// Overall process progress = average of 4 phases
		const phaseProgresses = PHASES.map((ph) => calcPhaseProgress(proc, ph.key));
		const avgProgress = Math.round(phaseProgresses.reduce((a, b) => a + b, 0) / PHASES.length);

		tasks.push({
			id: proc.id,
			type: "project",
			name: isOutOfScope ? `${proc.name} (fuera de scope)` : proc.name,
			start: procStart,
			end: procEnd,
			progress: avgProgress,
			displayOrder: order++,
			hideChildren: false,
			isDisabled: isOutOfScope,
			styles: isOutOfScope
				? { backgroundColor: "#E2E8F0", progressColor: "#CBD5E1" }
				: { backgroundColor: "#111827", progressColor: "#1E293B" },
		});

		// Phase tasks
		if (schedule.phases && !isOutOfScope) {
			for (let pi = 0; pi < PHASES.length; pi++) {
				const phase = PHASES[pi];
				const phaseData = schedule.phases[phase.key as keyof typeof schedule.phases];
				if (!phaseData) continue;

				const progress = calcPhaseProgress(proc, phase.key);
				const deps: string[] = [];

				// Each phase depends on the previous one within the same process
				if (pi > 0) {
					deps.push(`${proc.id}-${PHASES[pi - 1].key}`);
				}

				tasks.push({
					id: `${proc.id}-${phase.key}`,
					type: "task",
					name: phase.label,
					start: new Date(phaseData.startDate),
					end: new Date(phaseData.endDate),
					progress,
					project: proc.id,
					dependencies: deps,
					displayOrder: order++,
					styles: {
						backgroundColor: phase.color,
						progressColor: phase.progressColor,
					},
				});
			}
		}
	}

	// General task: project close
	const closeTask = plan.generalTasks.find((t) => t.id === "project-close");
	if (closeTask) {
		tasks.push({
			id: closeTask.id,
			type: "milestone",
			name: closeTask.name,
			start: new Date(closeTask.startDate),
			end: new Date(closeTask.endDate),
			progress: closeTask.progress,
			displayOrder: order++,
			styles: { backgroundColor: "#0A1428", progressColor: "#1E293B" },
		});
	}

	return tasks;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function fmt(date: Date): string {
	return date.toISOString().split("T")[0];
}
