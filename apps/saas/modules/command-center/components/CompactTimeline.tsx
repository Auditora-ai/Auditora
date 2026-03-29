"use client";

import { useMemo } from "react";
import type { SessionData } from "./CommandCenter";

const COLORS = ["#2563EB", "#7C3AED", "#16A34A", "#D97706", "#DC2626", "#0EA5E9"];

export function CompactTimeline({ sessions }: { sessions: SessionData[] }) {
	const { weeks, processes, sessionsByWeekProcess } = useMemo(() => {
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - now.getDay() + 1);
		startOfWeek.setHours(0, 0, 0, 0);

		// Generate 4 weeks
		const wks: { start: Date; label: string }[] = [];
		for (let i = 0; i < 4; i++) {
			const start = new Date(startOfWeek.getTime() + i * 7 * 24 * 60 * 60 * 1000);
			const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
			wks.push({
				start,
				label: `${start.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
			});
		}

		// Extract unique processes
		const procs = new Map<string, string>();
		for (const s of sessions) {
			if (s.processDefinition) {
				procs.set(s.processDefinition.id, s.processDefinition.name);
			}
		}

		// Map sessions to week×process
		const map = new Map<string, SessionData[]>();
		for (const s of sessions) {
			if (!s.scheduledFor || !s.processDefinition) continue;
			const d = new Date(s.scheduledFor);
			for (let i = 0; i < wks.length; i++) {
				const weekEnd = new Date(wks[i].start.getTime() + 7 * 24 * 60 * 60 * 1000);
				if (d >= wks[i].start && d < weekEnd) {
					const key = `${i}-${s.processDefinition.id}`;
					if (!map.has(key)) map.set(key, []);
					map.get(key)!.push(s);
					break;
				}
			}
		}

		return { weeks: wks, processes: [...procs.entries()], sessionsByWeekProcess: map };
	}, [sessions]);

	if (processes.length === 0) return null;

	return (
		<div className="rounded-xl border border-border bg-background p-4">
			<h3 className="mb-3 px-1 text-sm font-semibold text-foreground">Timeline</h3>

			{/* Header: week labels */}
			<div className="mb-2 grid" style={{ gridTemplateColumns: `120px repeat(${weeks.length}, 1fr)` }}>
				<div />
				{weeks.map((w) => (
					<div key={w.label} className="text-center text-[10px] text-chrome-text-secondary">
						{w.label}
					</div>
				))}
			</div>

			{/* Rows: one per process */}
			{processes.map(([procId, procName], idx) => (
				<div
					key={procId}
					className="grid items-center border-t border-muted py-1.5"
					style={{ gridTemplateColumns: `120px repeat(${weeks.length}, 1fr)` }}
				>
					<div className="truncate pr-2 text-xs text-foreground">{procName}</div>
					{weeks.map((_, weekIdx) => {
						const key = `${weekIdx}-${procId}`;
						const sessionsInCell = sessionsByWeekProcess.get(key);
						return (
							<div key={key} className="px-1">
								{sessionsInCell ? (
									<div
										className="h-5 rounded"
										style={{ backgroundColor: COLORS[idx % COLORS.length], opacity: 0.7 }}
										title={`${sessionsInCell.length} sesión(es)`}
									/>
								) : (
									<div className="h-5" />
								)}
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}
