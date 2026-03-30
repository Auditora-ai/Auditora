"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	ChevronRightIcon,
	SquareIcon,
	PlusIcon,
	XIcon,
	PaperclipIcon,
	FileIcon,
	Trash2Icon,
	TimerIcon,
	ArrowRightLeftIcon,
	DollarSignIcon,
	ClipboardListIcon,
	SparklesIcon,
	Loader2Icon,
	FileTextIcon,
	InfoIcon,
} from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import type { DiagramNode, NodeProperties } from "../types";
import { PROPERTY_FIELDS, PROPERTY_GROUPS } from "../lib/node-properties-schema";
import { ProcedureEditor } from "./ProcedureEditor";
import { SopDocumentView, pendingGenerations } from "./SopDocumentView";

interface NodePropertiesViewProps {
	tabId: string;
	elementId: string;
	label: string;
}

// ─── Node type config (shared) ───────────────────────────────────
import { getNodeConfig, STATE_BADGE } from "../lib/node-display-config";
const getConfig = getNodeConfig;

// ─── Group icons ──────────────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ElementType> = {
	general: FileIcon,
	recursos: TimerIcon,
	entradas_salidas: ArrowRightLeftIcon,
	costos: DollarSignIcon,
};

export function NodePropertiesView({ tabId, elementId, label }: NodePropertiesViewProps) {
	const t = useTranslations("meeting");
	const { nodes, sessionId, modelerApi, selectedNodeId, setSelectedNodeId } = useLiveSessionContext();

	const [editingState, setEditingState] = useState<Record<string, NodeProperties>>({});
	const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	const hierarchy: { id: string; type: string; label: string; parentId: string | null }[] = useMemo(() => {
		if (!modelerApi?.isReady) return [];
		return modelerApi.getNodeHierarchy();
	}, [modelerApi, modelerApi?.isReady, nodes]);

	const childNodes: { id: string; type: string; label: string; dbNode: DiagramNode | undefined }[] = useMemo(() => {
		const childElements = hierarchy.filter((h) => {
			if (elementId === "Process_1") return h.parentId === null;
			return h.parentId === elementId;
		});
		return childElements.map((h) => {
			const dbNode = nodes.find((n) => n.id === h.id);
			return { id: h.id, type: h.type, label: h.label || dbNode?.label || h.id, dbNode };
		});
	}, [hierarchy, nodes, elementId]);

	// Auto-select first task-like node
	useEffect(() => {
		if (!selectedNodeId && childNodes.length > 0) {
			const firstTask = childNodes.find((n) => n.type.includes("Task") || n.type.includes("SubProcess"));
			setSelectedNodeId(firstTask?.id || childNodes[0].id);
		}
	}, [childNodes, selectedNodeId]);

	const getEffectiveProperties = useCallback(
		(nodeId: string): NodeProperties => {
			const localEdits = editingState[nodeId];
			const dbNode = nodes.find((n) => n.id === nodeId);
			const dbProps = (dbNode?.properties || {}) as NodeProperties;
			return localEdits ? { ...dbProps, ...localEdits } : dbProps;
		},
		[editingState, nodes],
	);

	const saveProperties = useCallback(
		(nodeId: string, properties: NodeProperties) => {
			if (saveTimers.current[nodeId]) clearTimeout(saveTimers.current[nodeId]);
			setEditingState((prev) => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), ...properties } }));
			saveTimers.current[nodeId] = setTimeout(async () => {
				try {
					const res = await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ action: "edit", properties }),
					});
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					setEditingState((prev) => { const next = { ...prev }; delete next[nodeId]; return next; });
				} catch {
					toast.error(t("toast.savePropsError"));
				}
			}, 1000);
		},
		[sessionId],
	);

	useEffect(() => { return () => { for (const t of Object.values(saveTimers.current)) clearTimeout(t); }; }, []);

	useEffect(() => {
		const handler = () => {
			for (const [nodeId, props] of Object.entries(editingState)) {
				navigator.sendBeacon(
					`/api/sessions/${sessionId}/nodes/${nodeId}`,
					new Blob([JSON.stringify({ action: "edit", properties: props })], { type: "application/json" }),
				);
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [editingState, sessionId]);

	const selectedNode = childNodes.find((n) => n.id === selectedNodeId);
	const selectedProps = selectedNodeId ? getEffectiveProperties(selectedNodeId) : {};
	const selectedConfig = selectedNode ? getConfig(selectedNode.type) : getConfig("");
	const selectedState = selectedNode?.dbNode?.state || "forming";
	const stateBadge = STATE_BADGE[selectedState] || STATE_BADGE.forming;
	// docMode per node — persisted locally (ref survives re-renders) + DB
	const docModeCache = useRef<Map<string, "description" | "sop">>(new Map());
	const docMode: "description" | "sop" = selectedNodeId
		? (docModeCache.current.get(selectedNodeId) ?? ((selectedProps as any).docMode === "sop" ? "sop" : "description"))
		: "description";
	const setDocMode = useCallback((mode: "description" | "sop") => {
		if (!selectedNodeId) return;
		docModeCache.current.set(selectedNodeId, mode);
		saveProperties(selectedNodeId, { docMode: mode });
	}, [selectedNodeId, saveProperties]);

	// Re-render periodically to update working indicators from global maps
	const [, setTick] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setTick((t) => t + 1), 1500);
		return () => clearInterval(id);
	}, []);

	const isNodeWorking = (nodeId: string) => pendingGenerations.has(nodeId) || pendingDrafts.has(nodeId);

	// Count documented fields for progress
	const getDocProgress = (nodeId: string) => {
		const p = getEffectiveProperties(nodeId);
		let filled = 0;
		let total = 0;
		for (const f of PROPERTY_FIELDS) {
			total++;
			const v = p[f.key as keyof NodeProperties];
			if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) filled++;
		}
		return { filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
	};

	return (
		<div className="flex h-full" style={{ fontFamily: "'Geist Sans', system-ui, sans-serif" }}>
			{/* ─── Left sidebar: node list ─── */}
			<div className="flex w-[240px] shrink-0 flex-col border-r border-canvas-border bg-secondary">
				{/* Process header */}
				<div className="border-b border-canvas-border px-4 py-3">
					<h2 className="text-sm font-semibold text-canvas-text">{label}</h2>
					<div className="mt-1 flex items-center gap-2">
						<span className="text-[10px] text-chrome-text-secondary">
							{t("nodeProperties.elementCount", { count: childNodes.length })}
						</span>
						<span className="text-[10px] text-chrome-text-secondary">·</span>
						<span className="text-[10px] text-chrome-text-secondary">
							{childNodes.filter((n) => {
								const p = getDocProgress(n.id);
								return p.filled > 0;
							}).length} {t("nodeProperties.documented")}
						</span>
					</div>
				</div>

				{/* Node list */}
				<div className="flex-1 overflow-auto thin-scrollbar py-1">
					{childNodes.map((node) => {
						const cfg = getConfig(node.type);
						const Icon = cfg.icon;
						const isSelected = selectedNodeId === node.id;
						const progress = getDocProgress(node.id);
						const isEditing = !!editingState[node.id];

						return (
							<button
								key={node.id}
								type="button"
								onClick={() => setSelectedNodeId(node.id)}
								className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-all ${
									isSelected
										? "border-l-[3px] border-primary bg-accent shadow-[inset_0_0_0_1px_rgba(37,99,235,0.1)]"
										: "border-l-[3px] border-transparent hover:bg-secondary"
								}`}
							>
								{/* Node icon with type color */}
								<div className="relative">
									<div
										className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
										style={{ backgroundColor: cfg.bg, color: cfg.color }}
									>
										<Icon className="h-3.5 w-3.5" />
									</div>
									{isNodeWorking(node.id) && (
										<div className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary">
											<div className="h-full w-full animate-ping rounded-full bg-primary" />
										</div>
									)}
								</div>

								{/* Node info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1">
										<span className={`truncate text-xs ${isSelected ? "font-semibold text-canvas-text" : "font-medium text-canvas-text-secondary"}`}>
											{node.label}
										</span>
										{isEditing && (
											<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
										)}
									</div>
									{/* Progress bar + procedure indicator */}
									<div className="mt-1 flex items-center gap-1.5">
										<div className="h-1 flex-1 rounded-full bg-canvas-border">
											<div
												className="h-1 rounded-full transition-all"
												style={{
													width: `${progress.pct}%`,
													backgroundColor: progress.pct === 0 ? "var(--palette-stone-200)" : progress.pct >= 70 ? "var(--palette-success)" : "var(--palette-warning)",
												}}
											/>
										</div>
										<span className="text-[9px] tabular-nums text-chrome-text-secondary">{progress.pct}%</span>
										{node.dbNode?.procedure && (
											<span title={t("nodeProperties.hasProcedure")}>
												<ClipboardListIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
											</span>
										)}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* ─── Right: property editor ─── */}
			<div className="flex flex-1 flex-col overflow-hidden bg-background">
				{selectedNode ? (
					<>
						{/* Node header */}
						<div className="border-b border-canvas-border px-8 py-5">
							<div className="flex items-start gap-4">
								{/* Large type icon */}
								<div
									className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
									style={{ backgroundColor: selectedConfig.bg, color: selectedConfig.color }}
								>
									<selectedConfig.icon className="h-6 w-6" />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="text-lg font-semibold text-canvas-text">{selectedNode.label}</h3>
									<div className="mt-1 flex items-center gap-3">
										<span
											className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
											style={{ color: selectedConfig.color, backgroundColor: selectedConfig.bg }}
										>
											{selectedConfig.label}
										</span>
										<span
											className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
											style={{ color: stateBadge.color, backgroundColor: `${stateBadge.color}10` }}
										>
											<stateBadge.icon className="h-3.5 w-3.5" />
											{stateBadge.label}
										</span>
										{selectedNode.dbNode?.lane && (
											<span className="text-[10px] text-chrome-text-muted">
												Lane: {selectedNode.dbNode.lane}
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Doc mode toggle */}
							<div className="mt-3 flex rounded-lg bg-canvas-surface p-0.5">
								<button
									type="button"
									onClick={() => setDocMode("description")}
									className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
										docMode === "description"
											? "bg-background text-canvas-text shadow-sm"
											: "text-chrome-text-muted hover:text-canvas-text-secondary"
									}`}
								>
									<FileTextIcon className="h-3.5 w-3.5" />
									{t("nodeProperties.tabProperties")}
								</button>
								<button
									type="button"
									onClick={() => setDocMode("sop")}
									className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
										docMode === "sop"
											? "bg-background text-canvas-text shadow-sm"
											: "text-chrome-text-muted hover:text-canvas-text-secondary"
									}`}
								>
									<ClipboardListIcon className="h-3.5 w-3.5" />
									{t("nodeProperties.tabSopComplete")}
								</button>
							</div>
						</div>

						{docMode === "sop" ? (
							<div className="flex-1 overflow-auto thin-scrollbar">
								<SopDocumentView
									nodeId={selectedNodeId!}
									nodeLabel={selectedNode.label}
									sessionId={sessionId || ""}
									procedure={selectedNode.dbNode?.procedure as any}
								/>
							</div>
						) : (
						/* Scrollable property form */
						<div className="flex-1 overflow-auto thin-scrollbar">
							<div className="mx-auto max-w-[720px] px-8 py-6">
								{PROPERTY_GROUPS.map((group) => {
									const fields = PROPERTY_FIELDS.filter((f) => f.group === group.key);
									if (fields.length === 0) return null;
									const GroupIcon = GROUP_ICONS[group.key] || FileIcon;

									return (
										<div key={group.key} className="mb-8 last:mb-0">
											<div className="mb-3 flex items-center gap-2">
												<GroupIcon className="h-4 w-4 text-chrome-text-secondary" />
												<h4 className="text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
													{group.label}
												</h4>
												<div className="h-px flex-1 bg-canvas-surface" />
											</div>

											{group.key === "recursos" ? (
												<div className="grid grid-cols-2 gap-3">
													{fields.map((field) => (
														<PropertyField
															key={field.key}
															field={field}
															value={selectedProps[field.key as keyof NodeProperties]}
															sessionId={sessionId}
															nodeId={selectedNodeId || undefined}
														onChange={(val) => saveProperties(selectedNodeId!, { [field.key]: val })}
														/>
													))}
												</div>
											) : group.key === "costos" ? (
												<div className="grid grid-cols-2 gap-3">
													{fields.map((field) => (
														<PropertyField
															key={field.key}
															field={field}
															value={selectedProps[field.key as keyof NodeProperties]}
															sessionId={sessionId}
															nodeId={selectedNodeId || undefined}
														onChange={(val) => saveProperties(selectedNodeId!, { [field.key]: val })}
														/>
													))}
												</div>
											) : (
												<div className="space-y-3">
													{fields.map((field) => (
														<PropertyField
															key={field.key}
															field={field}
															value={selectedProps[field.key as keyof NodeProperties]}
															sessionId={sessionId}
															nodeId={selectedNodeId || undefined}
														onChange={(val) => saveProperties(selectedNodeId!, { [field.key]: val })}
														/>
													))}
												</div>
											)}
										</div>
									);
								})}

								{/* Attachments */}
								<div className="mb-8">
									<div className="mb-3 flex items-center gap-2">
										<PaperclipIcon className="h-4 w-4 text-chrome-text-secondary" />
										<h4 className="text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
											{t("nodeProperties.attachments")}
										</h4>
										<div className="h-px flex-1 bg-canvas-surface" />
									</div>
									<AttachmentsZone
										attachments={(selectedProps.attachments as any[]) || []}
										onChange={(attachments) => saveProperties(selectedNodeId!, { attachments })}
									/>
								</div>
							</div>
						</div>
						)}
					</>
				) : (
					<div className="flex h-full flex-col items-center justify-center text-chrome-text-secondary">
						<SquareIcon className="mb-3 h-10 w-10 opacity-30" />
						<p className="text-sm">{t("nodeProperties.selectElement")}</p>
						<p className="mt-1 text-xs">{t("nodeProperties.selectElementSub")}</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Fire-and-forget draft generation ────────────────────────────────
const pendingDrafts = new Map<string, Promise<string | null>>();

// ─── Property field renderers ────────────────────────────────────────

function PropertyField({
	field,
	value,
	onChange,
	sessionId,
	nodeId,
}: {
	field: (typeof PROPERTY_FIELDS)[number];
	value: any;
	onChange: (val: any) => void;
	sessionId?: string;
	nodeId?: string;
}) {
	const t = useTranslations("meeting");
	const [drafting, setDrafting] = useState(false);
	const baseInputClass =
		"w-full rounded-lg border border-canvas-border bg-background px-3 py-2 text-sm text-canvas-text placeholder:text-chrome-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

	// Pick up pending draft on mount
	useEffect(() => {
		if (!nodeId) return;
		const pending = pendingDrafts.get(nodeId);
		if (pending) {
			setDrafting(true);
			pending.then((result) => { if (result) onChange(result); })
				.catch(() => {})
				.finally(() => setDrafting(false));
		}
	}, [nodeId, onChange]);

	const handleGenerateDraft = useCallback(async () => {
		if (!sessionId || !nodeId) return;
		setDrafting(true);

		const promise = fetch(`/api/sessions/${sessionId}/nodes/${nodeId}/procedure-chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Genera una descripción concisa y profesional de esta actividad en 2-3 párrafos. Solo devuelve el texto de la descripción, sin JSON.",
				history: [],
			}),
		})
			.then(async (res) => {
				if (!res.ok) return null;
				const data = await res.json();
				return (data.message as string) || null;
			})
			.finally(() => pendingDrafts.delete(nodeId!));

		pendingDrafts.set(nodeId, promise);

		try {
			const result = await promise;
			if (result) onChange(result);
		} catch { /* ignore */ }
		finally { setDrafting(false); }
	}, [sessionId, nodeId, onChange]);

	const fieldLabel = (
		<div className="group/tip relative mb-1.5 flex items-center gap-1">
			<label className="text-xs font-medium text-canvas-text-secondary">{field.label}</label>
			{(field as any).tooltip && (
				<>
					<InfoIcon className="h-3.5 w-3.5 cursor-help text-chrome-text-secondary transition-colors group-hover/tip:text-chrome-text-secondary" />
					<div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-chrome-base px-3 py-2.5 text-[11px] leading-relaxed text-chrome-text-secondary opacity-0 shadow-xl ring-1 ring-chrome-border transition-opacity group-hover/tip:opacity-100">
						{(field as any).tooltip}
					</div>
				</>
			)}
		</div>
	);

	if (field.type === "richtext") {
		return (
			<div>
				<div className="flex items-center justify-between">
					{fieldLabel}
					{field.key === "description" && nodeId && (
						<button
							type="button"
							onClick={handleGenerateDraft}
							disabled={drafting}
							className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-accent disabled:opacity-50"
						>
							{drafting ? (
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
							) : (
								<SparklesIcon className="h-3.5 w-3.5" />
							)}
							{drafting ? t("nodeProperties.generating") : t("nodeProperties.generateDraft")}
						</button>
					)}
				</div>
				<ProcedureEditor
					content={value}
					onChange={onChange}
					sessionId={sessionId || ""}
				/>
			</div>
		);
	}

	if (field.type === "number") {
		return (
			<div>
				{fieldLabel}
				<input
					type="number"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
					className={baseInputClass}
				/>
			</div>
		);
	}

	if (field.type === "select" && "options" in field) {
		return (
			<div>
				{fieldLabel}
				<select value={value || ""} onChange={(e) => onChange(e.target.value || undefined)} className={baseInputClass}>
					<option value="">—</option>
					{field.options.map((opt) => (
						<option key={opt.value} value={opt.value}>{opt.label}</option>
					))}
				</select>
			</div>
		);
	}

	if (field.type === "tags") {
		return (
			<TagField
				label={field.label}
				tooltip={(field as any).tooltip}
				values={Array.isArray(value) ? value : []}
				onChange={onChange}
				placeholder={"placeholder" in field ? (field.placeholder as string) : ""}
			/>
		);
	}

	return (
		<div>
			{fieldLabel}
			<input
				type="text"
				value={value || ""}
				onChange={(e) => onChange(e.target.value)}
				placeholder={"placeholder" in field ? (field.placeholder as string) : ""}
				className={baseInputClass}
			/>
		</div>
	);
}

