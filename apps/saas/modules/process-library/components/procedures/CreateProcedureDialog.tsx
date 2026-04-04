"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProcessOption {
	id: string;
	name: string;
}

interface CreateProcedureDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	processes: ProcessOption[];
	organizationSlug: string;
}

export function CreateProcedureDialog({
	open,
	onOpenChange,
	processes,
	organizationSlug,
}: CreateProcedureDialogProps) {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [processId, setProcessId] = useState(processes[0]?.id || "");
	const [responsible, setResponsible] = useState("");
	const [generateAI, setGenerateAI] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!title.trim() || !processId) return;
		setLoading(true);
		setError(null);
		try {
			// Create procedure
			const res = await fetch("/api/procedures", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					processDefinitionId: processId,
					responsible: responsible.trim() || undefined,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Error al crear");
			}

			const { procedure } = await res.json();

			// Optionally generate with AI
			if (generateAI) {
				await fetch(`/api/procedures/${procedure.id}/generate`, { method: "POST" });
			}

			onOpenChange(false);
			router.push(`/${organizationSlug}/processes`);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Crear Procedimiento</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Title */}
					<div>
						<label className="text-xs font-medium text-muted-foreground">
							Título del procedimiento *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ej: Recepción de materiales"
							className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							autoFocus
						/>
					</div>

					{/* Process selector */}
					<div>
						<label className="text-xs font-medium text-muted-foreground">
							Proceso vinculado *
						</label>
						<select
							value={processId}
							onChange={(e) => setProcessId(e.target.value)}
							className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							{processes.map((p) => (
								<option key={p.id} value={p.id}>{p.name}</option>
							))}
						</select>
					</div>

					{/* Responsible */}
					<div>
						<label className="text-xs font-medium text-muted-foreground">
							Responsable
						</label>
						<input
							type="text"
							value={responsible}
							onChange={(e) => setResponsible(e.target.value)}
							placeholder="Ej: Gerente de Compras"
							className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					{/* AI generate toggle */}
					<label className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
						<input
							type="checkbox"
							checked={generateAI}
							onChange={(e) => setGenerateAI(e.target.checked)}
							className="rounded border-border text-primary focus:ring-primary"
						/>
						<div className="flex items-center gap-2">
							<SparklesIcon className="h-4 w-4 text-primary" />
							<div>
								<p className="text-sm font-medium text-foreground">Generar contenido con IA</p>
								<p className="text-[10px] text-muted-foreground">Genera pasos, controles e indicadores automáticamente</p>
							</div>
						</div>
					</label>

					{error && (
						<p className="text-xs text-red-400">{error}</p>
					)}
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit}
						disabled={!title.trim() || !processId || loading}
					>
						{loading && <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />}
						{loading ? (generateAI ? "Generando..." : "Creando...") : "Crear Procedimiento"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
