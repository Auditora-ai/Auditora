"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BpmnToolbar } from "./BpmnToolbar";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { buildBpmnXml } from "../lib/bpmn-builder";
import { exportSVG, exportPNG } from "../lib/bpmn-export";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-editor.css";

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

interface DiagramEditorProps {
	sessionId: string;
	nodes: DiagramNode[];
	bpmnXml?: string | null;
	onClose: () => void;
	onSave: (xml: string) => void;
}

/**
 * DiagramEditor — Full-screen BPMN editor for post-session manual editing.
 * Uses bpmn-js Modeler (same as live view) with full palette and editing tools.
 */
export function DiagramEditor({
	sessionId,
	nodes,
	bpmnXml,
	onClose,
	onSave,
}: DiagramEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [gridEnabled, setGridEnabled] = useState(false);
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [saving, setSaving] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	// Initialize Modeler
	useEffect(() => {
		let destroyed = false;
		let modeler: any;

		async function init() {
			if (!containerRef.current) return;

			try {
				const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;
				if (destroyed) return;

				const additionalModules: any[] = [];
				try {
					const minimapModule = (await import("diagram-js-minimap"))
						.default;
					additionalModules.push(minimapModule);
				} catch {
					// minimap not available
				}

				modeler = new BpmnModeler({
					container: containerRef.current,
					additionalModules,
				});
				modelerRef.current = modeler;

				// Import existing diagram
				const xml =
					bpmnXml ||
					(nodes.length > 0 ? buildBpmnXml(nodes) : emptyBpmnXml());
				try {
					await modeler.importXML(xml);
					if (destroyed) {
						modeler.destroy();
						return;
					}
					modeler.get("canvas").zoom("fit-viewport", "auto");
				} catch (err) {
					console.error("[DiagramEditor] Import failed:", err);
				}

				// Track undo/redo state
				const commandStack = modeler.get("commandStack");
				const eventBus = modeler.get("eventBus");
				eventBus.on("commandStack.changed", () => {
					setCanUndo(commandStack.canUndo());
					setCanRedo(commandStack.canRedo());
				});

				setIsReady(true);
			} catch (err) {
				console.error("[DiagramEditor] Initialization failed:", err);
				setInitError("No se pudo cargar el editor de diagramas.");
			}
		}

		init();
		return () => {
			destroyed = true;
			modeler?.destroy();
			modelerRef.current = null;
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSave = useCallback(async () => {
		const modeler = modelerRef.current;
		if (!modeler) return;

		setSaving(true);
		try {
			const { xml } = await modeler.saveXML({ format: true });
			onSave(xml);
		} catch (err) {
			console.error("[DiagramEditor] Save failed:", err);
		} finally {
			setSaving(false);
		}
	}, [onSave]);

	// Keyboard: Escape to close, Ctrl+S to save
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose, handleSave]);

	const zoomIn = useCallback(() => {
		const canvas = modelerRef.current?.get("canvas");
		if (canvas) canvas.zoom(canvas.zoom() * 1.2);
	}, []);
	const zoomOut = useCallback(() => {
		const canvas = modelerRef.current?.get("canvas");
		if (canvas) canvas.zoom(canvas.zoom() / 1.2);
	}, []);
	const zoomFit = useCallback(() => {
		const canvas = modelerRef.current?.get("canvas");
		if (canvas) canvas.zoom("fit-viewport", "auto");
	}, []);
	const undo = useCallback(() => {
		modelerRef.current?.get("commandStack")?.undo();
	}, []);
	const redo = useCallback(() => {
		modelerRef.current?.get("commandStack")?.redo();
	}, []);
	const toggleGrid = useCallback(() => {
		setGridEnabled((prev) => !prev);
		try {
			modelerRef.current?.get("gridSnapping")?.toggle();
		} catch {
			// not available
		}
	}, []);

	const handleExportSVG = useCallback(async () => {
		const modeler = modelerRef.current;
		if (modeler) await exportSVG(modeler).catch(console.error);
	}, []);
	const handleExportPNG = useCallback(async () => {
		const modeler = modelerRef.current;
		if (modeler) await exportPNG(modeler).catch(console.error);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
				<h2 className="text-sm font-semibold text-foreground">
					Edit Diagram
				</h2>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>

			{/* Toolbar */}
			<BpmnToolbar
				canUndo={canUndo}
				canRedo={canRedo}
				gridEnabled={gridEnabled}
				isFullscreen={true}
				hasElements={isReady}
				onUndo={undo}
				onRedo={redo}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onZoomFit={zoomFit}
				onToggleGrid={toggleGrid}
				onExportSVG={handleExportSVG}
				onExportPNG={handleExportPNG}
				onToggleFullscreen={onClose}
				onShowShortcuts={() => setShowShortcuts(true)}
			/>

			{/* Canvas — always white per dual-temperature UI */}
			<div className="relative flex-1 bg-white">
				<div
					ref={containerRef}
					className="bpmn-editor-canvas absolute inset-0"
				/>
				{!isReady && !initError && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
					</div>
				)}
				{initError && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="text-center">
							<p className="text-sm font-medium text-red-600">{initError}</p>
							<button
								type="button"
								onClick={onClose}
								className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
							>
								Cerrar
							</button>
						</div>
					</div>
				)}
			</div>

			<KeyboardShortcutsModal
				isOpen={showShortcuts}
				onClose={() => setShowShortcuts(false)}
			/>
		</div>
	);
}

function emptyBpmnXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
