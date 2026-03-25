"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
	SparklesIcon,
	RefreshCwIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	Loader2Icon,
	DownloadIcon,
	ImageIcon,
	VideoIcon,
	PencilIcon,
} from "lucide-react";
import type { ProcedureResult, ProcedureStep } from "@repo/ai";
import { ProcedureEditor } from "./ProcedureEditor";

// Track in-flight generations globally so they survive component unmount
export const pendingGenerations = new Map<string, Promise<ProcedureResult | null>>();

interface SopDocumentViewProps {
	nodeId: string;
	nodeLabel: string;
	sessionId: string;
	procedure: ProcedureResult | null;
}

export function SopDocumentView({ nodeId, nodeLabel, sessionId, procedure: initialProcedure }: SopDocumentViewProps) {
	const [procedure, setProcedure] = useState<ProcedureResult | null>(initialProcedure);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (initialProcedure) setProcedure(initialProcedure);
	}, [initialProcedure]);

	const fetchedRef = useRef(false);
	useEffect(() => { fetchedRef.current = false; }, [nodeId]);
	useEffect(() => {
		if (procedure || initialProcedure || fetchedRef.current) return;
		fetchedRef.current = true;
		fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure`)
			.then((r) => r.json())
			.then((data) => { if (data.procedure) setProcedure(data.procedure as ProcedureResult); })
			.catch(() => {});
	}, [nodeId, sessionId, procedure, initialProcedure]);

	useEffect(() => {
		const pending = pendingGenerations.get(nodeId);
		if (pending) {
			setGenerating(true);
			pending.then((result) => { if (result) setProcedure(result); }).catch(() => {}).finally(() => setGenerating(false));
		}
	}, [nodeId]);

	// Debounced save to DB
	const saveProcedure = useCallback((updated: ProcedureResult) => {
		setProcedure(updated);
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		saveTimerRef.current = setTimeout(() => {
			fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ procedure: updated }),
			}).catch(() => {});
		}, 1500);
	}, [sessionId, nodeId]);

	// Helper to update a top-level field
	const updateField = useCallback((field: keyof ProcedureResult, value: any) => {
		if (!procedure) return;
		saveProcedure({ ...procedure, [field]: value });
	}, [procedure, saveProcedure]);

	// Helper to update a step field
	const updateStep = useCallback((stepIndex: number, field: keyof ProcedureStep, value: any) => {
		if (!procedure) return;
		const steps = [...procedure.steps];
		steps[stepIndex] = { ...steps[stepIndex], [field]: value };
		saveProcedure({ ...procedure, steps });
	}, [procedure, saveProcedure]);

	const handleGenerate = useCallback(async () => {
		setGenerating(true);
		setError(null);
		const promise = fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure`, { method: "POST" })
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Error al generar");
				return data.procedure as ProcedureResult;
			})
			.finally(() => pendingGenerations.delete(nodeId));
		pendingGenerations.set(nodeId, promise);
		try {
			const result = await promise;
			if (result) setProcedure(result);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setGenerating(false);
		}
	}, [sessionId, nodeId]);

	const handleExport = useCallback(() => {
		if (!procedure) return;
		const lines: string[] = [];
		lines.push(`PROCEDIMIENTO: ${procedure.activityName}`);
		lines.push(`Proceso: ${procedure.processName}`);
		lines.push(`Responsable: ${procedure.responsible}`);
		lines.push("");
		lines.push(`OBJETIVO\n${procedure.objective}\n`);
		lines.push(`ALCANCE\n${procedure.scope}\n`);
		if (procedure.prerequisites.length > 0) {
			lines.push("PRERREQUISITOS");
			procedure.prerequisites.forEach((p) => lines.push(`  - ${p}`));
			lines.push("");
		}
		lines.push("PASOS");
		procedure.steps.forEach((step) => {
			lines.push(`${step.stepNumber}. ${step.action}`);
			lines.push(`   ${step.description}`);
			if (step.systems.length > 0) lines.push(`   Sistemas: ${step.systems.join(", ")}`);
			step.exceptions.forEach((ex) => lines.push(`   Si ${ex.condition} → ${ex.action}`));
			lines.push("");
		});
		if (procedure.gaps.length > 0) {
			lines.push("INFORMACIÓN PENDIENTE");
			procedure.gaps.forEach((g) => lines.push(`  - ${g}`));
		}
		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `SOP-${nodeLabel.replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [procedure, nodeLabel]);

	if (generating) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<Loader2Icon className="h-8 w-8 animate-spin text-[#2563EB]" />
				<p className="text-sm text-[#94A3B8]">Generando procedimiento...</p>
				<p className="text-xs text-[#CBD5E1]">Analizando transcript y contexto BPMN</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<AlertTriangleIcon className="h-8 w-8 text-[#EAB308]" />
				<p className="text-sm text-[#94A3B8]">{error}</p>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]">
					<RefreshCwIcon className="h-3.5 w-3.5" /> Reintentar
				</button>
			</div>
		);
	}

	if (!procedure) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<div className="rounded-2xl bg-[#EFF6FF] p-5">
					<SparklesIcon className="h-10 w-10 text-[#2563EB]" />
				</div>
				<div className="text-center">
					<p className="text-sm font-medium text-[#0F172A]">Sin procedimiento</p>
					<p className="mt-1 max-w-sm text-xs text-[#64748B]">
						Genera un documento SOP completo usando la transcripcion de la sesion y el contexto del diagrama BPMN.
					</p>
				</div>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]">
					<SparklesIcon className="h-4 w-4" /> Generar SOP con IA
				</button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[720px] px-8 py-6">
			{/* Document header */}
			<div className="mb-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">Procedimiento</p>
						<h2 className="mt-1 text-lg font-bold text-[#0F172A]">{procedure.activityName}</h2>
						<p className="mt-0.5 text-xs text-[#64748B]">{procedure.processName}</p>
					</div>
					<div className="flex items-center gap-2">
						<button onClick={handleGenerate} className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[11px] text-[#64748B] hover:bg-white hover:text-[#334155]">
							<RefreshCwIcon className="h-3 w-3" /> Regenerar
						</button>
						<button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#1D4ED8]">
							<DownloadIcon className="h-3 w-3" /> Exportar
						</button>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-3">
					<MetaField label="Codigo" value={procedure.procedureCode || "—"} />
					<MetaField label="Responsable" value={procedure.responsible} />
					<MetaField label="Frecuencia" value={procedure.frequency || "—"} />
				</div>
				{procedure.overallConfidence != null && (
					<div className="mt-3 flex items-center gap-2">
						<span className="text-[10px] text-[#94A3B8]">Confianza</span>
						<div className="h-1.5 flex-1 rounded-full bg-[#E2E8F0]">
							<div
								className="h-1.5 rounded-full transition-all"
								style={{
									width: `${Math.round(procedure.overallConfidence * 100)}%`,
									backgroundColor: procedure.overallConfidence > 0.7 ? "#16A34A" : procedure.overallConfidence > 0.4 ? "#EAB308" : "#EF4444",
								}}
							/>
						</div>
						<span className="text-[10px] font-medium tabular-nums text-[#64748B]">{Math.round(procedure.overallConfidence * 100)}%</span>
					</div>
				)}
			</div>

			{/* Objective — editable */}
			<DocSection title="Objetivo">
				<EditableText
					value={procedure.objective}
					onChange={(v) => updateField("objective", v)}
					sessionId={sessionId}
				/>
			</DocSection>

			{/* Scope — editable */}
			<DocSection title="Alcance">
				<EditableText
					value={procedure.scope}
					onChange={(v) => updateField("scope", v)}
					sessionId={sessionId}
				/>
			</DocSection>

			{/* Prerequisites */}
			{procedure.prerequisites.length > 0 && (
				<DocSection title="Prerrequisitos">
					<ul className="space-y-1.5">
						{procedure.prerequisites.map((p, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
								<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
								{p}
							</li>
						))}
					</ul>
				</DocSection>
			)}

			{/* Steps — each step description is editable */}
			<DocSection title={`Pasos del Procedimiento (${procedure.steps.length})`}>
				<div className="space-y-4">
					{procedure.steps.map((step, idx) => (
						<div key={step.stepNumber} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
							<div className="flex items-start gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">
									{step.stepNumber}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-[#0F172A]">{step.action}</p>

									{/* Editable description */}
									<div className="mt-1">
										<EditableText
											value={step.description}
											onChange={(v) => updateStep(idx, "description", v)}
											sessionId={sessionId}
											placeholder="Describe este paso en detalle..."
										/>
									</div>

									{/* Metadata row */}
									<div className="mt-2 flex flex-wrap items-center gap-2">
										{step.responsible && (
											<span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">{step.responsible}</span>
										)}
										{step.systems.map((s) => (
											<span key={s} className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">{s}</span>
										))}
										{step.estimatedTime && (
											<span className="text-[10px] text-[#94A3B8]">{step.estimatedTime}</span>
										)}
									</div>

									{/* I/O */}
									{(step.inputs.length > 0 || step.outputs.length > 0) && (
										<div className="mt-2 grid grid-cols-2 gap-2">
											{step.inputs.length > 0 && (
												<div className="rounded-lg bg-[#F8FAFC] p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Entradas</p>
													{step.inputs.map((inp) => (
														<p key={inp} className="mt-0.5 text-[11px] text-[#475569]">{inp}</p>
													))}
												</div>
											)}
											{step.outputs.length > 0 && (
												<div className="rounded-lg bg-[#F0FDF4] p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">Salidas</p>
													{step.outputs.map((out) => (
														<p key={out} className="mt-0.5 text-[11px] text-[#475569]">{out}</p>
													))}
												</div>
											)}
										</div>
									)}

									{/* Controls */}
									{step.controls.length > 0 && (
										<div className="mt-2">
											{step.controls.map((c) => (
												<p key={c} className="flex items-start gap-1.5 text-[11px] text-[#475569]">
													<CheckCircle2Icon className="mt-0.5 h-3 w-3 shrink-0 text-[#16A34A]" />{c}
												</p>
											))}
										</div>
									)}

									{/* Exceptions */}
									{step.exceptions.length > 0 && (
										<div className="mt-2 space-y-1">
											{step.exceptions.map((ex, i) => (
												<div key={i} className="rounded-lg bg-[#FEF9C3] px-3 py-1.5 text-[11px]">
													<span className="font-medium text-[#92400E]">Si: </span>
													<span className="text-[#78350F]">{ex.condition}</span>
													<span className="text-[#92400E]"> → {ex.action}</span>
												</div>
											))}
										</div>
									)}

									{/* Editable notes + media area */}
									<div className="mt-2">
										<EditableText
											value={step.notes || ""}
											onChange={(v) => updateStep(idx, "notes", v)}
											sessionId={sessionId}
											placeholder="Notas, capturas de pantalla, videos..."
											mini
										/>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</DocSection>

			{/* KPIs */}
			{procedure.indicators.length > 0 && (
				<DocSection title="Indicadores">
					<div className="grid grid-cols-2 gap-3">
						{procedure.indicators.map((ind, i) => (
							<div key={i} className="rounded-lg border border-[#E2E8F0] p-3">
								<p className="text-xs font-medium text-[#0F172A]">{ind.name}</p>
								{ind.formula && <p className="mt-0.5 text-[11px] text-[#64748B]">{ind.formula}</p>}
								{ind.target && <p className="mt-1 text-[11px] font-medium text-[#2563EB]">Meta: {ind.target}</p>}
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Gaps with media suggestions */}
			{procedure.gaps.length > 0 && (
				<DocSection title="Informacion Pendiente">
					<div className="space-y-2">
						{procedure.gaps.map((gap, i) => (
							<div key={i} className="flex items-start gap-2 rounded-lg bg-[#FEF9C3] px-3 py-2 text-sm">
								<AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" />
								<span className="text-[#78350F]">{gap}</span>
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Media suggestions from AI */}
			<DocSection title="Material de Apoyo">
				<div className="space-y-2">
					<MediaPlaceholder
						icon={<ImageIcon className="h-4 w-4" />}
						label="Agregar captura de pantalla"
						hint="Captura del sistema, formulario o pantalla relevante a este procedimiento"
						sessionId={sessionId}
						onInsert={(content) => {
							updateField("relatedDocuments", [...(procedure.relatedDocuments || []), content]);
						}}
					/>
					<MediaPlaceholder
						icon={<VideoIcon className="h-4 w-4" />}
						label="Agregar video explicativo"
						hint="Video de YouTube, Vimeo o Loom mostrando cómo ejecutar el procedimiento"
						isVideo
						sessionId={sessionId}
						onInsert={(content) => {
							updateField("relatedDocuments", [...(procedure.relatedDocuments || []), content]);
						}}
					/>
				</div>
			</DocSection>
		</div>
	);
}

// ─── Editable inline text with TipTap ───────────────────────────────

function EditableText({
	value,
	onChange,
	sessionId,
	placeholder,
	mini,
}: {
	value: string;
	onChange: (value: string) => void;
	sessionId: string;
	placeholder?: string;
	mini?: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [richContent, setRichContent] = useState<Record<string, any> | undefined>(undefined);

	if (editing) {
		return (
			<div className="rounded-lg ring-1 ring-[#2563EB]/30">
				<ProcedureEditor
					content={richContent || value}
					onChange={(doc) => {
						setRichContent(doc);
						// Extract plain text from TipTap JSON for the procedure field
						const text = extractText(doc);
						onChange(text);
					}}
					sessionId={sessionId}
				/>
				<div className="flex justify-end border-t border-[#E2E8F0] px-2 py-1">
					<button
						type="button"
						onClick={() => setEditing(false)}
						className="rounded px-2 py-0.5 text-[10px] font-medium text-[#2563EB] hover:bg-[#EFF6FF]"
					>
						Listo
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`group/edit relative cursor-text rounded-lg transition-colors hover:bg-[#F8FAFC] ${mini ? "px-2 py-1" : "px-3 py-2"}`}
			onClick={() => setEditing(true)}
		>
			{value ? (
				<p className={`leading-relaxed text-[#334155] ${mini ? "text-[11px] italic text-[#94A3B8]" : "text-sm"}`}>
					{value}
				</p>
			) : (
				<p className={`italic text-[#CBD5E1] ${mini ? "text-[11px]" : "text-sm"}`}>
					{placeholder || "Click para editar..."}
				</p>
			)}
			<PencilIcon className="absolute right-2 top-2 h-3 w-3 text-[#CBD5E1] opacity-0 transition-opacity group-hover/edit:opacity-100" />
		</div>
	);
}

/** Extract plain text from TipTap JSON doc */
function extractText(doc: Record<string, any>): string {
	if (!doc?.content) return "";
	return doc.content
		.map((node: any) => {
			if (node.content) {
				return node.content.map((c: any) => c.text || "").join("");
			}
			return "";
		})
		.join("\n")
		.trim();
}

// ─── Media placeholder ──────────────────────────────────────────────

function MediaPlaceholder({
	icon,
	label,
	hint,
	isVideo,
	sessionId,
	onInsert,
}: {
	icon: React.ReactNode;
	label: string;
	hint: string;
	isVideo?: boolean;
	sessionId: string;
	onInsert: (content: string) => void;
}) {
	const handleClick = useCallback(() => {
		if (isVideo) {
			const url = prompt("URL del video (YouTube, Vimeo, Loom):");
			if (url) onInsert(url);
		} else {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.onchange = () => {
				const file = input.files?.[0];
				if (file) onInsert(file.name);
			};
			input.click();
		}
	}, [isVideo, onInsert]);

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#E2E8F0] px-4 py-3 text-left transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF]/50"
		>
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#94A3B8]">
				{icon}
			</div>
			<div>
				<p className="text-xs font-medium text-[#334155]">{label}</p>
				<p className="text-[10px] text-[#94A3B8]">{hint}</p>
			</div>
		</button>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-white px-3 py-2">
			<p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">{label}</p>
			<p className="mt-0.5 text-xs font-medium text-[#334155]">{value}</p>
		</div>
	);
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-6">
			<h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
				{title}
				<div className="h-px flex-1 bg-[#E2E8F0]" />
			</h3>
			{children}
		</div>
	);
}
