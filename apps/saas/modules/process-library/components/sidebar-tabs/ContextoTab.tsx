"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import { Badge } from "@repo/ui/components/badge";
import { SaveIcon, PlusIcon, XIcon } from "lucide-react";
import { toastSuccess, toastError } from "@repo/ui/components/toast";
import { useTranslations } from "next-intl";
import { ContextChat } from "../ContextChat";
import type { ProcessData, ProcessChild } from "../../types";

interface ContextoTabProps {
	process: ProcessData;
	organizationSlug: string;
	processesPath: string;
	onUpdate: (data: Partial<ProcessData>) => void;
}

export function ContextoTab({ process, organizationSlug, processesPath, onUpdate }: ContextoTabProps) {
	const tc = useTranslations("common");
	const [description, setDescription] = useState(process.description || "");
	const [owner, setOwner] = useState(process.owner || "");
	const [goals, setGoals] = useState<string[]>(process.goals);
	const [triggers, setTriggers] = useState<string[]>(process.triggers);
	const [outputs, setOutputs] = useState<string[]>(process.outputs);
	const [saving, setSaving] = useState(false);

	const saveDetails = useCallback(async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description, owner, goals, triggers, outputs }),
			});
			if (res.ok) {
				onUpdate({ description, owner, goals, triggers, outputs });
				toastSuccess("Guardado");
			} else {
				toastError(tc("errorSaving"));
			}
		} catch {
			toastError(tc("errorSaving"));
		} finally {
			setSaving(false);
		}
	}, [description, owner, goals, triggers, outputs, process.id, onUpdate]);

	return (
		<div className="space-y-4">
			<ContextChat
				processId={process.id}
				onContextUpdated={(updated) => onUpdate(updated as Partial<ProcessData>)}
			/>

			<div className="space-y-2">
				<Label className="text-xs">Descripción</Label>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={2}
					placeholder="Describe este proceso..."
					className="text-xs"
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-xs">Responsable</Label>
				<Input
					value={owner}
					onChange={(e) => setOwner(e.target.value)}
					placeholder="Departamento o persona..."
					className="text-xs"
				/>
			</div>

			<TagFieldCompact label="Objetivos" items={goals} onChange={setGoals} placeholder="Agregar objetivo..." />
			<TagFieldCompact label="Triggers" items={triggers} onChange={setTriggers} placeholder="Agregar trigger..." />
			<TagFieldCompact label="Outputs" items={outputs} onChange={setOutputs} placeholder="Agregar output..." />

			<Button onClick={saveDetails} disabled={saving} size="sm" className="w-full">
				<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
				{saving ? "Guardando..." : "Guardar Contexto"}
			</Button>
		</div>
	);
}

function TagFieldCompact({
	label,
	items,
	onChange,
	placeholder,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	placeholder: string;
}) {
	const [input, setInput] = useState("");

	const add = () => {
		const value = input.trim();
		if (value && !items.includes(value)) {
			onChange([...items, value]);
			setInput("");
		}
	};

	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			<div className="flex flex-wrap gap-1">
				{items.map((item, i) => (
					<Badge key={i} status="info" className="gap-0.5 pr-0.5 text-[10px]">
						{item}
						<button
							type="button"
							onClick={() => onChange(items.filter((_, j) => j !== i))}
							className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</Badge>
				))}
			</div>
			<div className="flex gap-1">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
					className="flex-1 text-xs h-7"
				/>
				<Button variant="secondary" size="sm" onClick={add} disabled={!input.trim()} className="h-7 w-7 p-0">
					<PlusIcon className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
