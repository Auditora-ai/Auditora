"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	ChevronRightIcon,
	CircleDotIcon,
	SquareIcon,
	DiamondIcon,
	BoxIcon,
	PlusIcon,
	XIcon,
	PaperclipIcon,
	FileIcon,
	Trash2Icon,
	CheckCircle2Icon,
	ClockIcon,
	AlertCircleIcon,
	UserIcon,
	TimerIcon,
	CpuIcon,
	ArrowRightLeftIcon,
	DollarSignIcon,
} from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import type { DiagramNode, NodeProperties } from "../types";
import { PROPERTY_FIELDS, PROPERTY_GROUPS } from "../lib/node-properties-schema";
import { ProcedureEditor } from "./ProcedureEditor";

interface NodePropertiesViewProps {
	tabId: string;
	elementId: string;
	label: string;
}

// ─── Node type config ─────────────────────────────────────────────
const NODE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
	"bpmn:StartEvent": { icon: CircleDotIcon, color: "#16A34A", bg: "#F0FDF4", label: "Inicio" },
	"bpmn:EndEvent": { icon: CircleDotIcon, color: "#DC2626", bg: "#FEF2F2", label: "Fin" },
	"bpmn:Task": { icon: SquareIcon, color: "#3B82F6", bg: "#EFF6FF", label: "Tarea" },
	"bpmn:UserTask": { icon: UserIcon, color: "#3B82F6", bg: "#EFF6FF", label: "Tarea Usuario" },
	"bpmn:ServiceTask": { icon: CpuIcon, color: "#3B82F6", bg: "#EFF6FF", label: "Tarea Servicio" },
	"bpmn:ManualTask": { icon: SquareIcon, color: "#3B82F6", bg: "#EFF6FF", label: "Tarea Manual" },
	"bpmn:ExclusiveGateway": { icon: DiamondIcon, color: "#EAB308", bg: "#FEF9C3", label: "Gateway" },
	"bpmn:ParallelGateway": { icon: DiamondIcon, color: "#7C3AED", bg: "#F5F3FF", label: "Paralelo" },
	"bpmn:SubProcess": { icon: BoxIcon, color: "#7C3AED", bg: "#F5F3FF", label: "Subproceso" },
};

const getConfig = (type: string) => NODE_CONFIG[type] || { icon: SquareIcon, color: "#64748B", bg: "#F8FAFC", label: "Elemento" };

const STATE_BADGE: Record<string, { icon: React.ElementType; color: string; label: string }> = {
	confirmed: { icon: CheckCircle2Icon, color: "#16A34A", label: "Confirmado" },
	forming: { icon: ClockIcon, color: "#EAB308", label: "En formacion" },
	rejected: { icon: AlertCircleIcon, color: "#DC2626", label: "Rechazado" },
};

// ─── Group icons ──────────────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ElementType> = {
	general: FileIcon,
	recursos: TimerIcon,
	entradas_salidas: ArrowRightLeftIcon,
	costos: DollarSignIcon,
};

