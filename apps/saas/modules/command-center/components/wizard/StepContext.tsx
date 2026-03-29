"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
	UploadCloudIcon,
	FileIcon,
	TrashIcon,
	SparklesIcon,
	Loader2Icon,
	RefreshCwIcon,
	CheckCircleIcon,
	GitBranchIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { WizardData } from "../SessionWizard";

export function StepContext({
	data,
	onChange,
}: {
	data: WizardData;
	onChange: (patch: Partial<WizardData>) => void;
}) {
	const [dragging, setDragging] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [hasGenerated, setHasGenerated] = useState(false);
	const [generatingDiagram, setGeneratingDiagram] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Auto-generate context template when step loads and textarea is empty
	useEffect(() => {
		if (!hasGenerated && !data.contextText.trim() && data.processName.trim()) {
			generateTemplate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const generateTemplate = async () => {
		if (!data.processName.trim()) return;
		setGenerating(true);
		try {
			const res = await fetch("/api/sessions/generate-context", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					processName: data.processName,
					sessionType: data.sessionType,
				}),
			});
			if (!res.ok) throw new Error("Failed");
			const { context } = await res.json();
			if (context) {
				onChange({ contextText: context });
			}
		} catch {
			// Silently fail — user can still type manually
		} finally {
			setGenerating(false);
			setHasGenerated(true);
		}
	};

	const handlePreBuildDiagram = async () => {
		if (!data.processName.trim()) return;
		setGeneratingDiagram(true);
		try {
			const res = await fetch("/api/sessions/pre-build-diagram", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					processName: data.processName,
					sessionType: data.sessionType,
					context: data.contextText,
				}),
			});
			if (!res.ok) throw new Error("Failed");
			const result = await res.json();
			onChange({
				preBuildNodes: result.nodes,
				preBuildLanes: result.lanes,
			});
			toast.success(`Diagrama borrador generado: ${result.nodes.length} nodos`);
		} catch {
			toast.error("No se pudo generar el diagrama. Intenta de nuevo.");
		} finally {
			setGeneratingDiagram(false);
		}
	};

	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files) return;
			const newFiles = Array.from(files);
			onChange({ contextFiles: [...data.contextFiles, ...newFiles] });
		},
		[data.contextFiles, onChange],
	);

	const removeFile = (index: number) => {
		const updated = data.contextFiles.filter((_, i) => i !== index);
		onChange({ contextFiles: updated });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		handleFiles(e.dataTransfer.files);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div className="flex h-full flex-col">
			{/* Shimmer animation for loading bar */}
			{generating && (
				<style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
			)}
			<h2 className="mb-1 text-xl font-semibold text-chrome-text">Contexto</h2>
			<p className="mb-6 text-sm text-chrome-text-muted">
				La IA pre-llena un template basado en el proceso. Edita, expande o reemplaza con tu conocimiento.
			</p>

			{/* Context textarea with AI generation */}
			<div className="mb-5">
				<div className="mb-2 flex items-center justify-between">
					<label className="text-xs font-medium text-chrome-text-secondary">
						Contexto y notas previas
					</label>
					<button
						type="button"
						onClick={generateTemplate}
						disabled={generating || !data.processName.trim()}
						className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-primary/10 disabled:opacity-50"
					>
						{generating ? (
							<>
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
								Generando...
							</>
						) : (
							<>
								<RefreshCwIcon className="h-3.5 w-3.5" />
								Regenerar template
							</>
						)}
					</button>
				</div>

				<div className="relative">
					<textarea
						value={data.contextText}
						onChange={(e) => onChange({ contextText: e.target.value })}
						placeholder="Describe el contexto del proceso, objetivos de la sesión, información relevante del cliente..."
						rows={8}
						disabled={generating}
						className="w-full resize-none rounded-lg border border-chrome-border bg-chrome-raised px-4 py-3 text-sm leading-relaxed text-chrome-text placeholder:text-chrome-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
					/>
					{generating && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-chrome-base/90 backdrop-blur-sm">
							{/* Animated dots */}
							<div className="flex items-center gap-1.5">
								<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
								<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
								<div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
							</div>
							<div className="text-center">
								<p className="text-sm font-medium text-chrome-text">Analizando proceso</p>
								<p className="mt-1 text-xs text-chrome-text-muted">Preparando notas de contexto, participantes típicos y preguntas clave...</p>
							</div>
							{/* Progress bar animation */}
							<div className="h-1 w-48 overflow-hidden rounded-full bg-chrome-raised">
								<div className="h-full animate-[shimmer_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" style={{ width: "200%", marginLeft: "-50%" }} />
							</div>
						</div>
					)}
				</div>

				{hasGenerated && data.contextText.trim() && (
					<p className="mt-1.5 text-[11px] text-chrome-text-muted">
						Template generado por IA — edita libremente, agrega lo que sabes del cliente
					</p>
				)}
			</div>

			{/* File upload area */}
			<div className="mb-4">
				<label className="mb-2 block text-xs font-medium text-chrome-text-secondary">
					Documentos de apoyo
				</label>
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
						dragging
							? "border-primary bg-primary/10"
							: "border-chrome-border bg-chrome-raised hover:border-chrome-text-muted"
					}`}
				>
					<UploadCloudIcon
						className={`mb-2 h-8 w-8 ${dragging ? "text-primary" : "text-chrome-text-muted"}`}
					/>
					<p className="text-sm font-medium text-chrome-text-secondary">
						Arrastra archivos aquí o haz clic para seleccionar
					</p>
					<p className="mt-1 text-xs text-chrome-text-muted">
						PDF, Word, Excel, imágenes (max. 10 MB por archivo)
					</p>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					onChange={(e) => handleFiles(e.target.files)}
					className="hidden"
					accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
				/>
			</div>

			{/* Uploaded files list */}
			{data.contextFiles.length > 0 && (
				<div className="mb-5 space-y-2">
					{data.contextFiles.map((file, index) => (
						<div
							key={`${file.name}-${index}`}
							className="flex items-center gap-3 rounded-lg border border-chrome-border bg-chrome-raised px-3 py-2"
						>
							<FileIcon className="h-4 w-4 shrink-0 text-chrome-text-muted" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm text-chrome-text">{file.name}</p>
								<p className="text-[11px] text-chrome-text-muted">{formatFileSize(file.size)}</p>
							</div>
							<button
								type="button"
								onClick={() => removeFile(index)}
								className="rounded-md p-1 text-chrome-text-muted transition-colors hover:bg-chrome-hover hover:text-destructive"
							>
								<TrashIcon className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Pre-generate diagram */}
			<div className="mt-auto">
				{data.preBuildNodes && data.preBuildNodes.length > 0 ? (
					<div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
						<CheckCircleIcon className="h-4 w-4 text-success" />
						<span className="text-sm text-success">
							Diagrama borrador generado — {data.preBuildNodes.length} nodos, {data.preBuildLanes?.length ?? 0} lanes
						</span>
						<button
							type="button"
							onClick={handlePreBuildDiagram}
							disabled={generatingDiagram}
							className="ml-auto text-xs text-chrome-text-muted hover:text-chrome-text"
						>
							Regenerar
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={handlePreBuildDiagram}
						disabled={generatingDiagram || !data.processName.trim()}
						className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2.5 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-primary hover:text-blue-400 disabled:opacity-50"
					>
						{generatingDiagram ? (
							<>
								<Loader2Icon className="h-4 w-4 animate-spin" />
								Generando diagrama borrador...
							</>
						) : (
							<>
								<GitBranchIcon className="h-4 w-4" />
								Pre-generar diagrama con IA
							</>
						)}
					</button>
				)}
			</div>
		</div>
	);
}
