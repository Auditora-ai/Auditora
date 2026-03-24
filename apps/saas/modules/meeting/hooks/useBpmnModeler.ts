"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DiagramNode } from "../types";
import { buildBpmnXml, bpmnType, dims, bpmnTag } from "../lib/bpmn-builder";

/**
 * useBpmnModeler — Custom hook for bpmn-js Modeler lifecycle
 *
 * Handles:
 * - Modeler initialization and destruction (SSR-safe via dynamic import)
 * - AI node rendering via incremental Modeling API (createShape, connect, etc.)
 * - First render uses importXML bootstrap; subsequent updates use Modeling API
 * - State-based CSS markers for node states
 * - CSS markers for state-based coloring
 * - Full editing tools (palette, context-pad, undo/redo) preserved across AI updates
 */

interface UseBpmnModelerOptions {
	containerRef: React.RefObject<HTMLDivElement | null>;
	/** Initial BPMN XML to load. If not provided, starts with a default pool. */
	initialXml?: string | null;
	/** Process name — used to label the default pool when no initialXml is provided. */
	processName?: string;
	/** Callback when user confirms a forming node. Required for live AI mode. */
	onConfirmNode?: (nodeId: string) => void;
	/** Callback when user rejects a forming node. Required for live AI mode. */
	onRejectNode?: (nodeId: string) => void;
	sessionStatus?: "ACTIVE" | "ENDED";
	/** Fallback nodes to rebuild XML from if importXML fails (auto-recovery). */
	fallbackNodes?: DiagramNode[];
}

interface ModelerAPI {
	modeler: any;
	isReady: boolean;
	renderError: string | null;
	/** True when the modeler recovered from corrupted XML by rebuilding from nodes. */
	recovered: boolean;
	mergeAiNodes: (nodes: DiagramNode[]) => void;
	/** Force-rebuild the diagram from the given nodes (or fallbackNodes). */
	rebuildFromNodes: (nodes?: DiagramNode[]) => Promise<void>;
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
	// Smart zoom
	zoomToElement: (labelOrLane: string) => void;
	// Subprocess deep-linking
	navigationStack: { id: string; label: string }[];
	drillDown: (elementId: string) => void;
	navigateUp: (level: number) => void;
}

import { X_GAP, Y_PAD, LANE_H, CONTENT_X } from "../lib/layout-constants";
import { applyBizagiColors } from "../lib/bpmn-colors";

