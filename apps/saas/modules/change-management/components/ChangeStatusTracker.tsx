"use client";

import { cn } from "@repo/ui";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

interface ChangeStatusTrackerProps {
	totalRequired: number;
	totalConfirmed: number;
	status: string;
	confirmations?: Array<{
		id: string;
		confirmed: boolean;
		confirmedAt: string | null;
		comment: string | null;
		user: {
			id: string;
			name: string;
			image: string | null;
		};
	}>;
}

export function ChangeStatusTracker({
	totalRequired,
	totalConfirmed,
	status,
	confirmations = [],
}: ChangeStatusTrackerProps) {
	const percentage = totalRequired > 0
		? Math.round((totalConfirmed / totalRequired) * 100)
		: 0;

	const statusLabel =
		status === "COMPLETED"
			? "Completado"
			: status === "OVERDUE"
				? "Vencido"
				: status === "CANCELLED"
					? "Cancelado"
					: "Pendiente";

	const statusColor =
		status === "COMPLETED"
			? "text-emerald-400"
			: status === "OVERDUE"
				? "text-red-400"
				: status === "CANCELLED"
					? "text-slate-500"
					: "text-amber-400";

	return (
		<div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-slate-200">
					Progreso de confirmación
				</span>
				<span className={cn("text-xs font-medium", statusColor)}>
					{statusLabel}
				</span>
			</div>

			{/* Progress bar */}
			<div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden mb-2">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-500",
						status === "COMPLETED"
							? "bg-emerald-400"
							: status === "OVERDUE"
								? "bg-red-400"
								: "bg-[#3B8FE8]",
					)}
					style={{ width: `${percentage}%` }}
				/>
			</div>

			<p className="text-xs text-slate-400 mb-4">
				{totalConfirmed} de {totalRequired} miembros han confirmado ({percentage}
				%)
			</p>

			{/* Confirmations list */}
			{confirmations.length > 0 && (
				<div className="space-y-2">
					{confirmations.map((c) => (
						<div
							key={c.id}
							className="flex items-center gap-2 text-xs"
						>
							{c.confirmed ? (
								<CheckCircleIcon className="size-3.5 text-emerald-400 shrink-0" />
							) : (
								<ClockIcon className="size-3.5 text-slate-500 shrink-0" />
							)}
							<span
								className={cn(
									c.confirmed ? "text-slate-300" : "text-slate-500",
								)}
							>
								{c.user.name}
							</span>
							{c.comment && (
								<span className="text-slate-500 italic truncate">
									— "{c.comment}"
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
