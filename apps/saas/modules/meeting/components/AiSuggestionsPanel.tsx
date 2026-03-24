"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
	CheckIcon,
	XIcon,
	Loader2Icon,
	SparklesIcon,
	LayoutTemplateIcon,
	PaperclipIcon,
	FileUpIcon,
	FileTextIcon,
	FileImageIcon,
	TrashIcon,
	LinkIcon,
	GripVerticalIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import type { DiagramNode } from "../types";
import type { ProcessPattern } from "@repo/ai/src/templates/process-patterns";

interface PatternSuggestion {
	patternId: string;
	confidence: number;
	message: string;
	pattern: ProcessPattern;
}

interface DocumentItem {
	id: string;
	name: string;
	mimeType: string;
	fileSize: number;
	linkedElement?: string | null;
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) return FileImageIcon;
	return FileTextIcon;
}

interface AiSuggestionsPanelProps {
	suggestions: DiagramNode[];
	onAddNode: (node: DiagramNode) => void;
	onRejectNode: (nodeId: string) => void;
	isLoading?: boolean;
	patternSuggestion?: PatternSuggestion | null;
	onApplyPattern?: (pattern: ProcessPattern) => void;
	onDismissPattern?: () => void;
	sessionId: string;
	processId?: string;
	/** Label of the currently selected BPMN element (for document linking) */
	selectedElementLabel?: string | null;
}

const NODE_TYPE_LABELS: Record<string, string> = {
	task: "Tarea",
	exclusiveGateway: "Decision",
	parallelGateway: "Paralelo",
	startEvent: "Inicio",
	endEvent: "Fin",
	start_event: "Inicio",
	end_event: "Fin",
	exclusive_gateway: "Decision",
	parallel_gateway: "Paralelo",
};

