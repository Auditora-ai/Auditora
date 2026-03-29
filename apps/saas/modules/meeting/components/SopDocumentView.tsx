"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
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
	const t = useTranslations("meeting");
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
				if (!res.ok) throw new Error(data.error || t("toast.generateError"));
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
				<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-chrome-text-secondary">{t("sop.generating")}</p>
				<p className="text-xs text-chrome-text-secondary">{t("sop.generatingContext")}</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
				<p className="text-sm text-chrome-text-secondary">{error}</p>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-action-hover">
					<RefreshCwIcon className="h-3.5 w-3.5" /> {t("sop.retry")}
				</button>
			</div>
		);
	}

	if (!procedure) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<div className="rounded-2xl bg-accent p-5">
					<SparklesIcon className="h-10 w-10 text-primary" />
				</div>
				<div className="text-center">
					<p className="text-sm font-medium text-canvas-text">{t("sop.noProcedure")}</p>
					<p className="mt-1 max-w-sm text-xs text-chrome-text-muted">
						{t("sop.noProcedureDescription")}
					</p>
				</div>
				<button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-action-hover">
					<SparklesIcon className="h-4 w-4" /> {t("sop.generateSop")}
				</button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[720px] px-8 py-6">
			{/* Document header */}
			<div className="mb-6 rounded-xl border border-canvas-border bg-secondary p-5">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-wider text-chrome-text-secondary">{t("sop.procedureLabel")}</p>
						<h2 className="mt-1 text-lg font-bold text-canvas-text">{procedure.activityName}</h2>
						<p className="mt-0.5 text-xs text-chrome-text-muted">{procedure.processName}</p>
					</div>
					<div className="flex items-center gap-2">
						<button onClick={handleGenerate} className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-3 py-1.5 text-[11px] text-chrome-text-muted hover:bg-background hover:text-canvas-text-secondary">
							<RefreshCwIcon className="h-3.5 w-3.5" /> {t("sop.regenerate")}
						</button>
						<button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-action-hover">
							<DownloadIcon className="h-3.5 w-3.5" /> {t("sop.export")}
						</button>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-3">
					<MetaField label={t("sop.codeField")} value={procedure.procedureCode || "—"} />
					<MetaField label={t("sop.responsibleField")} value={procedure.responsible} />
					<MetaField label={t("sop.frequencyField")} value={procedure.frequency || "—"} />
				</div>
				{procedure.overallConfidence != null && (
					<div className="mt-3 flex items-center gap-2">
						<span className="text-[10px] text-chrome-text-secondary">{t("sop.confidenceLabel")}</span>
						<div className="h-1.5 flex-1 rounded-full bg-canvas-border">
							<div
								className="h-1.5 rounded-full transition-all"
								style={{
									width: `${Math.round(procedure.overallConfidence * 100)}%`,
									backgroundColor: procedure.overallConfidence > 0.7 ? "var(--palette-success)" : procedure.overallConfidence > 0.4 ? "var(--palette-warning)" : "var(--palette-destructive)",
								}}
							/>
						</div>
						<span className="text-[10px] font-medium tabular-nums text-chrome-text-muted">{Math.round(procedure.overallConfidence * 100)}%</span>
					</div>
				)}
			</div>

			{/* Objective — editable */}
			<DocSection title={t("sop.objectiveSection")}>
				<EditableText
					value={procedure.objective}
					onChange={(v) => updateField("objective", v)}
					sessionId={sessionId}
				/>
			</DocSection>

			{/* Scope — editable */}
			<DocSection title={t("sop.scopeSection")}>
				<EditableText
					value={procedure.scope}
					onChange={(v) => updateField("scope", v)}
					sessionId={sessionId}
				/>
			</DocSection>

			{/* Prerequisites */}
			{procedure.prerequisites.length > 0 && (
				<DocSection title={t("sop.prerequisitesSection")}>
					<ul className="space-y-1.5">
						{procedure.prerequisites.map((p, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-canvas-text-secondary">
								<CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
								{p}
							</li>
						))}
					</ul>
				</DocSection>
			)}

			{/* Steps — each step description is editable */}
			<DocSection title={`${t("sop.stepsSection")} (${procedure.steps.length})`}>
				<div className="space-y-4">
					{procedure.steps.map((step, idx) => (
						<div key={step.stepNumber} className="rounded-xl border border-canvas-border bg-background p-4">
							<div className="flex items-start gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
									{step.stepNumber}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-canvas-text">{step.action}</p>

									{/* Editable description */}
									<div className="mt-1">
										<EditableText
											value={step.description}
											onChange={(v) => updateStep(idx, "description", v)}
											sessionId={sessionId}
											placeholder={t("sop.describeStep")}
										/>
									</div>

									{/* Metadata row */}
									<div className="mt-2 flex flex-wrap items-center gap-2">
										{step.responsible && (
											<span className="rounded-md bg-canvas-surface px-2 py-0.5 text-[10px] font-medium text-chrome-subtle">{step.responsible}</span>
										)}
										{step.systems.map((s) => (
											<span key={s} className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">{s}</span>
										))}
										{step.estimatedTime && (
											<span className="text-[10px] text-chrome-text-secondary">{step.estimatedTime}</span>
										)}
									</div>

									{/* I/O */}
									{(step.inputs.length > 0 || step.outputs.length > 0) && (
										<div className="mt-2 grid grid-cols-2 gap-2">
											{step.inputs.length > 0 && (
												<div className="rounded-lg bg-secondary p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-chrome-text-secondary">{t("sop.inputsLabel")}</p>
													{step.inputs.map((inp) => (
														<p key={inp} className="mt-0.5 text-[11px] text-chrome-subtle">{inp}</p>
													))}
												</div>
											)}
											{step.outputs.length > 0 && (
												<div className="rounded-lg bg-green-50 p-2">
													<p className="text-[9px] font-semibold uppercase tracking-wider text-chrome-text-secondary">{t("sop.outputsLabel")}</p>
													{step.outputs.map((out) => (
														<p key={out} className="mt-0.5 text-[11px] text-chrome-subtle">{out}</p>
													))}
												</div>
											)}
										</div>
									)}

									{/* Controls */}
									{step.controls.length > 0 && (
										<div className="mt-2">
											{step.controls.map((c) => (
												<p key={c} className="flex items-start gap-1.5 text-[11px] text-chrome-subtle">
													<CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{c}
												</p>
											))}
										</div>
									)}

									{/* Exceptions */}
									{step.exceptions.length > 0 && (
										<div className="mt-2 space-y-1">
											{step.exceptions.map((ex, i) => (
												<div key={i} className="rounded-lg bg-yellow-100 px-3 py-1.5 text-[11px]">
													<span className="font-medium text-amber-800">{t("sop.exceptionPrefix")}</span>
													<span className="text-amber-900">{ex.condition}</span>
													<span className="text-amber-800"> → {ex.action}</span>
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
											placeholder={t("sop.notesPlaceholder")}
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
				<DocSection title={t("sop.indicatorsSection")}>
					<div className="grid grid-cols-2 gap-3">
						{procedure.indicators.map((ind, i) => (
							<div key={i} className="rounded-lg border border-canvas-border p-3">
								<p className="text-xs font-medium text-canvas-text">{ind.name}</p>
								{ind.formula && <p className="mt-0.5 text-[11px] text-chrome-text-muted">{ind.formula}</p>}
								{ind.target && <p className="mt-1 text-[11px] font-medium text-primary">{t("sop.targetLabel")}: {ind.target}</p>}
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Gaps with media suggestions */}
			{procedure.gaps.length > 0 && (
				<DocSection title={t("sop.pendingInfoSection")}>
					<div className="space-y-2">
						{procedure.gaps.map((gap, i) => (
							<div key={i} className="flex items-start gap-2 rounded-lg bg-yellow-100 px-3 py-2 text-sm">
								<AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
								<span className="text-amber-900">{gap}</span>
							</div>
						))}
					</div>
				</DocSection>
			)}

			{/* Media suggestions from AI */}
			<DocSection title={t("sop.supportMaterialSection")}>
				<div className="space-y-2">
					<MediaPlaceholder
						icon={<ImageIcon className="h-4 w-4" />}
						label={t("sop.addScreenshot")}
						hint="Captura del sistema, formulario o pantalla relevante a este procedimiento"
						sessionId={sessionId}
						onInsert={(content) => {
							updateField("relatedDocuments", [...(procedure.relatedDocuments || []), content]);
						}}
					/>
					<MediaPlaceholder
						icon={<VideoIcon className="h-4 w-4" />}
						label={t("sop.addVideo")}
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
	const t = useTranslations("meeting");
	const [editing, setEditing] = useState(false);
	const [richContent, setRichContent] = useState<Record<string, any> | undefined>(undefined);

	if (editing) {
		return (
			<div className="rounded-lg ring-1 ring-primary/30">
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
				<div className="flex justify-end border-t border-canvas-border px-2 py-1">
					<button
						type="button"
						onClick={() => setEditing(false)}
						className="rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-accent"
					>
						{t("sop.doneEditing")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`group/edit relative cursor-text rounded-lg transition-colors hover:bg-secondary ${mini ? "px-2 py-1" : "px-3 py-2"}`}
			onClick={() => setEditing(true)}
		>
			{value ? (
				<p className={`leading-relaxed text-canvas-text-secondary ${mini ? "text-[11px] italic text-chrome-text-secondary" : "text-sm"}`}>
					{value}
				</p>
			) : (
				<p className={`italic text-chrome-text-secondary ${mini ? "text-[11px]" : "text-sm"}`}>
					{placeholder || t("sop.clickToEdit")}
				</p>
			)}
			<PencilIcon className="absolute right-2 top-2 h-3.5 w-3.5 text-chrome-text-secondary opacity-0 transition-opacity group-hover/edit:opacity-100" />
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
			className="flex w-full items-center gap-3 rounded-lg border border-dashed border-canvas-border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-accent/50"
		>
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-canvas-surface text-chrome-text-secondary">
				{icon}
			</div>
			<div>
				<p className="text-xs font-medium text-canvas-text-secondary">{label}</p>
				<p className="text-[10px] text-chrome-text-secondary">{hint}</p>
			</div>
		</button>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-background px-3 py-2">
			<p className="text-[9px] font-semibold uppercase tracking-wider text-chrome-text-secondary">{label}</p>
			<p className="mt-0.5 text-xs font-medium text-canvas-text-secondary">{value}</p>
		</div>
	);
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-6">
			<h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chrome-text-secondary">
				{title}
				<div className="h-px flex-1 bg-canvas-border" />
			</h3>
			{children}
		</div>
	);
}