function TagField({
	label, tooltip, values, onChange, placeholder,
}: {
	label: string; tooltip?: string; values: string[]; onChange: (val: string[]) => void; placeholder: string;
}) {
	const [input, setInput] = useState("");
	const addTag = () => { const t = input.trim(); if (!t || values.includes(t)) return; onChange([...values, t]); setInput(""); };
	const removeTag = (idx: number) => onChange(values.filter((_, i) => i !== idx));

	return (
		<div>
			<div className="group/tip relative mb-1.5 flex items-center gap-1">
				<label className="text-xs font-medium text-canvas-text-secondary">{label}</label>
				{tooltip && (
					<>
						<InfoIcon className="h-3.5 w-3.5 cursor-help text-chrome-text-secondary transition-colors group-hover/tip:text-chrome-text-secondary" />
						<div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-chrome-base px-3 py-2.5 text-[11px] leading-relaxed text-chrome-text-secondary opacity-0 shadow-xl ring-1 ring-chrome-border transition-opacity group-hover/tip:opacity-100">
							{tooltip}
						</div>
					</>
				)}
			</div>
			{values.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-1.5">
					{values.map((tag, idx) => (
						<span key={`${tag}-${idx}`} className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-primary">
							{tag}
							<button type="button" onClick={() => removeTag(idx)} className="rounded-sm p-0.5 hover:bg-blue-100">
								<XIcon className="h-3.5 w-3.5" />
							</button>
						</span>
					))}
				</div>
			)}
			<div className="flex gap-1.5">
				<input
					type="text" value={input} onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
					placeholder={placeholder}
					className="w-full rounded-lg border border-canvas-border bg-background px-3 py-2 text-sm text-canvas-text placeholder:text-chrome-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				<button type="button" onClick={addTag} disabled={!input.trim()}
					className="flex shrink-0 items-center rounded-lg border border-canvas-border px-3 text-chrome-text-muted transition-colors hover:bg-canvas-surface disabled:opacity-30">
					<PlusIcon className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}

