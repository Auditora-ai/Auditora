"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DiagramNode } from "../types";
import { buildBpmnXml } from "../lib/bpmn-builder";

/**
 * useBpmnModeler — Custom hook for bpmn-js Modeler lifecycle
 *
 * Handles:
 * - Modeler initialization and destruction (SSR-safe via dynamic import)
 * - AI node rendering via importXML() with buildBpmnXml() (proven approach)
 * - State-based overlays (confirm/reject for forming nodes)
 * - CSS markers for state-based coloring
 * - Full editing tools (palette, context-pad, undo/redo) via Modeler
 */

interface UseBpmnModelerOptions {
	containerRef: React.RefObject<HTMLDivElement | null>;
	onConfirmNode: (nodeId: string) => void;
	onRejectNode: (nodeId: string) => void;
	sessionStatus: "ACTIVE" | "ENDED";
}

interface ModelerAPI {
	modeler: any;
	isReady: boolean;
	renderError: string | null;
	mergeAiNodes: (nodes: DiagramNode[]) => void;
	zoomIn: () => void;
	zoomOut: () => void;
	zoomFit: () => void;
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	toggleGrid: () => void;
	gridEnabled: boolean;
	getModeler: () => any;
	selectedElement: any;
}

export function useBpmnModeler({
	containerRef,
	onConfirmNode,
	onRejectNode,
	sessionStatus,
}: UseBpmnModelerOptions): ModelerAPI {
	const modelerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [renderError, setRenderError] = useState<string | null>(null);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [gridEnabled, setGridEnabled] = useState(false);
	const [selectedElement, setSelectedElement] = useState<any>(null);
	const lastXmlRef = useRef<string>("");
	const importingRef = useRef(false);

	// Initialize Modeler
	useEffect(() => {
		let modeler: any;
		let destroyed = false;

		async function init() {
			if (!containerRef.current) return;

			const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;

			if (destroyed) return;

			const additionalModules: any[] = [];

			// Import minimap module
			try {
				const minimapModule = (await import("diagram-js-minimap")).default;
				additionalModules.push(minimapModule);
			} catch {
				console.warn("[useBpmnModeler] Minimap module not available");
			}

			modeler = new BpmnModeler({
				container: containerRef.current,
				additionalModules,
			});

			modelerRef.current = modeler;

			// Import empty diagram to initialize
			try {
				await modeler.importXML(emptyBpmnXml());
				const canvas = modeler.get("canvas");
				canvas.zoom("fit-viewport", "auto");
			} catch (err) {
				console.error("[useBpmnModeler] Failed to initialize:", err);
				return;
			}

			// Listen for command stack changes (undo/redo state)
			const commandStack = modeler.get("commandStack");
			const eventBus = modeler.get("eventBus");
			eventBus.on("commandStack.changed", () => {
				setCanUndo(commandStack.canUndo());
				setCanRedo(commandStack.canRedo());
			});
			eventBus.on("selection.changed", (e: any) => {
				const selected = e.newSelection?.[0] || null;
				setSelectedElement(selected);
			});

			setIsReady(true);
		}

		init();

		return () => {
			destroyed = true;
			modeler?.destroy();
			modelerRef.current = null;
			setIsReady(false);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Import AI-generated nodes into the Modeler via importXML.
	 *
	 * Uses buildBpmnXml() to generate valid BPMN 2.0 XML, then imports it.
	 * After import, applies state-based overlays (confirm/reject for forming nodes)
	 * and CSS markers for coloring.
	 */
	const mergeAiNodes = useCallback(
		async (nodes: DiagramNode[]) => {
			const modeler = modelerRef.current;
			if (!modeler || !isReady) return;
			if (importingRef.current) return; // Prevent concurrent imports

			const visibleNodes = nodes.filter((n) => n.state !== "rejected");
			const xml = buildBpmnXml(visibleNodes);

			// Skip if XML hasn't changed
			if (xml === lastXmlRef.current) return;

			importingRef.current = true;
			try {
				await modeler.importXML(xml);
				lastXmlRef.current = xml; // Only cache after successful import

				// Fit diagram to viewport
				const canvas = modeler.get("canvas");
				canvas.zoom("fit-viewport", "auto");

				setRenderError(null);

				// Apply state-based styling and overlays
				const elementRegistry = modeler.get("elementRegistry");
				const overlays = modeler.get("overlays");

				overlays.clear();

				for (const node of nodes) {
					const element = elementRegistry.get(node.id);
					if (!element) continue;

					// Apply CSS state markers
					try {
						canvas.addMarker(node.id, `state-${node.state}`);
					} catch {
						// Element may not support markers
					}

					// Apply type-based coloring to the SVG element
					const gfx = elementRegistry.getGraphics(node.id);
					if (gfx) {
						applyTypeColors(gfx, node, element);
					}

					// Add confirm/reject overlay for forming nodes
					if (node.state === "forming") {
						addFormingOverlay(overlays, node, onConfirmNode, onRejectNode);
					}
				}
			} catch (err) {
				console.error("[useBpmnModeler] Failed to render BPMN:", err);
				setRenderError(
					`Diagram render failed: ${err instanceof Error ? err.message : "unknown error"}`,
				);
				// Don't cache failed XML — next poll will retry
			} finally {
				importingRef.current = false;
			}
		},
		[isReady, onConfirmNode, onRejectNode],
	);

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
			const gridSnapping = modelerRef.current?.get("gridSnapping");
			if (gridSnapping) {
				gridSnapping.toggle();
			}
		} catch {
			// Grid snapping may not be available
		}
	}, []);

	const getModeler = useCallback(() => modelerRef.current, []);

	return {
		modeler: modelerRef.current,
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
	};
}