export function useBpmnModeler({
	containerRef,
	initialXml,
	processName,
	onConfirmNode,
	onRejectNode,
	sessionStatus = "ACTIVE",
	fallbackNodes,
}: UseBpmnModelerOptions): ModelerAPI {
	const modelerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [renderError, setRenderError] = useState<string | null>(null);
	const [recovered, setRecovered] = useState(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [gridEnabled, setGridEnabled] = useState(false);
	const [selectedElement, setSelectedElement] = useState<any>(null);

	// Incremental merge state
	const bootstrappedRef = useRef(false);
	const knownNodesRef = useRef<Map<string, DiagramNode>>(new Map());
	const knownConnectionsRef = useRef<Set<string>>(new Set());
	const layoutXRef = useRef<Map<string, number>>(new Map()); // lane -> next X
	const importingRef = useRef(false);
	const fallbackNodesRef = useRef<DiagramNode[] | undefined>(fallbackNodes);
	fallbackNodesRef.current = fallbackNodes;

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

			// Import initial XML (or empty diagram for live AI mode)
			try {
				await modeler.importXML(initialXml || defaultBpmnXml(processName));
				const canvas = modeler.get("canvas");
				canvas.zoom("fit-viewport", "auto");
				applyBizagiColors(modeler);

				// Force white background on bpmn-js internals (dark theme override)
				forceCanvasWhite(containerRef.current);
			} catch (err) {
				console.error("[useBpmnModeler] Failed to import initial XML:", err);

				// Auto-recovery: rebuild from fallback nodes if available
				const nodes = fallbackNodesRef.current;
				if (nodes && nodes.length > 0) {
					console.warn("[useBpmnModeler] Attempting auto-recovery from DiagramNodes...");
					try {
						const recoveredXml = buildBpmnXml(nodes);
						await modeler.importXML(recoveredXml);
						const canvas = modeler.get("canvas");
						canvas.zoom("fit-viewport", "auto");
						applyBizagiColors(modeler);
						setRecovered(true);
						setRenderError("El diagrama se regeneró automáticamente desde los datos guardados.");
					} catch (recoveryErr) {
						console.error("[useBpmnModeler] Recovery also failed, loading empty diagram:", recoveryErr);
						await modeler.importXML(defaultBpmnXml());
						setRenderError("El diagrama está corrupto y no se pudo recuperar. Use 'Arreglar con IA' para repararlo.");
					}
				} else {
					// No nodes available — load empty diagram so modeler is usable
					try {
						await modeler.importXML(defaultBpmnXml());
						setRenderError("El diagrama no se pudo cargar. Use 'Arreglar con IA' para repararlo.");
					} catch {
						console.error("[useBpmnModeler] Even empty diagram failed");
						return;
					}
				}
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
			bootstrappedRef.current = false;
			knownNodesRef.current.clear();
			knownConnectionsRef.current.clear();
			layoutXRef.current.clear();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	/**
	 * Merge AI-generated nodes into the Modeler.
	 *
	 * First call: bootstrap via importXML (full XML render).
	 * Subsequent calls: use Modeling API for incremental diff/apply.
	 * This preserves undo/redo stack and manual user edits.
	 */
	const mergeAiNodes = useCallback(
		async (nodes: DiagramNode[]) => {
			const modeler = modelerRef.current;
			if (!modeler || !isReady) return;
			if (importingRef.current) return;

			const visibleNodes = nodes.filter((n) => n.state !== "rejected");

			importingRef.current = true;
			try {
				if (!bootstrappedRef.current) {
					// --- Bootstrap: first render via importXML ---
					if (visibleNodes.length === 0) {
						importingRef.current = false;
						return;
					}

					const xml = buildBpmnXml(visibleNodes);
					try {
						await modeler.importXML(xml);
					} catch (bootstrapErr) {
						console.error("[useBpmnModeler] Bootstrap importXML failed, loading empty:", bootstrapErr);
						await modeler.importXML(defaultBpmnXml());
						setRenderError("El diagrama generado tiene errores. Use 'Arreglar con IA' para repararlo.");
					}

					const canvas = modeler.get("canvas");
					canvas.zoom("fit-viewport", "auto");

					// Populate known state from bootstrap
					knownNodesRef.current.clear();
					knownConnectionsRef.current.clear();
					for (const node of visibleNodes) {
						knownNodesRef.current.set(node.id, { ...node });
						for (const target of node.connections) {
							knownConnectionsRef.current.add(`${node.id}->${target}`);
						}
					}

					// Apply state-based styling
					applyAllStyling(modeler, nodes);

					bootstrappedRef.current = true;
				} else {
					// --- Incremental update via Modeling API ---
					incrementalUpdate(modeler, visibleNodes, nodes);
				}
			} catch (err) {
				console.error("[useBpmnModeler] Failed to render BPMN:", err);
				setRenderError(
					`Diagram render failed: ${err instanceof Error ? err.message : "unknown error"}`,
				);
			} finally {
				importingRef.current = false;
			}
		},
		[isReady],
	);

	/**
	 * Force-rebuild the diagram from nodes, resetting all state.
	 * Used for manual recovery ("Regenerar diagrama") and AI repair.
	 */
	const rebuildFromNodes = useCallback(
		async (nodes?: DiagramNode[]) => {
			const modeler = modelerRef.current;
			if (!modeler) return;

			const rebuildNodes = nodes || fallbackNodesRef.current;
			if (!rebuildNodes || rebuildNodes.length === 0) {
				setRenderError("No hay datos de nodos para regenerar el diagrama.");
				return;
			}

			try {
				const xml = buildBpmnXml(rebuildNodes);
				await modeler.importXML(xml);
				const canvas = modeler.get("canvas");
				canvas.zoom("fit-viewport", "auto");
				applyBizagiColors(modeler);

				// Reset incremental state
				bootstrappedRef.current = true;
				knownNodesRef.current.clear();
				knownConnectionsRef.current.clear();
				for (const node of rebuildNodes.filter((n) => n.state !== "rejected")) {
					knownNodesRef.current.set(node.id, { ...node });
					for (const target of node.connections) {
						knownConnectionsRef.current.add(`${node.id}->${target}`);
					}
				}

				setRenderError(null);
				setRecovered(true);
			} catch (err) {
				console.error("[useBpmnModeler] Rebuild from nodes failed:", err);
				setRenderError("No se pudo regenerar el diagrama. Intente 'Arreglar con IA'.");
			}
		},
		[],
	);

	/**
	 * Incremental update: diff known nodes vs incoming nodes,
	 * then apply changes via Modeling API.
	 */
	function incrementalUpdate(
		modeler: any,
		visibleNodes: DiagramNode[],
		allNodes: DiagramNode[],
	) {
		const elementRegistry = modeler.get("elementRegistry");
		const elementFactory = modeler.get("elementFactory");
		const modeling = modeler.get("modeling");
		const bpmnFactory = modeler.get("bpmnFactory");
		const canvas = modeler.get("canvas");
		const overlays = modeler.get("overlays");

		const known = knownNodesRef.current;
		const knownConnections = knownConnectionsRef.current;
		const incomingMap = new Map(visibleNodes.map((n) => [n.id, n]));

		// --- Detect changes ---
		const newNodes: DiagramNode[] = [];
		const updatedNodes: DiagramNode[] = [];
		const removedIds: string[] = [];

		// Find new and updated nodes
		for (const node of visibleNodes) {
			const tag = bpmnTag(node.type);
			if (tag === "startEvent" || tag === "endEvent") continue;

			const prev = known.get(node.id);
			if (!prev) {
				newNodes.push(node);
			} else if (
				prev.label !== node.label ||
				prev.state !== node.state ||
				prev.connections.join(",") !== node.connections.join(",")
			) {
				updatedNodes.push(node);
			}
		}

		// Find removed nodes
		for (const [id, prev] of known) {
			if (!incomingMap.has(id)) {
				removedIds.push(id);
			}
		}

		// Track if topology changed (needs fit-viewport)
		let topologyChanged = newNodes.length > 0 || removedIds.length > 0;

		// --- Apply removals ---
		for (const id of removedIds) {
			const element = elementRegistry.get(id);
			if (element) {
				try {
					// Remove overlays first
					try {
						overlays.remove({ element: id });
					} catch {
						// ok
					}
					modeling.removeShape(element);
				} catch (err) {
					console.warn(`[useBpmnModeler] Failed to remove ${id}:`, err);
				}
			}
			known.delete(id);
			// Clean up connections involving this node
			for (const key of knownConnections) {
				if (key.startsWith(`${id}->`) || key.endsWith(`->${id}`)) {
					knownConnections.delete(key);
				}
			}
		}

		// --- Apply new nodes ---
		for (const node of newNodes) {
			try {
				const type = bpmnType(node.type);

				// Find parent element (the process within the pool)
				// After bootstrap, elements live inside the participant
				let parent = elementRegistry.get("Pool");
				if (!parent) {
					parent = elementRegistry.get("Process_1");
				}
				if (!parent) {
					// Fallback: find any process-like root
					const roots = elementRegistry.filter(
						(e: any) =>
							e.type === "bpmn:Participant" || e.type === "bpmn:Process",
					);
					parent = roots[0];
				}

				// Calculate position
				const lane = node.lane || "General";
				const currentX = layoutXRef.current.get(lane) || CONTENT_X;
				const newX = currentX + X_GAP;
				layoutXRef.current.set(lane, newX);

				// Find lane index for Y position
				const allLanes = [
					...new Set(
						[...known.values(), ...newNodes].map(
							(n) => n.lane || "General",
						),
					),
				];
				const laneIndex = allLanes.indexOf(lane);
				const d = dims(node.type);
				const y = Y_PAD + laneIndex * LANE_H + (LANE_H - d.h) / 2;

				// Create business object with stable ID
				const bo = bpmnFactory.create(type.replace("bpmn:", "bpmn:"), {
					id: node.id,
					name: node.label || undefined,
				});

				const shape = elementFactory.createShape({
					type,
					businessObject: bo,
				});

				modeling.createShape(shape, { x: newX, y }, parent);

				// Apply confidence marker for low-confidence nodes
				if (node.confidence != null && node.confidence < 0.7) {
					try {
						canvas.addMarker(node.id, "confidence-low");
					} catch {
						// ok
					}
				}

				known.set(node.id, { ...node });
			} catch (err) {
				console.warn(
					`[useBpmnModeler] Failed to add node ${node.id}:`,
					err,
				);
			}
		}

		// --- Apply updates to existing nodes ---
		for (const node of updatedNodes) {
			const element = elementRegistry.get(node.id);
			if (!element) continue;

			const prev = known.get(node.id)!;

			// Update label if changed
			if (prev.label !== node.label) {
				try {
					modeling.updateLabel(element, node.label);
				} catch {
					try {
						modeling.updateProperties(element, {
							name: node.label,
						});
					} catch (err) {
						console.warn(
							`[useBpmnModeler] Failed to update label for ${node.id}:`,
							err,
						);
					}
				}
			}

			// Update state markers if changed
			if (prev.state !== node.state) {
				try {
					canvas.removeMarker(node.id, `state-${prev.state}`);
				} catch {
					// ok
				}
				try {
					canvas.addMarker(node.id, `state-${node.state}`);
				} catch {
					// ok
				}

				// Update type colors
				const gfx = elementRegistry.getGraphics(node.id);
				if (gfx) {
					applyTypeColors(gfx, node, element);
				}

				// Clear any stale overlays
				try {
					overlays.remove({ element: node.id });
				} catch {
					// ok
				}
			}

			// Handle connection changes
			const prevConns = new Set(prev.connections);
			const newConns = new Set(node.connections);

			// Add new connections
			for (const target of newConns) {
				const connKey = `${node.id}->${target}`;
				if (!knownConnections.has(connKey)) {
					const targetElement = elementRegistry.get(target);
					if (targetElement) {
						try {
							modeling.connect(element, targetElement);
							knownConnections.add(connKey);
							topologyChanged = true;
						} catch (err) {
							console.warn(
								`[useBpmnModeler] Failed to connect ${node.id}->${target}:`,
								err,
							);
						}
					}
				}
			}

			// Remove old connections
			for (const target of prevConns) {
				if (!newConns.has(target)) {
					const connKey = `${node.id}->${target}`;
					// Find the connection element
					const connections =
						element.outgoing?.filter(
							(c: any) => c.target?.id === target,
						) || [];
					for (const conn of connections) {
						try {
							modeling.removeConnection(conn);
						} catch (err) {
							console.warn(
								`[useBpmnModeler] Failed to remove connection ${connKey}:`,
								err,
							);
						}
					}
					knownConnections.delete(connKey);
					topologyChanged = true;
				}
			}

			known.set(node.id, { ...node });
		}

		// --- Connect new nodes to the graph ---
		for (const node of newNodes) {
			const element = elementRegistry.get(node.id);
			if (!element) continue;

			for (const targetId of node.connections) {
				const targetElement = elementRegistry.get(targetId);
				if (targetElement) {
					const connKey = `${node.id}->${targetId}`;
					if (!knownConnections.has(connKey)) {
						try {
							modeling.connect(element, targetElement);
							knownConnections.add(connKey);
						} catch (err) {
							console.warn(
								`[useBpmnModeler] Failed to connect new node ${node.id}->${targetId}:`,
								err,
							);
						}
					}
				}
			}

			// Check if any existing node should connect TO this new node
			for (const [existingId, existingNode] of known) {
				if (existingNode.connections.includes(node.id)) {
					const connKey = `${existingId}->${node.id}`;
					if (!knownConnections.has(connKey)) {
						const existingElement = elementRegistry.get(existingId);
						if (existingElement && element) {
							try {
								modeling.connect(existingElement, element);
								knownConnections.add(connKey);
							} catch (err) {
								console.warn(
									`[useBpmnModeler] Failed to connect ${existingId}->${node.id}:`,
									err,
								);
							}
						}
					}
				}
			}
		}

		// Fit viewport if topology changed
		if (topologyChanged) {
			try {
				canvas.zoom("fit-viewport", "auto");
			} catch {
				// ok
			}
		}
	}

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

	/**
	 * Smart zoom: find an element by label or lane name and center the canvas on it.
	 */
	const zoomToElement = useCallback((labelOrLane: string) => {
		const modeler = modelerRef.current;
		if (!modeler) return;

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

		// Also check lane/participant names
		if (!target) {
			for (const el of allElements) {
				if (!el.businessObject) continue;
				if (
					el.type === "bpmn:Lane" ||
					el.type === "bpmn:Participant"
				) {
					const name = (el.businessObject.name || "").toLowerCase();
					if (name && name.includes(needle)) {
						target = el;
						break;
					}
				}
			}
		}

		if (!target) return;

		// Center canvas on the element
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
		canvas.zoom(1.2); // slight zoom in for focus
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

	// ─── Subprocess Deep-Linking ────────────────────────────────────
	const navigationStackRef = useRef<{ id: string; label: string }[]>([]);
	const [navigationStack, setNavigationStack] = useState<
		{ id: string; label: string }[]
	>([]);

	const drillDown = useCallback((elementId: string) => {
		const modeler = modelerRef.current;
		if (!modeler) return;

		const elementRegistry = modeler.get("elementRegistry");
		const canvas = modeler.get("canvas");
		const element = elementRegistry.get(elementId);

		if (!element || element.type !== "bpmn:SubProcess") return;

		// Push current root to stack
		const currentRoot = canvas.getRootElement();
		navigationStackRef.current = [
			...navigationStackRef.current,
			{
				id: currentRoot.id,
				label:
					navigationStackRef.current.length === 0
						? "Proceso Principal"
						: currentRoot.businessObject?.name || currentRoot.id,
			},
		];
		setNavigationStack([...navigationStackRef.current]);

		// Drill into subprocess
		canvas.setRootElement(
			canvas.findRoot(elementId) || canvas.addRootElement(element),
		);
	}, []);

	const navigateUp = useCallback((level: number) => {
		const modeler = modelerRef.current;
		if (!modeler) return;

		const canvas = modeler.get("canvas");
		const stack = navigationStackRef.current;

		if (level < 0 || level >= stack.length) return;

		const target = stack[level];
		navigationStackRef.current = stack.slice(0, level);
		setNavigationStack([...navigationStackRef.current]);

		const root = canvas.findRoot(target.id);
		if (root) canvas.setRootElement(root);
	}, []);

	// Register double-click handler for subprocesses
	useEffect(() => {
		const modeler = modelerRef.current;
		if (!modeler || !isReady) return;

		const eventBus = modeler.get("eventBus");
		const handler = (e: any) => {
			if (e.element?.type === "bpmn:SubProcess") {
				drillDown(e.element.id);
			}
		};

		eventBus.on("element.dblclick", handler);
		return () => eventBus.off("element.dblclick", handler);
	}, [isReady, drillDown]);

	return {
		modeler: modelerRef.current,
		isReady,
		renderError,
		recovered,
		mergeAiNodes,
		rebuildFromNodes,
		zoomIn,
		zoomOut,
		zoomFit,
		zoomToElement,
		undo,
		redo,
		canUndo,
		canRedo,
		toggleGrid,
		gridEnabled,
		getModeler,
		selectedElement,
		navigationStack,
		drillDown,
		navigateUp,
	};
}

// ─── Styling helpers ────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { stroke: string; fill: string }> = {
	"bpmn:Task": { stroke: "#3B82F6", fill: "#EFF6FF" },
	task: { stroke: "#3B82F6", fill: "#EFF6FF" },
	"bpmn:ExclusiveGateway": { stroke: "#EAB308", fill: "#FEF9C3" },
	exclusiveGateway: { stroke: "#EAB308", fill: "#FEF9C3" },
	"bpmn:ParallelGateway": { stroke: "#7C3AED", fill: "#F5F3FF" },
	parallelGateway: { stroke: "#7C3AED", fill: "#F5F3FF" },
	"bpmn:StartEvent": { stroke: "#16A34A", fill: "#F0FDF4" },
	startEvent: { stroke: "#16A34A", fill: "#F0FDF4" },
	"bpmn:EndEvent": { stroke: "#DC2626", fill: "#FEF2F2" },
	endEvent: { stroke: "#DC2626", fill: "#FEF2F2" },
	"bpmn:IntermediateThrowEvent": { stroke: "#A16207", fill: "#FEF3C7" },
	"bpmn:IntermediateCatchEvent": { stroke: "#A16207", fill: "#FEF3C7" },
	"bpmn:BoundaryEvent": { stroke: "#A16207", fill: "#FEF3C7" },
	"bpmn:SubProcess": { stroke: "#7C3AED", fill: "#F5F3FF" },
	subprocess: { stroke: "#7C3AED", fill: "#F5F3FF" },
};

const STATE_COLORS: Record<
	string,
	{ stroke: string; fill: string; dash?: string }
> = {
	forming: { stroke: "#EAB308", fill: "#FEF9C3", dash: "5,5" },
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

/**
 * Apply styling to all nodes after bootstrap importXML.
 * Note: Overlay-based confirm/reject buttons have been removed.
 * AI suggestions are now handled by AiSuggestionsPanel in the sidebar.
 */
function applyAllStyling(
	modeler: any,
	allNodes: DiagramNode[],
) {
	const canvas = modeler.get("canvas");
	const elementRegistry = modeler.get("elementRegistry");

	for (const node of allNodes) {
		const element = elementRegistry.get(node.id);
		if (!element) continue;

		// Apply CSS state markers
		try {
			canvas.addMarker(node.id, `state-${node.state}`);
		} catch {
			// Element may not support markers
		}

		// Apply confidence marker for low-confidence nodes
		if (node.confidence != null && node.confidence < 0.7) {
			try {
				canvas.addMarker(node.id, "confidence-low");
			} catch {
				// ok
			}
		}

		// Apply type-based coloring to the SVG element
		const gfx = elementRegistry.getGraphics(node.id);
		if (gfx) {
			applyTypeColors(gfx, node, element);
		}
	}
}

function defaultBpmnXml(processName?: string): string {
	// Use buildBpmnXml with a single start event to generate valid Pool XML
	const startNode: DiagramNode = {
		id: "start_default",
		type: "start_event",
		label: "Inicio",
		state: "confirmed",
		connections: [],
	};
	const xml = buildBpmnXml([startNode]);
	// Replace the hardcoded Pool name "Process" with the actual process name
	const name = processName || "Proceso";
	return xml.replace('name="Process"', `name="${name.replace(/"/g, "&quot;")}"`);
}

/**
 * Force white background on all bpmn-js internal elements.
 * Injects a <style> tag inside the .djs-container so it has
 * maximum proximity-based priority over any external CSS.
 */
function forceCanvasWhite(container: HTMLElement | null): void {
	if (!container) return;

	const djsContainer = container.querySelector(".djs-container") as HTMLElement | null;
	if (!djsContainer) return;

	// Inject a <style> tag directly inside the djs-container
	const existingStyle = djsContainer.querySelector("style[data-canvas-bg]");
	if (!existingStyle) {
		const style = document.createElement("style");
		style.setAttribute("data-canvas-bg", "true");
		style.textContent = `
			.djs-container { background: #ffffff !important; }
			.djs-container > svg { background: #ffffff !important; }
			.djs-overlay-container { background: transparent !important; }
		`;
		djsContainer.prepend(style);
	}

	// Also set inline styles as belt-and-suspenders
	djsContainer.style.setProperty("background", "#ffffff", "important");
	const svg = djsContainer.querySelector(":scope > svg") as SVGElement | null;
	if (svg) {
		svg.style.setProperty("background", "#ffffff", "important");
	}
}
