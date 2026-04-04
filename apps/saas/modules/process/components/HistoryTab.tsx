"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import type { ProcessHistoryEntry } from "../data/mock-process";

interface HistoryTabProps {
	history: ProcessHistoryEntry[];
}

function formatDate(dateStr: string) {
	const date = new Date(dateStr);
	return date.toLocaleDateString("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatTime(dateStr: string) {
	const date = new Date(dateStr);
	return date.toLocaleTimeString("es-MX", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function HistoryTab({ history }: HistoryTabProps) {
	const sorted = [...history].sort((a, b) => b.version - a.version);

	return (
		<div className="px-4 py-4">
			<div className="mb-4">
				<h3 className="text-sm font-semibold text-slate-900">
					Historial de versiones
				</h3>
				<p className="text-xs text-slate-500 mt-0.5">
					{history.length} versiones registradas
				</p>
			</div>

			{/* Timeline */}
			<div className="relative">
				{/* Vertical line */}
				<div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />

				<div className="space-y-6">
					{sorted.map((entry, index) => (
						<div key={entry.id} className="relative flex gap-4">
							{/* Timeline dot */}
							<div className="relative z-10 flex flex-col items-center">
								<div
									className={cn(
										"flex h-6 w-6 items-center justify-center rounded-full border-2",
										index === 0
											? "border-action bg-action text-white"
											: "border-slate-300 bg-white text-slate-400",
									)}
								>
									<span className="text-[10px] font-bold">
										v{entry.version}
									</span>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 pb-1">
								<div className="rounded-xl bg-white p-4 shadow-sm">
									{/* Header */}
									<div className="flex items-center justify-between mb-2">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] px-1.5 py-0",
												index === 0 && "border-action text-action",
											)}
										>
											Versión {entry.version}
											{index === 0 && " (actual)"}
										</Badge>
										<span className="text-[10px] text-slate-400">
											{formatDate(entry.date)}
										</span>
									</div>

									{/* Change description */}
									<p className="text-sm text-slate-700 leading-relaxed">
										{entry.changeDescription}
									</p>

									{/* Author & time */}
									<div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-500">
											{entry.author
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</div>
										<span>{entry.author}</span>
										<span className="text-slate-300">·</span>
										<span>{formatTime(entry.date)}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