export function AiSuggestionsPanel({
	suggestions,
	onAddNode,
	onRejectNode,
	isLoading = false,
	patternSuggestion,
	onApplyPattern,
	onDismissPattern,
	sessionId,
	processId,
	selectedElementLabel,
}: AiSuggestionsPanelProps) {
	const formingSuggestions = suggestions.filter((n) => n.state === "forming");

	// ── Document upload state ──
	const [documents, setDocuments] = useState<DocumentItem[]>([]);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [pendingNodeIds, setPendingNodeIds] = useState<Set<string>>(new Set());
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchDocs = useCallback(async () => {
		try {
			const { orpcClient } = await import("@shared/lib/orpc-client");
			const docs = await orpcClient.documents.list();
			setDocuments(docs || []);
		} catch {
			// silent
		}
	}, []);

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		for (const file of Array.from(files)) {
			if (file.size > 50 * 1024 * 1024) {
				alert(`${file.name} excede 50MB`);
				return;
			}
		}
		// Capture selected element at upload time
		const linkedElement = selectedElementLabel || null;
		setUploading(true);
		try {
			for (const file of Array.from(files)) {
				const { orpcClient } = await import("@shared/lib/orpc-client");
				const result = await orpcClient.documents.createUploadUrl({
					fileName: file.name,
					mimeType: file.type,
				});
				await fetch(result.signedUploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				// Tag document with linked element in local state
				if (linkedElement) {
					setDocuments((prev) => [
						...prev,
						{
							id: `temp-${Date.now()}-${file.name}`,
							name: file.name,
							mimeType: file.type,
							fileSize: file.size,
							linkedElement,
						},
					]);
				}
			}
			await fetchDocs();
		} catch (err) {
			console.error("[AiSuggestionsPanel] Upload error:", err);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (documentId: string) => {
		try {
			const { orpcClient } = await import("@shared/lib/orpc-client");
			await orpcClient.documents.delete({ documentId });
			setDocuments((prev) => prev.filter((d) => d.id !== documentId));
		} catch (err) {
			console.error("[AiSuggestionsPanel] Delete error:", err);
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
				<SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
				<span className="text-xs font-medium uppercase tracking-wider text-[#F1F5F9]">
					Sugerencias IA
				</span>
				{formingSuggestions.length > 0 && (
					<span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
						{formingSuggestions.length}
					</span>
				)}
				{isLoading && (
					<Loader2Icon className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />
				)}
			</div>

			{/* Suggestions list */}
			<div className="flex-1 overflow-y-auto p-2">
				{/* Pattern Suggestion Card */}
				{patternSuggestion && (
					<div
						className="mb-3 rounded-lg border p-3"
						style={{
							backgroundColor: "#1E293B",
							borderColor: "#334155",
						}}
					>
						<div className="mb-2 flex items-center gap-1.5">
							<LayoutTemplateIcon className="h-3.5 w-3.5 text-emerald-400" />
							<span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
								Plantilla detectada
							</span>
							<span className="ml-auto rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
								{patternSuggestion.pattern.nodes.length} nodos
							</span>
						</div>

						<p className="mb-1 text-sm font-semibold text-white">
							{patternSuggestion.pattern.name}
						</p>
						<p className="mb-1 text-xs text-slate-400">
							{patternSuggestion.pattern.description}
						</p>
						<p className="mb-3 text-[11px] italic text-slate-500">
							{patternSuggestion.message}
						</p>

						<div className="flex gap-1.5">
							<Button
								size="sm"
								className="h-9 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700 hover:brightness-110 active:scale-[0.97] transition-all duration-150"
								onClick={() => onApplyPattern?.(patternSuggestion.pattern)}
							>
								<CheckIcon className="h-3 w-3" />
								Usar plantilla
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-9 text-xs text-slate-400 hover:text-slate-300"
								onClick={() => onDismissPattern?.()}
							>
								Ignorar
							</Button>
						</div>
					</div>
				)}

				{formingSuggestions.length === 0 && !patternSuggestion ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
							<SparklesIcon className="h-5 w-5 text-amber-500/70" />
						</div>
						<p className="text-xs text-[#94A3B8]">
							{isLoading
								? "Analizando la conversacion..."
								: "La IA esta escuchando. Las sugerencias de pasos apareceran a medida que se discutan procesos."}
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{formingSuggestions.map((node) => (
							<div
								key={node.id}
								draggable
								onDragStart={(e) => {
									e.dataTransfer.setData("application/prozea-node", JSON.stringify(node));
									e.dataTransfer.effectAllowed = "copy";
								}}
								onDragEnd={(e) => {
									// If dropped anywhere (including the diagram), add the node
									if (e.dataTransfer.dropEffect !== "none") {
										setPendingNodeIds((prev) => new Set(prev).add(node.id));
										onAddNode(node);
									}
								}}
								className="cursor-grab rounded-lg border border-amber-500/30 bg-amber-50/50 p-4 hover:bg-[#1E293B] transition-colors duration-150 cursor-pointer active:cursor-grabbing dark:bg-amber-500/5"
							>
								{/* Type badge + drag handle */}
								<div className="mb-1.5 flex items-center gap-1.5">
									<GripVerticalIcon className="h-3 w-3 text-amber-400/40" />
									<span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
										{NODE_TYPE_LABELS[node.type] || node.type}
									</span>
									{node.lane && (
										<span className="text-[10px] text-[#94A3B8]">
											{node.lane}
										</span>
									)}
								</div>

								{/* Label */}
								<p className="mb-2 text-sm font-medium text-foreground">
									{node.label}
								</p>

								{/* Actions */}
								<div className="flex gap-1.5">
									<Button
										size="sm"
										variant="primary"
										className="h-9 gap-1 text-xs hover:brightness-110 active:scale-[0.97] transition-all duration-150 focus:ring-2 focus:ring-[#2563EB]/50"
										disabled={pendingNodeIds.has(node.id)}
										onClick={() => {
											setPendingNodeIds((prev) => new Set(prev).add(node.id));
											onAddNode(node);
										}}
									>
										{pendingNodeIds.has(node.id) ? (
											<Loader2Icon className="h-3 w-3 animate-spin" />
										) : (
											<CheckIcon className="h-3 w-3" />
										)}
										{pendingNodeIds.has(node.id) ? "Agregando..." : "Agregar al diagrama"}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="h-9 gap-1 text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155]"
										disabled={pendingNodeIds.has(node.id)}
										onClick={() => {
											setPendingNodeIds((prev) => new Set(prev).add(node.id));
											onRejectNode(node.id);
										}}
									>
										<XIcon className="h-3 w-3" />
										Descartar
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* ── Divider ── */}
			<div className="border-t" style={{ borderColor: "#334155" }} />

			{/* ── Documents section ── */}
			<div className="flex flex-col overflow-hidden" style={{ minHeight: 120 }}>
				{/* Documents header */}
				<div className="flex items-center gap-1.5 px-3 py-2">
					<PaperclipIcon className="h-3.5 w-3.5" style={{ color: "#94A3B8" }} />
					<span
						className="text-xs font-medium uppercase tracking-wider"
						style={{ color: "#F1F5F9" }}
					>
						Documentos
					</span>
					{documents.length > 0 && (
						<span
							className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
							style={{ backgroundColor: "#334155", color: "#94A3B8" }}
						>
							{documents.length}
						</span>
					)}
				</div>

				{/* Drop zone */}
				<div className="px-2 pb-2">
					<div
						className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition-colors"
						style={{
							backgroundColor: dragOver ? "#1E293B" : "transparent",
							borderColor: dragOver ? "#60A5FA" : "#334155",
						}}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragOver(false);
							handleUpload(e.dataTransfer.files);
						}}
						onClick={() => fileInputRef.current?.click()}
					>
						<FileUpIcon className="mb-1 h-4 w-4" style={{ color: "#94A3B8" }} />
						<p className="text-[11px]" style={{ color: "#94A3B8" }}>
							{uploading ? "Subiendo..." : "Subir documento al proceso"}
						</p>
						{selectedElementLabel ? (
							<p className="mt-0.5 flex items-center gap-1 text-[10px]" style={{ color: "#60A5FA" }}>
								<LinkIcon className="h-2.5 w-2.5" />
								Vinculado a: {selectedElementLabel}
							</p>
						) : (
							<p className="mt-0.5 text-[10px]" style={{ color: "#64748B" }}>
								PDF, DOCX, TXT, imagenes — max 50MB
							</p>
						)}
						<input
							ref={fileInputRef}
							type="file"
							className="hidden"
							multiple
							accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
							onChange={(e) => handleUpload(e.target.files)}
						/>
					</div>
				</div>

				{/* Document list */}
				{documents.length > 0 && (
					<div className="flex-1 overflow-y-auto">
						<div className="divide-y" style={{ borderColor: "#334155" }}>
							{documents.map((doc) => {
								const Icon = getFileIcon(doc.mimeType);
								return (
									<div
										key={doc.id}
										className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-white/5"
									>
										<Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#94A3B8" }} />
										<div className="min-w-0 flex-1">
											<p className="truncate text-[11px] font-medium text-[#F1F5F9]">
												{doc.name}
											</p>
											<div className="flex items-center gap-1.5">
												<p className="text-[10px]" style={{ color: "#94A3B8" }}>
													{formatFileSize(doc.fileSize)}
												</p>
												{doc.linkedElement && (
													<span className="flex items-center gap-0.5 text-[9px]" style={{ color: "#60A5FA" }}>
														<LinkIcon className="h-2 w-2" />
														{doc.linkedElement}
													</span>
												)}
											</div>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-5 w-5 flex-shrink-0 hover:text-red-400"
											style={{ color: "#94A3B8" }}
											onClick={() => handleDelete(doc.id)}
										>
											<TrashIcon className="h-3 w-3" />
										</Button>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
