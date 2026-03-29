"use client";

import { LightbulbIcon } from "lucide-react";

export interface SessionSuggestion {
	type: "raci_gap" | "no_risks" | "incomplete_process" | "stale_process";
	processId: string;
	processName: string;
	message: string;
	suggestedType: string;
}

const typeIcons: Record<string, string> = {
	raci_gap: "📋",
	no_risks: "⚠️",
	incomplete_process: "📊",
	stale_process: "🕐",
};

export function SessionSuggestions({
	suggestions,
	onSchedule,
}: {
	suggestions: SessionSuggestion[];
	onSchedule: () => void;
}) {
	if (suggestions.length === 0) return null;

	return (
		<div className="rounded-xl border border-border bg-background p-5">
			<div className="mb-3 flex items-center gap-2">
				<LightbulbIcon className="h-4 w-4 text-orientation" />
				<h3 className="text-sm font-semibold text-foreground">Sugerencias</h3>
			</div>

			<div className="space-y-2">
				{suggestions.slice(0, 4).map((s) => (
					<div key={`${s.type}-${s.processId}`} className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-secondary">
						<span className="mt-0.5 text-sm">{typeIcons[s.type] ?? "💡"}</span>
						<div className="min-w-0 flex-1">
							<div className="text-xs font-medium text-foreground">{s.processName}</div>
							<div className="text-[11px] text-chrome-text-secondary">{s.message}</div>
						</div>
						<button
							type="button"
							onClick={onSchedule}
							className="shrink-0 rounded px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-accent"
						>
							Agendar
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
