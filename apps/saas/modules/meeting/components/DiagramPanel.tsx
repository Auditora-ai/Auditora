"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DiagramNode } from "../types";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { usePanelFlash } from "../hooks/usePanelFlash";
import { BpmnToolbar } from "./BpmnToolbar";
import { BpmnPropertiesPanel } from "./BpmnPropertiesPanel";
import { BpmnBreadcrumbs } from "./BpmnBreadcrumbs";
import { BpmnLegend } from "./BpmnLegend";
import { ProcessCompleteness } from "./ProcessCompleteness";
import { BpmnIntelligence } from "./BpmnIntelligence";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { exportSVG, exportPNG, exportXML } from "../lib/bpmn-export";
import { bpmnType, dims } from "../lib/bpmn-builder";
import { useDiagramContext } from "./MeetingView";

// bpmn-js CSS
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

// Custom styles (dark toolbar, light canvas)
import "../styles/bpmn-editor.css";

interface DiagramPanelProps {
	/** Initial BPMN XML to load (from ProcessDefinition). Empty diagram if not provided. */
	bpmnXml?: string | null;
	/** Process ID for saving and intelligence features. */
	processId?: string;
	/** Session ID for auto-save context. */
	sessionId?: string;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	sessionStatus?: "ACTIVE" | "ENDED";
	isFullscreen?: boolean;
	onToggleFullscreen?: () => void;
	isFlashing?: boolean;
	/** Called when auto-save completes, passes the saved XML. */
	onSave?: (xml: string) => void;
	/** Called when the selected element changes, passes the element label. */
	onSelectedElementChange?: (label: string | null) => void;
	/** Live AI-extracted nodes to merge into the diagram incrementally. */
	nodes?: DiagramNode[];
}

/**
 * DiagramPanel — Full BPMN editor for live sessions
 *
 * Same editing experience as /procesos: palette, drag-and-drop,
 * context-pad, properties panel. AI suggestions are handled
 * externally via AiSuggestionsPanel — this panel is purely for editing.
 *
 * Auto-saves BPMN XML every 30 seconds when changes are detected.
 */
