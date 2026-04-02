"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	GripVerticalIcon,
	PlusIcon,
	Trash2Icon,
	ChevronDownIcon,
	ChevronRightIcon,
	LinkIcon,
	UnlinkIcon,
	ArrowDownIcon,
} from "lucide-react";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import type { DiagramNode } from "@repo/process-engine";
import { getNodeConfig, STATE_BADGE, NODE_TYPES } from "../lib/node-display-config";
import { bpmnType } from "@repo/process-engine";
import {
	buildFlowTree,
	reorderNode,
	insertNodeAfter,
	removeNodeFromFlow,
	addConnection,
	removeConnection,
	type FlowTreeItem,
	type ConnectionPatch,
} from "@repo/process-engine";

// ─── API helpers ─────────────────────────────────────────────────────

async function patchNode(sessionId: string, nodeId: string, data: Record<string, any>) {
	const res = await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "edit", ...data }),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

async function batchUpdate(sessionId: string, patches: ConnectionPatch[]) {
	const res = await fetch(`/api/sessions/${sessionId}/nodes/batch-update`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			updates: patches.map((p) => ({
				nodeId: p.nodeId,
				connections: p.connections,
				connectionLabels: p.connectionLabels,
			})),
		}),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

async function createNode(sessionId: string, node: { type: string; label: string; lane?: string; connections?: string[] }) {
	const res = await fetch(`/api/sessions/${sessionId}/nodes/bulk`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ nodes: [node] }),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

async function deleteNode(sessionId: string, nodeId: string) {
	const res = await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "reject" }),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

// ─── SortableTreeNode ────────────────────────────────────────────────