export function NodePropertiesView({ tabId, elementId, label }: NodePropertiesViewProps) {
	const { nodes, sessionId, modelerApi } = useLiveSessionContext();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
					toast.error("Error al guardar propiedades");
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
		<div className="flex h-full" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
			{/* ─── Left sidebar: node list ─── */}
			<div className="flex w-[240px] shrink-0 flex-col border-r border-[#E2E8F0] bg-[#FAFBFC]">
				{/* Process header */}
				<div className="border-b border-[#E2E8F0] px-4 py-3">
					<h2 className="text-sm font-semibold text-[#0F172A]">{label}</h2>
					<div className="mt-1 flex items-center gap-2">
						<span className="text-[10px] text-[#94A3B8]">
							{childNodes.length} elemento{childNodes.length !== 1 ? "s" : ""}
						</span>
						<span className="text-[10px] text-[#94A3B8]">·</span>
						<span className="text-[10px] text-[#94A3B8]">
							{childNodes.filter((n) => {
								const p = getDocProgress(n.id);
								return p.filled > 0;
							}).length} documentados
						</span>
					</div>
				</div>

				{/* Node list */}
				<div className="flex-1 overflow-auto py-1">
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
										? "border-l-2 border-[#2563EB] bg-white"
										: "border-l-2 border-transparent hover:bg-white/60"
								}`}
							>
								{/* Node icon with type color */}
								<div
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
									style={{ backgroundColor: cfg.bg, color: cfg.color }}
								>
									<Icon className="h-3.5 w-3.5" />
								</div>

								{/* Node info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1">
										<span className={`truncate text-xs ${isSelected ? "font-semibold text-[#0F172A]" : "font-medium text-[#334155]"}`}>
											{node.label}
										</span>
										{isEditing && (
											<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
										)}
									</div>
									{/* Progress bar */}
									<div className="mt-1 flex items-center gap-1.5">
										<div className="h-1 flex-1 rounded-full bg-[#E2E8F0]">
											<div
												className="h-1 rounded-full transition-all"
												style={{
													width: `${progress.pct}%`,
													backgroundColor: progress.pct === 0 ? "#E2E8F0" : progress.pct >= 70 ? "#16A34A" : "#EAB308",
												}}
											/>
										</div>
										<span className="text-[9px] tabular-nums text-[#94A3B8]">{progress.pct}%</span>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* ─── Right: property editor ─── */}
			<div className="flex flex-1 flex-col overflow-hidden bg-white">
				{selectedNode ? (
					<>
						{/* Node header */}
						<div className="border-b border-[#E2E8F0] px-8 py-5">
							<div className="flex items-start gap-4">
								{/* Large type icon */}
								<div
									className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
									style={{ backgroundColor: selectedConfig.bg, color: selectedConfig.color }}
								>
									<selectedConfig.icon className="h-6 w-6" />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="text-lg font-semibold text-[#0F172A]">{selectedNode.label}</h3>
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
											<stateBadge.icon className="h-3 w-3" />
											{stateBadge.label}
										</span>
										{selectedNode.dbNode?.lane && (
											<span className="text-[10px] text-[#64748B]">
												Lane: {selectedNode.dbNode.lane}
											</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Scrollable property form */}
						<div className="flex-1 overflow-auto">
							<div className="mx-auto max-w-[720px] px-8 py-6">
								{PROPERTY_GROUPS.map((group) => {
									const fields = PROPERTY_FIELDS.filter((f) => f.group === group.key);
									if (fields.length === 0) return null;
									const GroupIcon = GROUP_ICONS[group.key] || FileIcon;

									return (
										<div key={group.key} className="mb-8 last:mb-0">
											<div className="mb-3 flex items-center gap-2">
												<GroupIcon className="h-4 w-4 text-[#94A3B8]" />
												<h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
													{group.label}
												</h4>
												<div className="h-px flex-1 bg-[#F1F5F9]" />
											</div>

											{group.key === "recursos" ? (
												<div className="grid grid-cols-2 gap-3">
													{fields.map((field) => (
														<PropertyField
															key={field.key}
															field={field}
															value={selectedProps[field.key as keyof NodeProperties]}
															sessionId={sessionId}
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
										<PaperclipIcon className="h-4 w-4 text-[#94A3B8]" />
										<h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
											Adjuntos
										</h4>
										<div className="h-px flex-1 bg-[#F1F5F9]" />
									</div>
									<AttachmentsZone
										attachments={(selectedProps.attachments as any[]) || []}
										onChange={(attachments) => saveProperties(selectedNodeId!, { attachments })}
									/>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="flex h-full flex-col items-center justify-center text-[#94A3B8]">
						<SquareIcon className="mb-3 h-10 w-10 opacity-30" />
						<p className="text-sm">Selecciona un elemento del proceso</p>
						<p className="mt-1 text-xs">para documentar sus propiedades</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Property field renderers ────────────────────────────────────────

function PropertyField({
	field,
	value,
	onChange,
	sessionId,
}: {
	field: (typeof PROPERTY_FIELDS)[number];
	value: any;
	onChange: (val: any) => void;
	sessionId?: string;
}) {
	const baseInputClass =
		"w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-colors";

	if (field.type === "richtext") {
		return (
			<div>
				<label className="mb-1.5 block text-xs font-medium text-[#334155]">{field.label}</label>
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
				<label className="mb-1.5 block text-xs font-medium text-[#334155]">{field.label}</label>
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
				<label className="mb-1.5 block text-xs font-medium text-[#334155]">{field.label}</label>
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
				values={(value as string[]) || []}
				onChange={onChange}
				placeholder={"placeholder" in field ? (field.placeholder as string) : ""}
			/>
		);
	}

	return (
		<div>
			<label className="mb-1.5 block text-xs font-medium text-[#334155]">{field.label}</label>
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
	label, values, onChange, placeholder,
}: {
	label: string; values: string[]; onChange: (val: string[]) => void; placeholder: string;
}) {
	const [input, setInput] = useState("");
	const addTag = () => { const t = input.trim(); if (!t || values.includes(t)) return; onChange([...values, t]); setInput(""); };
	const removeTag = (idx: number) => onChange(values.filter((_, i) => i !== idx));

	return (
		<div>
			<label className="mb-1.5 block text-xs font-medium text-[#334155]">{label}</label>
			{values.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-1.5">
					{values.map((tag, idx) => (
						<span key={`${tag}-${idx}`} className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-[#2563EB]">
							{tag}
							<button type="button" onClick={() => removeTag(idx)} className="rounded-sm p-0.5 hover:bg-[#DBEAFE]">
								<XIcon className="h-2.5 w-2.5" />
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
					className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
				/>
				<button type="button" onClick={addTag} disabled={!input.trim()}
					className="flex shrink-0 items-center rounded-lg border border-[#E2E8F0] px-3 text-[#64748B] transition-colors hover:bg-[#F1F5F9] disabled:opacity-30">
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
						<div key={`${att.name}-${idx}`} className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
							<FileIcon className="h-4 w-4 shrink-0 text-[#64748B]" />
							<span className="flex-1 truncate text-sm text-[#0F172A]">{att.name}</span>
							<span className="shrink-0 text-xs text-[#94A3B8]">{formatSize(att.size)}</span>
							<button type="button" onClick={() => onChange(attachments.filter((_, i) => i !== idx))}
								className="shrink-0 rounded p-1 text-[#94A3B8] hover:bg-[#E2E8F0] hover:text-red-500">
								<Trash2Icon className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
				</div>
			)}
			<button type="button" onClick={handleFileSelect}
				className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#CBD5E1] px-4 py-3 text-xs font-medium text-[#64748B] transition-colors hover:border-[#3B82F6] hover:bg-[#F8FAFC] hover:text-[#3B82F6]">
				<PaperclipIcon className="h-4 w-4" />
				Adjuntar archivo (PDF, Word, PPT)
			</button>
		</div>
	);
}