function AttachmentsZone({
	attachments, onChange,
}: {
	attachments: { name: string; url: string; type: string; size: number }[];
	onChange: (a: { name: string; url: string; type: string; size: number }[]) => void;
}) {
	const handleFileSelect = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file"; input.multiple = true;
		input.accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";
		input.onchange = () => {
			const files = input.files;
			if (!files) return;
			for (const file of files) {
				const reader = new FileReader();
				reader.onload = () => {
					onChange([...attachments, { name: file.name, url: reader.result as string, type: file.type, size: file.size }]);
				};
				reader.readAsDataURL(file);
			}
		};
		input.click();
	}, [attachments, onChange]);

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div>
			{attachments.length > 0 && (
				<div className="mb-3 space-y-1.5">
					{attachments.map((att, idx) => (
						<div key={`${att.name}-${idx}`} className="flex items-center gap-3 rounded-lg border border-canvas-border bg-secondary px-3 py-2.5">
							<FileIcon className="h-4 w-4 shrink-0 text-chrome-text-muted" />
							<span className="flex-1 truncate text-sm text-canvas-text">{att.name}</span>
							<span className="shrink-0 text-xs text-chrome-text-secondary">{formatSize(att.size)}</span>
							<button type="button" onClick={() => onChange(attachments.filter((_, i) => i !== idx))}
								className="shrink-0 rounded p-1 text-chrome-text-secondary hover:bg-canvas-border hover:text-red-500">
								<Trash2Icon className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
				</div>
			)}
			<button type="button" onClick={handleFileSelect}
				className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-canvas-border px-4 py-3 text-xs font-medium text-chrome-text-muted transition-colors hover:border-primary hover:bg-secondary hover:text-primary">
				<PaperclipIcon className="h-4 w-4" />
				Adjuntar archivo
			</button>
		</div>
	);
}