function SortableTreeNode({
	item,
	sessionId,
	nodes,
	isSelected,
	onSelect,
	onLabelSave,
	onTypeChange,
	onDelete,
	onAddAfter,
	onAddConnection,
	onRemoveConnection,
	collapsedGateways,
	onToggleGateway,
}: {
	item: FlowTreeItem;
	sessionId: string;
	nodes: DiagramNode[];
	isSelected: boolean;
	onSelect: (nodeId: string) => void;
	onLabelSave: (nodeId: string, label: string) => void;
	onTypeChange: (nodeId: string, type: string) => void;
	onDelete: (nodeId: string) => void;
	onAddAfter: (afterNodeId: string) => void;
	onAddConnection: (sourceId: string, targetId: string) => void;
	onRemoveConnection: (sourceId: string, targetId: string) => void;
	collapsedGateways: Set<string>;
	onToggleGateway: (gatewayId: string) => void;
}) {
	const t = useTranslations("meeting");
	const { node, depth, branchLabel, isGatewayStart } = item;
	const config = getNodeConfig(bpmnType(node.type));
	const stateBadge = STATE_BADGE[node.state] || STATE_BADGE.forming;
	const StateBadgeIcon = stateBadge.icon;
	const NodeIcon = config.icon;

	const isEvent = bpmnType(node.type).includes("Event");
	const isGateway = bpmnType(node.type).includes("Gateway");

	const [isEditing, setIsEditing] = useState(false);
	const [editLabel, setEditLabel] = useState(node.label);
	const [showTypeDropdown, setShowTypeDropdown] = useState(false);
	const [showConnectionPopover, setShowConnectionPopover] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.nodeId,
		disabled: isEvent,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		paddingLeft: `${depth * 24 + 8}px`,
	};

	const handleDoubleClick = () => {
		if (isEvent) return;
		setEditLabel(node.label);
		setIsEditing(true);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const handleLabelSubmit = () => {
		setIsEditing(false);
		const trimmed = editLabel.trim();
		if (trimmed && trimmed !== node.label) {
			onLabelSave(node.id, trimmed);
		}
	};

	const isCollapsed = isGateway && collapsedGateways.has(node.id);

	// Available targets for connection popover (nodes not already connected)
	const connectionTargets = useMemo(() => {
		if (!showConnectionPopover) return [];
		return nodes
			.filter((n) => n.state !== "rejected" && n.id !== node.id && !node.connections.includes(n.id))
			.map((n) => ({ id: n.id, label: n.label }));
	}, [showConnectionPopover, nodes, node]);

	return (
		<div ref={setNodeRef} style={style} className="relative">
			{/* Branch label */}
			{branchLabel && (
				<div className="mb-1 flex items-center gap-1 pl-6">
					<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
						{branchLabel}
					</span>
				</div>
			)}

			{/* Node row */}
			<div
				onClick={() => onSelect(node.id)}
				className={`group flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors cursor-pointer ${
					isSelected
						? "border-blue-300 bg-blue-50"
						: "border-canvas-border bg-background hover:bg-muted"
				}`}
			>
				{/* Drag handle */}
				{!isEvent && (
					<button
						type="button"
						{...attributes}
						{...listeners}
						className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
					>
						<GripVerticalIcon className="h-3.5 w-3.5" />
					</button>
				)}
				{isEvent && <div className="w-3.5" />}

				{/* Gateway collapse toggle */}
				{isGateway && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); onToggleGateway(node.id); }}
						className="text-muted-foreground hover:text-muted-foreground"
					>
						{isCollapsed
							? <ChevronRightIcon className="h-3.5 w-3.5" />
							: <ChevronDownIcon className="h-3.5 w-3.5" />}
					</button>
				)}

				{/* Type icon */}
				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); if (!isEvent) setShowTypeDropdown(!showTypeDropdown); }}
					className="relative shrink-0"
					title={config.label}
				>
					<div
						className="flex h-6 w-6 items-center justify-center rounded"
						style={{ backgroundColor: config.bg }}
					>
						<NodeIcon className="h-3.5 w-3.5" style={{ color: config.color }} />
					</div>

					{/* Type dropdown */}
					{showTypeDropdown && (
						<div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-background py-1 shadow-lg">
							{NODE_TYPES.filter((t) => t.value !== "START_EVENT" && t.value !== "END_EVENT").map((t) => {
								const TIcon = getNodeConfig(t.bpmn).icon;
								return (
									<button
										key={t.value}
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onTypeChange(node.id, t.value);
											setShowTypeDropdown(false);
										}}
										className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
									>
										<TIcon className="h-3.5 w-3.5" style={{ color: getNodeConfig(t.bpmn).color }} />
										{t.label}
									</button>
								);
							})}
						</div>
					)}
				</button>

				{/* Label */}
				<div className="min-w-0 flex-1" onDoubleClick={handleDoubleClick}>
					{isEditing ? (
						<input
							ref={inputRef}
							value={editLabel}
							onChange={(e) => setEditLabel(e.target.value)}
							onBlur={handleLabelSubmit}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleLabelSubmit();
								if (e.key === "Escape") setIsEditing(false);
							}}
							className="w-full rounded border border-blue-300 bg-background px-1.5 py-0.5 text-xs text-foreground outline-none"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span className="block truncate text-xs font-medium text-foreground">
							{node.label}
						</span>
					)}
				</div>

				{/* State badge */}
				<StateBadgeIcon
					className="h-3.5 w-3.5 shrink-0"
					style={{ color: stateBadge.color }}
					title={stateBadge.label}
				/>

				{/* Lane pill */}
				{node.lane && (
					<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
						{node.lane}
					</span>
				)}

				{/* Connection count */}
				{node.connections.length > 0 && (
					<span
						className="shrink-0 text-[9px] text-muted-foreground"
						title={`${node.connections.length} conexion(es)`}
					>
						→{node.connections.length}
					</span>
				)}

				{/* Action buttons (visible on hover) */}
				<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
					{/* Add connection */}
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); setShowConnectionPopover(!showConnectionPopover); }}
						className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-blue-500"
						title={t("treeEditor.addConnection")}
					>
						<LinkIcon className="h-3.5 w-3.5" />
					</button>

					{/* Add node after */}
					{!isEndEvent(node) && (
						<button
							type="button"
							onClick={(e) => { e.stopPropagation(); onAddAfter(node.id); }}
							className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-green-500"
							title={t("treeEditor.insertAfter")}
						>
							<PlusIcon className="h-3.5 w-3.5" />
						</button>
					)}

					{/* Delete node */}
					{!isEvent && (
						<button
							type="button"
							onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
							className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-red-500"
							title={t("treeEditor.deleteNode")}
						>
							<Trash2Icon className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			</div>

			{/* Connection popover */}
			{showConnectionPopover && (
				<div className="absolute right-2 top-full z-50 mt-1 w-56 rounded-md border border-border bg-background py-1 shadow-lg">
					<div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
						{t("treeEditor.connectTo")}
					</div>
					{/* Existing connections (removable) */}
					{node.connections.map((targetId, i) => {
						const targetNode = nodes.find((n) => n.id === targetId);
						return (
							<button
								key={targetId}
								type="button"
								onClick={() => { onRemoveConnection(node.id, targetId); setShowConnectionPopover(false); }}
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
							>
								<UnlinkIcon className="h-3.5 w-3.5" />
								<span className="truncate">{targetNode?.label || targetId}</span>
								{node.connectionLabels?.[i] && (
									<span className="ml-auto text-[9px] text-muted-foreground">{node.connectionLabels[i]}</span>
								)}
							</button>
						);
					})}
					{node.connections.length > 0 && connectionTargets.length > 0 && (
						<div className="mx-2 my-1 border-t border-border" />
					)}
					{/* Available targets */}
					<div className="max-h-40 overflow-y-auto">
						{connectionTargets.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => { onAddConnection(node.id, t.id); setShowConnectionPopover(false); }}
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
							>
								<LinkIcon className="h-3.5 w-3.5 text-blue-400" />
								<span className="truncate">{t.label}</span>
							</button>
						))}
					</div>
					{connectionTargets.length === 0 && node.connections.length === 0 && (
						<div className="px-3 py-2 text-xs text-muted-foreground">{t("treeEditor.noAvailableNodes")}</div>
					)}
				</div>
			)}

			{/* Connection line to next */}
			{!isDragging && node.connections.length > 0 && !isGateway && (
				<div className="flex justify-center py-0.5" style={{ paddingLeft: `${depth * 24 + 8}px` }}>
					<ArrowDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
				</div>
			)}
		</div>
	);
}

