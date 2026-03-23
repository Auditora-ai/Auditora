"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	PackageIcon,
	ListIcon,
	CheckSquareIcon,
	FileTextIcon,
	PlusIcon,
	ChevronRightIcon,
	ChevronDownIcon,
	Loader2Icon,
	SaveIcon,
	NetworkIcon,
} from "lucide-react";

interface ProcessData {
	id: string;
	name: string;
	description: string | null;
	level: string;
	processStatus: string;
	owner: string | null;
	children: {
		id: string;
		name: string;
		level: string;
		processStatus: string;
	}[];
}

interface ProcessEditPanelProps {
	processId?: string;
	organizationId: string;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
}

const LEVEL_ICONS: Record<string, typeof PackageIcon> = {
	PROCESS: PackageIcon,
	SUBPROCESS: ListIcon,
	TASK: CheckSquareIcon,
	PROCEDURE: FileTextIcon,
};

export function ProcessEditPanel({
	processId,
	organizationId,
	sessionType,
}: ProcessEditPanelProps) {
	const [process, setProcess] = useState<ProcessData | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [addingChild, setAddingChild] = useState(false);
	const [newChildName, setNewChildName] = useState("");
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchProcess = useCallback(async () => {
		if (!processId) {
			setLoading(false);
			return;
		}
		try {
			const res = await fetch(`/api/processes/${processId}`);
			if (res.ok) {
				const data = await res.json();
				setProcess(data);
			}
		} catch (err) {
			console.error("[ProcessEditPanel] Fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [processId]);

	useEffect(() => {
		fetchProcess();
	}, [fetchProcess]);

	const saveField = useCallback(
		async (field: string, value: string) => {
			if (!processId) return;
			setSaving(true);
			try {
				await fetch(`/api/processes/${processId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ [field]: value }),
				});
			} catch (err) {
				console.error("[ProcessEditPanel] Save error:", err);
			} finally {
				setSaving(false);
			}
		},
		[processId],
	);

	const handleFieldChange = (field: string, value: string) => {
		if (!process) return;
		// Optimistic update
		setProcess((prev) =>
			prev ? { ...prev, [field]: value } : prev,
		);
		// Debounced save
		if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = setTimeout(() => saveField(field, value), 500);
	};

	const handleAddChild = async () => {
		if (!newChildName.trim() || !processId) return;
		setAddingChild(true);
		try {
			await fetch("/api/discovery/accept", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId,
					process: {
						name: newChildName.trim(),
						suggestedLevel: "SUBPROCESS",
						suggestedCategory: "core",
						description: "",
					},
					parentId: processId,
				}),
			});
			setNewChildName("");
			await fetchProcess();
		} catch (err) {
			console.error("[ProcessEditPanel] Add child error:", err);
		} finally {
			setAddingChild(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<Loader2Icon className="h-5 w-5 animate-spin" />
			</div>
		);
	}

	if (!processId || !process) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
				<NetworkIcon className="h-8 w-8 opacity-30" />
				<p className="font-medium">Sin proceso seleccionado</p>
				<p className="max-w-[200px] text-xs">
					{sessionType === "DISCOVERY"
						? "Acepta procesos del Chat IA para editarlos aqui"
						: "Inicia una sesion Deep Dive para editar el proceso"}
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			{/* Process header with save indicator */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="text-xs font-medium text-muted-foreground">
					Editando proceso
				</span>
				{saving && (
					<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
						<SaveIcon className="h-3 w-3" />
						Guardando...
					</span>
				)}
			</div>

			<div className="space-y-4 p-3">
				{/* Name */}
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Nombre
					</label>
					<Input
						value={process.name}
						onChange={(e) =>
							handleFieldChange("name", e.target.value)
						}
						className="text-sm"
					/>
				</div>

				{/* Description */}
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Descripcion
					</label>
					<Textarea
						value={process.description || ""}
						onChange={(e) =>
							handleFieldChange("description", e.target.value)
						}
						className="min-h-[60px] text-sm"
						rows={3}
					/>
				</div>

				{/* Owner */}
				<div className="space-y-1">
					<label className="text-xs font-medium text-muted-foreground">
						Responsable
					</label>
					<Input
						value={process.owner || ""}
						onChange={(e) =>
							handleFieldChange("owner", e.target.value)
						}
						placeholder="Ej: Gerente de Operaciones"
						className="text-sm"
					/>
				</div>

				{/* Subprocesses */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label className="text-xs font-medium text-muted-foreground">
							Subprocesos ({process.children.length})
						</label>
					</div>

					{process.children.length > 0 ? (
						<div className="space-y-0.5 rounded-md border border-border">
							{process.children.map((child) => {
								const Icon =
									LEVEL_ICONS[child.level] ?? ListIcon;
								return (
									<div
										key={child.id}
										className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/30"
									>
										<Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
										<span className="flex-1 truncate text-xs">
											{child.name}
										</span>
										<Badge
											status="info"
											className="text-[10px]"
										>
											{child.level.toLowerCase()}
										</Badge>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-xs text-muted-foreground/60">
							Sin subprocesos definidos
						</p>
					)}

					{/* Add child inline */}
					<div className="flex items-center gap-1.5">
						<Input
							value={newChildName}
							onChange={(e) => setNewChildName(e.target.value)}
							placeholder="Nuevo subproceso..."
							className="text-xs"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleAddChild();
							}}
						/>
						<Button
							size="icon"
							variant="outline"
							className="h-8 w-8 flex-shrink-0"
							onClick={handleAddChild}
							disabled={
								!newChildName.trim() || addingChild
							}
						>
							{addingChild ? (
								<Loader2Icon className="h-3 w-3 animate-spin" />
							) : (
								<PlusIcon className="h-3 w-3" />
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