// ─── Styling helpers ────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { stroke: string; fill: string }> = {
	"bpmn:Task": { stroke: "#2563EB", fill: "#EFF6FF" },
	task: { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:ExclusiveGateway": { stroke: "#D97706", fill: "#FFFBEB" },
	exclusiveGateway: { stroke: "#D97706", fill: "#FFFBEB" },
	"bpmn:ParallelGateway": { stroke: "#7C3AED", fill: "#F5F3FF" },
	parallelGateway: { stroke: "#7C3AED", fill: "#F5F3FF" },
	"bpmn:StartEvent": { stroke: "#16A34A", fill: "#F0FDF4" },
	startEvent: { stroke: "#16A34A", fill: "#F0FDF4" },
	"bpmn:EndEvent": { stroke: "#DC2626", fill: "#FEF2F2" },
	endEvent: { stroke: "#DC2626", fill: "#FEF2F2" },
};

const STATE_COLORS: Record<string, { stroke: string; fill: string; dash?: string }> = {
	forming: { stroke: "#D97706", fill: "#FFFBEB", dash: "5,5" },
	confirmed: { stroke: "", fill: "" }, // Use type colors
	active: { stroke: "#2563EB", fill: "#DBEAFE" },
};

function applyTypeColors(gfx: any, node: DiagramNode, element: any) {
	const visual = gfx.querySelector(
		".djs-visual rect, .djs-visual polygon, .djs-visual circle, .djs-visual ellipse",
	);
	if (!visual) return;

	// State colors override type colors
	const stateColors = STATE_COLORS[node.state];
	if (stateColors && stateColors.stroke) {
		visual.setAttribute("stroke", stateColors.stroke);
		visual.setAttribute("fill", stateColors.fill);
		if (stateColors.dash) {
			visual.setAttribute("stroke-dasharray", stateColors.dash);
		}
		if ((node.state as string) === "active") {
			visual.setAttribute("stroke-width", "3");
		}
		return;
	}

	// Type-based colors for confirmed elements
	const type = element.type || node.type;
	const typeColors = TYPE_COLORS[type];
	if (typeColors) {
		visual.setAttribute("stroke", typeColors.stroke);
		visual.setAttribute("stroke-width", "2");
		visual.setAttribute("fill", typeColors.fill);
	}
}

function addFormingOverlay(
	overlays: any,
	node: DiagramNode,
	onConfirmNode: (nodeId: string) => void,
	onRejectNode: (nodeId: string) => void,
) {
	const html = document.createElement("div");
	html.className = "bpmn-node-actions";
	html.innerHTML = `
		<button data-action="confirm" data-node-id="${node.id}" class="bpmn-action-btn bpmn-action-confirm" title="Confirm step">✓</button>
		<button data-action="reject" data-node-id="${node.id}" class="bpmn-action-btn bpmn-action-reject" title="Reject step">✗</button>
	`;

	html.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const action = target.getAttribute("data-action");
		const nodeId = target.getAttribute("data-node-id");
		if (action === "confirm" && nodeId) onConfirmNode(nodeId);
		if (action === "reject" && nodeId) onRejectNode(nodeId);
	});

	try {
		overlays.add(node.id, "node-actions", {
			position: { bottom: -8, left: 0 },
			html,
		});
	} catch {
		// Element may not support overlays
	}
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