function isEndEvent(node: DiagramNode): boolean {
	return bpmnType(node.type).includes("EndEvent");
}

// ─── ProcessTreeEditor ───────────────────────────────────────────────

export function ProcessTreeEditor() {
	const t = useTranslations("meeting");
	const { nodes, sessionId, modelerApi, selectedNodeId, setSelectedNodeId } = useLiveSessionContext();
	const [collapsedGateways, setCollapsedGateways] = useState<Set<string>>(new Set());
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	const tree = useMemo(() => {
		const flowTree = buildFlowTree(nodes);
		// Filter out children of collapsed gateways
		if (collapsedGateways.size === 0) return flowTree;
		return flowTree.filter((item) => {
			if (!item.gatewayId) return true;
			return !collapsedGateways.has(item.gatewayId);
		});
	}, [nodes, collapsedGateways]);

	const sortableIds = useMemo(() => tree.map((item) => item.nodeId), [tree]);

	// ─── Handlers ────────────────────────────────────────────────

	const applyPatches = useCallback(async (patches: ConnectionPatch[]) => {
		if (patches.length === 0) return;
		try {
			await batchUpdate(sessionId, patches);
			// Trigger diagram rebuild if modeler is ready
			if (modelerApi?.isReady && modelerApi.rebuildFromNodes) {
				setTimeout(() => modelerApi.rebuildFromNodes(), 500);
			}
		} catch {
			toast.error(t("toast.connectionError2"));
		}
	}, [sessionId, modelerApi]);

	const handleDragEnd = useCallback(async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const fromIndex = tree.findIndex((item) => item.nodeId === active.id);
		const toIndex = tree.findIndex((item) => item.nodeId === over.id);
		if (fromIndex < 0 || toIndex < 0) return;

		const patches = reorderNode(nodes, tree, fromIndex, toIndex);
		await applyPatches(patches);
	}, [tree, nodes, applyPatches]);

	const handleLabelSave = useCallback(async (nodeId: string, label: string) => {
		try {
			await patchNode(sessionId, nodeId, { label });
			if (modelerApi?.isReady) {
				// Update label on canvas without full rebuild
				try {
					const elementRegistry = modelerApi.modeler?.get("elementRegistry");
					const modeling = modelerApi.modeler?.get("modeling");
					const element = elementRegistry?.get(nodeId);
					if (element && modeling) {
						modeling.updateProperties(element, { name: label });
					}
				} catch { /* modeler might not have this element */ }
			}
		} catch {
			toast.error(t("toast.labelSaveError"));
		}
	}, [sessionId, modelerApi]);

	const handleTypeChange = useCallback(async (nodeId: string, type: string) => {
		try {
			await patchNode(sessionId, nodeId, { type });
			if (modelerApi?.isReady && modelerApi.rebuildFromNodes) {
				setTimeout(() => modelerApi.rebuildFromNodes(), 500);
			}
		} catch {
			toast.error(t("toast.typeChangeError"));
		}
	}, [sessionId, modelerApi]);

	const handleDelete = useCallback(async (nodeId: string) => {
		if (confirmDelete !== nodeId) {
			setConfirmDelete(nodeId);
			return;
		}
		setConfirmDelete(null);

		try {
			// First, reconnect flow
			const patches = removeNodeFromFlow(nodes, nodeId);
			if (patches.length > 0) {
				await batchUpdate(sessionId, patches.filter((p) => p.nodeId !== nodeId));
			}
			// Then reject the node
			await deleteNode(sessionId, nodeId);
			if (selectedNodeId === nodeId) setSelectedNodeId(null);
			if (modelerApi?.isReady && modelerApi.rebuildFromNodes) {
				setTimeout(() => modelerApi.rebuildFromNodes(), 500);
			}
			toast.success(t("toast.nodeDeleted"));
		} catch {
			toast.error(t("toast.deleteError"));
		}
	}, [confirmDelete, nodes, sessionId, selectedNodeId, setSelectedNodeId, modelerApi]);

	const handleAddAfter = useCallback(async (afterNodeId: string) => {
		try {
			// Create a new task node
			const res = await createNode(sessionId, {
				type: "task",
				label: t("treeEditor.newTask"),
			});

			// The bulk API returns { created: count } — we need the new node ID
			// Re-fetch will happen via polling, but we can trigger rebuild
			if (modelerApi?.isReady && modelerApi.rebuildFromNodes) {
				setTimeout(() => modelerApi.rebuildFromNodes(), 1000);
			}
			toast.success(t("toast.nodeCreated"));
		} catch {
			toast.error(t("toast.createError"));
		}
	}, [sessionId, modelerApi]);

	const handleAddConnection = useCallback(async (sourceId: string, targetId: string) => {
		const patches = addConnection(nodes, sourceId, targetId);
		await applyPatches(patches);
	}, [nodes, applyPatches]);

	const handleRemoveConnection = useCallback(async (sourceId: string, targetId: string) => {
		const patches = removeConnection(nodes, sourceId, targetId);
		await applyPatches(patches);
	}, [nodes, applyPatches]);

	const handleToggleGateway = useCallback((gatewayId: string) => {
		setCollapsedGateways((prev) => {
			const next = new Set(prev);
			if (next.has(gatewayId)) next.delete(gatewayId);
			else next.add(gatewayId);
			return next;
		});
	}, []);

	// ─── Render ──────────────────────────────────────────────────

	if (nodes.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
				{t("treeEditor.noNodes")}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-secondary">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<div className="text-xs font-semibold text-muted-foreground">
					{t("treeEditor.header")}
				</div>
				<div className="flex items-center gap-2 text-[10px] text-muted-foreground">
					<span>{t("treeEditor.nodeCount", { count: nodes.filter((n) => n.state !== "rejected").length })}</span>
					<span className="text-muted-foreground">|</span>
					<span>{t("treeEditor.doubleClickHint")}</span>
				</div>
			</div>

			{/* Tree list */}
			<div className="flex-1 overflow-y-auto p-3">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
						<div className="space-y-0.5">
							{tree.map((item) => (
								<SortableTreeNode
									key={item.nodeId}
									item={item}
									sessionId={sessionId}
									nodes={nodes}
									isSelected={selectedNodeId === item.nodeId}
									onSelect={setSelectedNodeId}
									onLabelSave={handleLabelSave}
									onTypeChange={handleTypeChange}
									onDelete={handleDelete}
									onAddAfter={handleAddAfter}
									onAddConnection={handleAddConnection}
									onRemoveConnection={handleRemoveConnection}
									collapsedGateways={collapsedGateways}
									onToggleGateway={handleToggleGateway}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			</div>

			{/* Delete confirmation banner */}
			{confirmDelete && (
				<div className="flex items-center justify-between border-t border-red-200 bg-red-50 px-4 py-2">
					<span className="text-xs text-red-700">
						{t("treeEditor.confirmDelete", { label: nodes.find((n) => n.id === confirmDelete)?.label || "" })}
					</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setConfirmDelete(null)}
							className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
						>
							{t("treeEditor.cancel")}
						</button>
						<button
							type="button"
							onClick={() => handleDelete(confirmDelete)}
							className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
						>
							{t("treeEditor.delete")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
