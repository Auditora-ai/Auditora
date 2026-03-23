"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DiagramNode } from "../types";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { BpmnToolbar } from "./BpmnToolbar";
import { BpmnPropertiesPanel } from "./BpmnPropertiesPanel";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { exportSVG, exportPNG } from "../lib/bpmn-export";

// bpmn-js CSS
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

// Custom styles (dark toolbar, light canvas, state markers)
import "../styles/bpmn-editor.css";

interface DiagramPanelProps {
	nodes: DiagramNode[];
	onConfirmNode: (nodeId: string) => void;
	onRejectNode: (nodeId: string) => void;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	sessionStatus?: "ACTIVE" | "ENDED";
	isFullscreen?: boolean;
	onToggleFullscreen?: () => void;
}

/**
 * DiagramPanel — Professional BPMN editor powered by bpmn-js Modeler
 *
 * ┌─────────────────────────────────────┐
 * │        BpmnToolbar (dark)           │
 * ├──────────────────────────┬──────────┤
 * │                          │ Props    │
 * │   bpmn-js Modeler        │ Panel    │
 * │   (light canvas)         │ (dark)   │
 * │                          │          │
 * │              ┌──────┐    │          │
 * │              │Minimap│    │          │
 * │              └──────┘    │          │
 * └──────────────────────────┴──────────┘
 *
 * Uses useBpmnModeler hook for all Modeler lifecycle management.
 * AI nodes merge incrementally via canvas.addShape() (non-undoable).
 */
export function DiagramPanel({
	nodes,
	onConfirmNode,
	onRejectNode,
	sessionType,
	sessionStatus = "ACTIVE",
	isFullscreen = false,
	onToggleFullscreen,
}: DiagramPanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const propertiesPanelRef = useRef<HTMLDivElement>(null);
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [propertiesOpen, setPropertiesOpen] = useState(false);

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
	} = useBpmnModeler({
		containerRef,
		onConfirmNode,
		onRejectNode,
		sessionStatus,
	});

	// Merge AI nodes when they change
	useEffect(() => {
		if (!isReady) return;
		mergeAiNodes(nodes);
	}, [nodes, isReady, mergeAiNodes]);

	// Auto-open properties panel on element selection in post-meeting mode
	useEffect(() => {
		if (sessionStatus === "ENDED" && selectedElement) {
			setPropertiesOpen(true);
		}
	}, [selectedElement, sessionStatus]);

	// Keyboard shortcuts: ? and F (only when not in text input)
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isTextInput =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable;
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
	}, [onToggleFullscreen]);

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

	const visibleNodes = nodes.filter((n) => n.state !== "rejected");

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<BpmnToolbar
				canUndo={canUndo}
				canRedo={canRedo}
				gridEnabled={gridEnabled}
				isFullscreen={isFullscreen}
				hasElements={visibleNodes.length > 0}
				onUndo={undo}
				onRedo={redo}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onZoomFit={zoomFit}
				onToggleGrid={toggleGrid}
				onExportSVG={handleExportSVG}
				onExportPNG={handleExportPNG}
				onToggleFullscreen={() => onToggleFullscreen?.()}
				onShowShortcuts={() => setShowShortcuts(true)}
			/>

			{/* Panel header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{sessionType === "DISCOVERY"
						? "Process Architecture"
						: "Live Process Diagram"}
				</span>
				{nodes.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
							{nodes.filter((n) => n.state === "confirmed").length} confirmed
						</span>
						{nodes.filter((n) => n.state === "forming").length > 0 && (
							<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
								{nodes.filter((n) => n.state === "forming").length} forming
							</span>
						)}
						{/* Properties toggle */}
						<button
							type="button"
							onClick={() => setPropertiesOpen(!propertiesOpen)}
							className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
								propertiesOpen
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-accent/50"
							}`}
						>
							Properties
						</button>
					</div>
				)}
			</div>

			{/* Canvas + Properties Panel */}
			<div className="relative flex-1">
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

				{/* Empty state */}
				{!isReady && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
					</div>
				)}

				{isReady && visibleNodes.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="text-center">
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
									? "Describe your business to begin mapping"
									: "Describe the process to begin diagramming"}
							</p>
							<p className="mt-2 text-sm text-muted-foreground/60">
								BPMN diagram will build as process steps are discussed
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
