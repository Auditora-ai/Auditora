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

	return (
		<div className="bpmn-dark-chrome flex h-full flex-col" style={flashStyle}>
			{/* Toolbar */}
			<BpmnToolbar
				canUndo={canUndo}
				canRedo={canRedo}
				gridEnabled={gridEnabled}
				isFullscreen={isFullscreen}
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
				onToggleFullscreen={() => onToggleFullscreen?.()}
				onShowShortcuts={() => setShowShortcuts(true)}
				onToggleIntelligence={processId ? () => setShowIntelligence(!showIntelligence) : undefined}
				intelligenceActive={showIntelligence}
				onToggleLegend={() => setShowLegend(!showLegend)}
				legendActive={showLegend}
				onSave={processId ? handleSave : undefined}
				saving={saving}
			/>

			{/* Unsaved/saving indicators (inline in toolbar area) */}
			{(hasUnsavedChanges || saving) && (
				<div className="flex items-center gap-2 border-b border-border px-3 py-1">
					{hasUnsavedChanges && (
						<span className="text-[10px] text-amber-600">Sin guardar</span>
					)}
					{saving && (
						<span className="text-[10px] text-muted-foreground">Guardando...</span>
					)}
				</div>
			)}

			{/* Subprocess breadcrumbs */}
			<BpmnBreadcrumbs
				stack={navigationStack}
				onNavigate={navigateUp}
			/>

			{/* Canvas + Properties Panel + Overlays */}
			<div
				className="relative flex-1"
				onDragOver={(e) => {
					// Accept drops from suggestion cards
					if (e.dataTransfer.types.includes("application/prozea-node")) {
						e.preventDefault();
						e.dataTransfer.dropEffect = "copy";
					}
				}}
				onDrop={(e) => {
					const data = e.dataTransfer.getData("application/prozea-node");
					if (data) {
						e.preventDefault();
						try {
							const node = JSON.parse(data);
							addNodeFromSuggestion(node);
						} catch {
							// Invalid data
						}
					}
				}}
			>
				<div ref={containerRef} className="bpmn-editor-canvas h-full w-full" />

				{/* Render error banner */}
				{renderError && (
					<div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 shadow-sm">
						{renderError}
					</div>
				)}

				{/* Properties Panel (slide-in drawer) */}
				<BpmnPropertiesPanel
					modeler={getModeler()}
					selectedElement={selectedElement}
					isOpen={propertiesOpen}
					onClose={() => setPropertiesOpen(false)}
				/>

				{/* AI Intelligence Overlays */}
				{processId && (
					<BpmnIntelligence
						processId={processId}
						modeler={getModeler()}
						isReady={isReady}
						visible={showIntelligence}
					/>
				)}

				{/* Process Completeness Widget */}
				{processId && sessionStatus === "ENDED" && (
					<ProcessCompleteness processId={processId} />
				)}

				{/* Color Legend */}
				<BpmnLegend
					visible={showLegend}
					onClose={() => setShowLegend(false)}
				/>

				{/* Loading state */}
				{!isReady && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
					</div>
				)}

				{/* Empty state — shown when editor is ready but no XML was loaded */}
				{isReady && !bpmnXml && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="text-center opacity-40">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
								<svg
									className="h-8 w-8 text-primary/30"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
									/>
								</svg>
							</div>
							<p className="text-lg text-muted-foreground">
								{sessionType === "DISCOVERY"
									? "Usa la paleta para comenzar a diagramar"
									: "Arrastra elementos de la paleta al canvas"}
							</p>
							<p className="mt-2 text-sm text-muted-foreground/60">
								Las sugerencias de la IA apareceran en el panel lateral
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Keyboard Shortcuts Modal */}
			<KeyboardShortcutsModal
				isOpen={showShortcuts}
				onClose={() => setShowShortcuts(false)}
			/>
		</div>
	);
}