export function DiagramPanel({
	bpmnXml,
	processId,
	sessionId,
	sessionType,
	sessionStatus = "ACTIVE",
	isFullscreen = false,
	onToggleFullscreen,
	isFlashing = false,
	onSave,
	onSelectedElementChange,
	nodes,
}: DiagramPanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const flashStyle = usePanelFlash(isFlashing, {
		color: "rgba(37, 99, 235, 0.4)",
	});
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [propertiesOpen, setPropertiesOpen] = useState(false);
	const [showLegend, setShowLegend] = useState(false);
	const [showIntelligence, setShowIntelligence] = useState(false);
	const [saving, setSaving] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const lastSavedXmlRef = useRef<string | null>(bpmnXml || null);

	// Editor mode — no onConfirmNode/onRejectNode (no AI overlays)
	const {
		isReady,
		renderError,
		mergeAiNodes,
		zoomIn,
		zoomOut,
		zoomFit,
		undo,
		redo,
		canUndo,
		canRedo,
		toggleGrid,
		gridEnabled,
		getModeler,
		selectedElement,
		navigationStack,
		navigateUp,
	} = useBpmnModeler({
		containerRef,
		initialXml: bpmnXml || undefined,
		sessionStatus,
	});

	// Merge AI-extracted nodes into the diagram when NEW nodes arrive
	// Only call mergeAiNodes when the node count or IDs change, not on every poll
	const prevNodeIdsRef = useRef<string>("");
	useEffect(() => {
		if (!nodes || nodes.length === 0 || !isReady) return;
		// Create a stable key from node IDs + states to detect real changes
		const nodeKey = nodes.map((n) => `${n.id}:${n.state}`).sort().join(",");
		if (nodeKey === prevNodeIdsRef.current) return; // No change
		prevNodeIdsRef.current = nodeKey;
		mergeAiNodes(nodes);
	}, [nodes, isReady, mergeAiNodes]);

	// Track changes for auto-save
	useEffect(() => {
		const modeler = getModeler();
		if (!modeler || !isReady) return;

		const handler = () => setHasUnsavedChanges(true);
		const eventBus = modeler.get("eventBus");
		eventBus.on("commandStack.changed", handler);
		return () => eventBus.off("commandStack.changed", handler);
	}, [isReady, getModeler]);

	// Auto-open properties panel on element selection in post-meeting mode
	useEffect(() => {
		if (sessionStatus === "ENDED" && selectedElement) {
			setPropertiesOpen(true);
		}
	}, [selectedElement, sessionStatus]);

	// Notify parent when selected element changes (for document linking + transcript highlighting)
	useEffect(() => {
		const label = selectedElement?.businessObject?.name || null;
		onSelectedElementChange?.(label);
	}, [selectedElement, onSelectedElementChange]);

	// Save to API
	const handleSave = useCallback(async () => {
		const modeler = getModeler();
		if (!modeler || !processId) return;
		setSaving(true);
		try {
			const { xml } = await modeler.saveXML({ format: true });
			await fetch(`/api/processes/${processId}/diagram`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bpmnXml: xml, sessionId }),
			});
			lastSavedXmlRef.current = xml;
			setHasUnsavedChanges(false);
			onSave?.(xml);
		} catch (err) {
			console.error("[DiagramPanel] Save error:", err);
		} finally {
			setSaving(false);
		}
	}, [processId, getModeler, onSave]);

	// Auto-save every 30 seconds when there are unsaved changes
	useEffect(() => {
		if (!processId || sessionStatus === "ENDED") return;

		// 10s interval during live sessions for faster AI sync
		const interval = setInterval(() => {
			if (hasUnsavedChanges && !saving) {
				handleSave();
			}
		}, 10_000);

		return () => clearInterval(interval);
	}, [processId, hasUnsavedChanges, saving, handleSave, sessionStatus]);

	// Keyboard shortcuts: Ctrl+S, ?, F, Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isTextInput =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable;

			// Ctrl+S — save
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
				return;
			}

			if (isTextInput) return;

			if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				setShowShortcuts(true);
			}
			if (e.key === "f" && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				onToggleFullscreen?.();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onToggleFullscreen, handleSave]);

	const handleExportSVG = useCallback(async () => {
		const modeler = getModeler();
		if (!modeler) return;
		try {
			await exportSVG(modeler);
		} catch (err) {
			console.error("[DiagramPanel] SVG export failed:", err);
		}
	}, [getModeler]);

	const handleExportPNG = useCallback(async () => {
		const modeler = getModeler();
		if (!modeler) return;
		try {
			await exportPNG(modeler);
		} catch (err) {
			console.error("[DiagramPanel] PNG export failed:", err);
		}
	}, [getModeler]);

	const handleExportXML = useCallback(async () => {
		const modeler = getModeler();
		if (!modeler) return;
		try {
			await exportXML(modeler);
		} catch (err) {
			console.error("[DiagramPanel] BPMN XML export failed:", err);
		}
	}, [getModeler]);

	/**
	 * Add a node from an AI suggestion to the BPMN canvas.
	 * Called from parent when user clicks "Add" in AiSuggestionsPanel.
	 */
	const addNodeFromSuggestion = useCallback(
		(node: DiagramNode) => {
			const modeler = getModeler();
			if (!modeler || !isReady) return;

			try {
				const elementFactory = modeler.get("elementFactory");
				const modeling = modeler.get("modeling");
				const canvas = modeler.get("canvas");
				const elementRegistry = modeler.get("elementRegistry");

				const type = bpmnType(node.type);
				const size = dims(node.type);

				// Find parent (process or participant)
				let parent = elementRegistry.get("Pool");
				if (!parent) parent = elementRegistry.get("Process_1");
				if (!parent) {
					const roots = elementRegistry.filter(
						(e: any) =>
							e.type === "bpmn:Participant" || e.type === "bpmn:Process",
					);
					parent = roots[0] || canvas.getRootElement();
				}

				// Position: center of viewport with slight random offset to avoid stacking
				const viewbox = canvas.viewbox();
				const x = viewbox.x + viewbox.width / 2 + (Math.random() - 0.5) * 200;
				const y = viewbox.y + viewbox.height / 2 + (Math.random() - 0.5) * 100;

				const shape = elementFactory.createShape({
					type,
					...size,
				});

				modeling.createShape(shape, { x, y }, parent);

				// Set label
				if (node.label) {
					modeling.updateProperties(shape, { name: node.label });
				}

				setHasUnsavedChanges(true);
			} catch (err) {
				console.error("[DiagramPanel] Failed to add suggestion:", err);
			}
		},
		[getModeler, isReady],
	);

	// Register addNodeFromSuggestion and zoomToElement via React Context
	const { registerAddNode, registerZoomToElement } = useDiagramContext();
	useEffect(() => {
		registerAddNode(addNodeFromSuggestion);
	}, [addNodeFromSuggestion, registerAddNode]);

	// Expose zoomToElement from useBpmnModeler
	const zoomToElementFn = useCallback(
		(labelOrLane: string) => {
			const modeler = getModeler();
			if (!modeler || !isReady) return;

			const elementRegistry = modeler.get("elementRegistry");
			const canvas = modeler.get("canvas");
			const needle = labelOrLane.toLowerCase();

			// Search all elements for a matching label or lane name
			const allElements = elementRegistry.getAll();
			let target: any = null;

			for (const el of allElements) {
				if (!el.businessObject) continue;
				const name = (el.businessObject.name || "").toLowerCase();
				if (name && name.includes(needle)) {
					target = el;
					break;
				}
			}

			if (!target) {
				for (const el of allElements) {
					if (!el.businessObject) continue;
					if (el.type === "bpmn:Lane" || el.type === "bpmn:Participant") {
						const name = (el.businessObject.name || "").toLowerCase();
						if (name && name.includes(needle)) {
							target = el;
							break;
						}
					}
				}
			}

			if (!target) return;

			const elementMid = {
				x: target.x + (target.width || 0) / 2,
				y: target.y + (target.height || 0) / 2,
			};
			const viewbox = canvas.viewbox();
			const newViewbox = {
				x: elementMid.x - viewbox.outer.width / 2,
				y: elementMid.y - viewbox.outer.height / 2,
				width: viewbox.outer.width,
				height: viewbox.outer.height,
			};
			canvas.viewbox(newViewbox);
			canvas.zoom(1.2);
		},
		[getModeler, isReady],
	);

	useEffect(() => {
		registerZoomToElement(zoomToElementFn);
	}, [zoomToElementFn, registerZoomToElement]);

	// Internal fullscreen state — uses fixed overlay like DiagramTab in /procesos
	const [internalFullscreen, setInternalFullscreen] = useState(false);
	const actualFullscreen = isFullscreen || internalFullscreen;

	const toggleFullscreen = useCallback(() => {
		if (onToggleFullscreen) {
			onToggleFullscreen();
		}
		setInternalFullscreen((f) => !f);
	}, [onToggleFullscreen]);

	// Re-fit canvas on fullscreen toggle
	useEffect(() => {
		if (!isReady) return;
		const timer = setTimeout(() => zoomFit(), 150);
		return () => clearTimeout(timer);
	}, [actualFullscreen, isReady, zoomFit]);

	// Escape exits fullscreen
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && internalFullscreen) {
				setInternalFullscreen(false);
				onToggleFullscreen?.();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [internalFullscreen, onToggleFullscreen]);

	const toolbar = (
		<BpmnToolbar
			canUndo={canUndo}
			canRedo={canRedo}
			gridEnabled={gridEnabled}
			isFullscreen={actualFullscreen}
			hasElements={true}
			onUndo={undo}
			onRedo={redo}
			onZoomIn={zoomIn}
			onZoomOut={zoomOut}
			onZoomFit={zoomFit}
			onToggleGrid={toggleGrid}
			onExportSVG={handleExportSVG}
			onExportPNG={handleExportPNG}
			onExportXML={handleExportXML}
			onToggleFullscreen={toggleFullscreen}
			onShowShortcuts={() => setShowShortcuts(true)}
			onToggleIntelligence={processId ? () => setShowIntelligence(!showIntelligence) : undefined}
			intelligenceActive={showIntelligence}
			onToggleLegend={() => setShowLegend(!showLegend)}
			legendActive={showLegend}
			onSave={processId ? handleSave : undefined}
			saving={saving}
		/>
	);

	const canvasContent = (
		<>
			{/* Unsaved/saving indicators */}
			{(hasUnsavedChanges || saving) && (
				<div className="flex items-center gap-2 border-b border-border px-3 py-1">
					{hasUnsavedChanges && <span className="text-[10px] text-amber-600">Sin guardar</span>}
					{saving && <span className="text-[10px] text-muted-foreground">Guardando...</span>}
				</div>
			)}

			<BpmnBreadcrumbs stack={navigationStack} onNavigate={navigateUp} />

			{/* Canvas + overlays */}
			<div
				className="relative flex-1"
				onDragOver={(e) => {
					if (e.dataTransfer.types.includes("application/prozea-node")) {
						e.preventDefault();
						e.dataTransfer.dropEffect = "copy";
					}
				}}
				onDrop={(e) => {
					const data = e.dataTransfer.getData("application/prozea-node");
					if (data) {
						e.preventDefault();
						try { addNodeFromSuggestion(JSON.parse(data)); } catch {}
					}
				}}
			>
				<div ref={containerRef} className="bpmn-editor-canvas h-full w-full" />

				{renderError && (
					<div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 shadow-sm">
						{renderError}
					</div>
				)}

				<BpmnPropertiesPanel
					modeler={getModeler()}
					selectedElement={selectedElement}
					isOpen={propertiesOpen}
					onClose={() => setPropertiesOpen(false)}
				/>

				{processId && (
					<BpmnIntelligence processId={processId} modeler={getModeler()} isReady={isReady} visible={showIntelligence} />
				)}

				{processId && sessionStatus === "ENDED" && <ProcessCompleteness processId={processId} />}
			</div>
		</>
	);

	// ── Fullscreen: fixed overlay covering entire screen (same pattern as /procesos) ──
	if (internalFullscreen) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col bg-white">
				{toolbar}
				<div className="flex flex-1 flex-col overflow-hidden">
					{canvasContent}
				</div>
				<KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
				<BpmnLegend visible={showLegend} onClose={() => setShowLegend(false)} />
			</div>
		);
	}

	// ── Normal (non-fullscreen) render ──
	return (
		<div className="bpmn-dark-chrome flex h-full flex-col" style={flashStyle}>
			{toolbar}
			<div className="flex flex-1 flex-col overflow-hidden">
				{canvasContent}

				{/* Loading state */}
				{!isReady && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
					</div>
				)}

				{/* Color Legend */}
				<BpmnLegend visible={showLegend} onClose={() => setShowLegend(false)} />
			</div>

			<KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
		</div>
	);
}
