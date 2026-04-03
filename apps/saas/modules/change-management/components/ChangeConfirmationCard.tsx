"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	CheckCircleIcon,
	ClipboardCheckIcon,
	FileTextIcon,
	RefreshCwIcon,
} from "lucide-react";

interface ChangeConfirmationCardProps {
	change: {
		responseId: string;
		id: string;
		changeSummary: string;
		changeType: string;
		totalRequired: number;
		totalConfirmed: number;
		createdAt: Date | string;
		changedBy: {
			id: string;
			name: string;
			image: string | null;
		};
		process: {
			id: string;
			name: string;
		} | null;
		procedure: {
			id: string;
			title: string;
		} | null;
	};
	onConfirm: (changeConfirmationId: string, comment?: string) => void;
	isConfirming: boolean;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
	PROCESS_STRUCTURE: "Estructura del proceso",
	PROCEDURE_CONTENT: "Contenido del procedimiento",
	RISK_LEVEL_CHANGE: "Nivel de riesgo",
	RACI_CHANGE: "Matriz RACI",
};

const CHANGE_TYPE_ICONS: Record<string, typeof RefreshCwIcon> = {
	PROCESS_STRUCTURE: RefreshCwIcon,
	PROCEDURE_CONTENT: FileTextIcon,
	RISK_LEVEL_CHANGE: ClipboardCheckIcon,
	RACI_CHANGE: ClipboardCheckIcon,
};

export function ChangeConfirmationCard({
	change,
	onConfirm,
	isConfirming,
}: ChangeConfirmationCardProps) {
	const Icon = CHANGE_TYPE_ICONS[change.changeType] ?? RefreshCwIcon;
	const entityName =
		change.process?.name ?? change.procedure?.title ?? "Elemento";
	const timeAgo = formatDistanceToNow(new Date(change.createdAt), {
		addSuffix: true,
		locale: es,
	});

	return (
		<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
			{/* Header */}
			<div className="flex items-start gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
					<Icon className="size-4" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-slate-200">
						Cambios en "{entityName}"
					</p>
					<p className="text-xs text-slate-400">
						{CHANGE_TYPE_LABELS[change.changeType] ?? change.changeType} —{" "}
						{change.changedBy.name} • {timeAgo}
					</p>
				</div>
			</div>

			{/* Summary */}
			<p className="mt-3 text-sm text-slate-300 bg-slate-800/50 rounded-md px-3 py-2">
				{change.changeSummary}
			</p>

			{/* Progress + Action */}
			<div className="mt-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 text-xs text-slate-500">
						<CheckCircleIcon className="size-3.5 text-emerald-400" />
						{change.totalConfirmed}/{change.totalRequired} confirmados
					</div>
					{/* Progress bar */}
					<div className="h-1.5 w-16 rounded-full bg-slate-700 overflow-hidden">
						<div
							className="h-full rounded-full bg-emerald-400 transition-all"
							style={{
								width: `${(change.totalConfirmed / change.totalRequired) * 100}%`,
							}}
						/>
					</div>
				</div>

				<Button
					size="sm"
					onClick={() => onConfirm(change.id)}
					disabled={isConfirming}
					className="bg-[#00E5C0] text-slate-900 hover:bg-[#00E5C0]/80 text-xs h-7"
				>
					{isConfirming ? "Confirmando..." : "Confirmar lectura"}
				</Button>
			</div>
		</div>
	);
}
