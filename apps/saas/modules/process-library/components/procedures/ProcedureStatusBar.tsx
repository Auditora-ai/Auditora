"use client";

import { cn } from "@repo/ui";
import { CheckIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

type ProcedureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface ProcedureStatusBarProps {
	status: ProcedureStatus;
	onStatusChange: (status: ProcedureStatus) => Promise<void>;
}

const steps: { status: ProcedureStatus; label: string }[] = [
	{ status: "DRAFT", label: "Borrador" },
	{ status: "IN_REVIEW", label: "En Revisión" },
	{ status: "APPROVED", label: "Aprobado" },
	{ status: "PUBLISHED", label: "Publicado" },
];

const nextAction: Partial<Record<ProcedureStatus, { target: ProcedureStatus; label: string }>> = {
	DRAFT: { target: "IN_REVIEW", label: "Enviar a Revisión" },
	IN_REVIEW: { target: "APPROVED", label: "Aprobar" },
	APPROVED: { target: "PUBLISHED", label: "Publicar" },
};

export function ProcedureStatusBar({ status, onStatusChange }: ProcedureStatusBarProps) {
	const [updating, setUpdating] = useState(false);
	const currentIndex = steps.findIndex((s) => s.status === status);
	const action = nextAction[status];

	const handleAdvance = async () => {
		if (!action) return;
		setUpdating(true);
		try {
			await onStatusChange(action.target);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
			{/* Stepper */}
			<div className="flex items-center gap-1 overflow-x-auto">
				{steps.map((step, i) => {
					const isCompleted = i < currentIndex;
					const isCurrent = i === currentIndex;
					return (
						<div key={step.status} className="flex items-center gap-1">
							{i > 0 && (
								<ChevronRightIcon className={cn(
									"h-3.5 w-3.5",
									isCompleted ? "text-emerald-400" : "text-muted-foreground/30",
								)} />
							)}
							<div className={cn(
								"flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
								isCompleted && "bg-emerald-500/15 text-emerald-400",
								isCurrent && "bg-primary/15 text-primary",
								!isCompleted && !isCurrent && "bg-muted/30 text-muted-foreground/50",
							)}>
								{isCompleted && <CheckIcon className="h-3 w-3" />}
								{isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
								<span>{step.label}</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Action */}
			{action && (
				<button
					onClick={handleAdvance}
					disabled={updating}
					className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
				>
					{updating && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
					{action.label}
				</button>
			)}

			{status === "PUBLISHED" && (
				<span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
					<CheckIcon className="h-3.5 w-3.5" />
					Procedimiento publicado
				</span>
			)}
		</div>
	);
}
