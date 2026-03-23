"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { CheckIcon, XIcon, PencilIcon } from "lucide-react";
import { useState } from "react";

export interface ExtractedProcessData {
	name: string;
	description?: string;
	suggestedLevel: string;
	suggestedCategory: string;
	owner?: string;
	triggers: string[];
	outputs: string[];
}

interface ExtractionCardProps {
	process: ExtractedProcessData;
	onAccept: (process: ExtractedProcessData) => void;
	onReject: () => void;
	disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
	strategic: "Estratégico",
	core: "Core",
	support: "Soporte",
};

const LEVEL_LABELS: Record<string, string> = {
	PROCESS: "Proceso",
	SUBPROCESS: "Subproceso",
	TASK: "Tarea",
	PROCEDURE: "Procedimiento",
};

export function ExtractionCard({
	process,
	onAccept,
	onReject,
	disabled,
}: ExtractionCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(process.name);
	const [editedDescription, setEditedDescription] = useState(
		process.description ?? "",
	);
	const [accepted, setAccepted] = useState(false);
	const [rejected, setRejected] = useState(false);

	if (rejected) return null;

	if (accepted) {
		return (
			<div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
				<div className="flex items-center gap-2 text-xs text-green-400">
					<CheckIcon className="size-3" />
					<span className="font-medium">{editedName}</span>
					<span className="text-green-400/60">agregado</span>
				</div>
			</div>
		);
	}

	const handleAccept = () => {
		const finalProcess = isEditing
			? { ...process, name: editedName, description: editedDescription }
			: process;
		setAccepted(true);
		onAccept(finalProcess);
	};

	const handleReject = () => {
		setRejected(true);
		onReject();
	};

	return (
		<div className="rounded-md border border-primary/30 bg-primary/10 p-3">
			<div className="mb-1 flex items-center gap-2">
				<span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
					Proceso extraído
				</span>
				<span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
					{CATEGORY_LABELS[process.suggestedCategory] ?? process.suggestedCategory}
				</span>
				<span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
					{LEVEL_LABELS[process.suggestedLevel] ?? process.suggestedLevel}
				</span>
			</div>

			{isEditing ? (
				<div className="space-y-2">
					<Input
						value={editedName}
						onChange={(e) => setEditedName(e.target.value)}
						className="h-8 border-slate-600 bg-slate-800 text-sm text-slate-100"
						placeholder="Nombre del proceso"
					/>
					<Input
						value={editedDescription}
						onChange={(e) => setEditedDescription(e.target.value)}
						className="h-8 border-slate-600 bg-slate-800 text-sm text-slate-100"
						placeholder="Descripción"
					/>
				</div>
			) : (
				<>
					<div className="text-sm font-medium text-slate-100">
						{process.name}
					</div>
					{process.description && (
						<div className="mt-1 text-xs text-slate-400">
							{process.description}
						</div>
					)}
				</>
			)}

			<div className="mt-2 flex gap-1">
				<Button
					size="sm"
					variant="ghost"
					onClick={handleAccept}
					disabled={disabled}
					className="h-7 gap-1 bg-green-500/20 px-2 text-xs text-green-400 hover:bg-green-500/30 hover:text-green-300"
				>
					<CheckIcon className="size-3" />
					Aceptar
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleReject}
					disabled={disabled}
					className="h-7 gap-1 bg-red-500/20 px-2 text-xs text-red-400 hover:bg-red-500/30 hover:text-red-300"
				>
					<XIcon className="size-3" />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setIsEditing(!isEditing)}
					disabled={disabled}
					className="h-7 gap-1 px-2 text-xs text-slate-400 hover:text-slate-300"
				>
					<PencilIcon className="size-3" />
				</Button>
			</div>
		</div>
	);
}
