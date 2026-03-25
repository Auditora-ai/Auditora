"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DiagramNode } from "../types";
import { buildBpmnXml, layoutBpmnXml, bpmnType, dims, bpmnTag } from "../lib/bpmn-builder";
import { ELK_BPMN_CONFIG } from "../lib/layout-constants";
import { preprocessForElk, assignLaneYPositions } from "../lib/bpmn-layout-preprocessor";

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
	/** Callback when user clicks "Propiedades" in the context pad of an element. */
	onOpenProperties?: (elementId: string, elementType: string, parentId?: string) => void;
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
	/** Get node hierarchy from modeler for properties view tree rendering */
	getNodeHierarchy: () => { id: string; type: string; label: string; parentId: string | null }[];
}

import { X_GAP, Y_PAD, LANE_H, CONTENT_X } from "../lib/layout-constants";
import { applyBizagiColors } from "../lib/bpmn-colors";

export function useBpmnModeler({
	containerRef,
	initialXml,
	processName,
	onConfirmNode,
	onRejectNode,
	onOpenProperties,
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

	// Callback refs (stable reference for event handlers)
	const onOpenPropertiesRef = useRef(onOpenProperties);
	onOpenPropertiesRef.current = onOpenProperties;

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
				await modeler.importXML(initialXml || await defaultBpmnXml(processName));
				const canvas = modeler.get("canvas");
				try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ }
				applyBizagiColors(modeler);

				// If we loaded a saved diagram (not the default empty one),
				// mark as bootstrapped so mergeAiNodes does incremental updates
				// instead of rebuilding from scratch.
				if (initialXml) {
					bootstrappedRef.current = true;
					// Populate knownNodes from canvas elements so incremental merge
					// doesn't treat existing nodes as "new"
					const elementRegistry = modeler.get("elementRegistry");
					const elements = elementRegistry.filter((e: any) =>
						e.type?.startsWith("bpmn:") &&
						e.type !== "bpmn:Participant" &&
						e.type !== "bpmn:Lane" &&
						e.type !== "bpmn:Collaboration" &&
						e.type !== "bpmn:Process" &&
						e.type !== "bpmn:SequenceFlow" &&
						!e.type.includes("Plane") &&
						!e.type.includes("Label"),
					);
					for (const el of elements) {
						const outgoing = (el.outgoing || [])
							.filter((c: any) => c.type === "bpmn:SequenceFlow" && c.target)
							.map((c: any) => c.target.id);
						knownNodesRef.current.set(el.id, {
							id: el.id,
							type: el.type.replace("bpmn:", "").replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, ""),
							label: el.businessObject?.name || "",
							state: "confirmed",
							connections: outgoing,
						});
						for (const targetId of outgoing) {
							knownConnectionsRef.current.add(`${el.id}->${targetId}`);
						}
					}
				}

				// Force white background on bpmn-js internals (dark theme override)
				forceCanvasWhite(containerRef.current);
			} catch (err) {
				console.error("[useBpmnModeler] Failed to import initial XML:", err);

				// Auto-recovery: rebuild from fallback nodes if available
				const nodes = fallbackNodesRef.current;
				if (nodes && nodes.length > 0) {
					console.warn("[useBpmnModeler] Attempting auto-recovery from DiagramNodes...");
					try {
						const recoveredXml = await buildBpmnXml(nodes);
						await modeler.importXML(recoveredXml);
						const canvas = modeler.get("canvas");
						try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ }
						applyBizagiColors(modeler);
						setRecovered(true);
						setRenderError("El diagrama se regeneró automáticamente desde los datos guardados.");
					} catch (recoveryErr) {
						console.error("[useBpmnModeler] Recovery also failed, loading empty diagram:", recoveryErr);
						await modeler.importXML(await defaultBpmnXml());
						setRenderError("El diagrama está corrupto y no se pudo recuperar. Use 'Arreglar con IA' para repararlo.");
					}
				} else {
					// No nodes available — load empty diagram so modeler is usable
					try {
						await modeler.importXML(await defaultBpmnXml());
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

			// Register custom context pad provider for "Propiedades" button
			try {
				const contextPad = modeler.get("contextPad");
				contextPad.registerProvider({
					getContextPadEntries: (element: any) => {
						const type = element.type;
						// Only show for tasks, subprocesses, and activities
						const taskTypes = [
							"bpmn:Task", "bpmn:UserTask", "bpmn:ServiceTask",
							"bpmn:ManualTask", "bpmn:BusinessRuleTask", "bpmn:SubProcess",
						];
						if (!taskTypes.includes(type)) return {};

						return {
							"open-properties": {
								group: "edit",
								className: "bpmn-icon-service",
								title: "Propiedades",
								action: {
									click: (_event: any, el: any) => {
										const parentId = el.parent?.type === "bpmn:SubProcess"
											? el.parent.id
											: undefined;
										onOpenPropertiesRef.current?.(el.id, el.type, parentId);
									},
								},
							},
						};
					},
				});
			} catch (err) {
				console.warn("[useBpmnModeler] Could not register context pad provider:", err);
			}

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

					const rawXml = await buildBpmnXml(visibleNodes);
					const xml = await layoutBpmnXml(rawXml);
					try {
						await modeler.importXML(xml);
					} catch (bootstrapErr) {
						console.error("[useBpmnModeler] Bootstrap importXML failed, loading empty:", bootstrapErr);
						await modeler.importXML(await defaultBpmnXml());
						setRenderError("El diagrama generado tiene errores. Use 'Reorganizar' para corregir.");
					}

					const canvas = modeler.get("canvas");
					try { try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ } } catch { /* empty canvas */ }

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

			let rebuildNodes = (nodes || fallbackNodesRef.current || [])
				.filter((n) => n.state !== "rejected")
				.filter((n) => {
					// Filter phantom nodes: no label, no connections, not start/end
					const tag = bpmnTag(n.type);
					const isEvent = tag === "startEvent" || tag === "endEvent";
					const hasLabel = n.label && n.label.trim() !== "";
					return isEvent || hasLabel || n.connections.length > 0;
				});

			// Fallback: extract nodes from current canvas if no data nodes available
			if (rebuildNodes.length === 0 && modeler) {
				try {
					const elementRegistry = modeler.get("elementRegistry");
					const extracted: DiagramNode[] = [];
					const elements = elementRegistry.filter((e: any) =>
						e.type?.startsWith("bpmn:") &&
						e.type !== "bpmn:Participant" &&
						e.type !== "bpmn:Lane" &&
						e.type !== "bpmn:Collaboration" &&
						e.type !== "bpmn:Process" &&
						!e.type.includes("Plane"),
					);
					for (const el of elements) {
						const outgoing = (el.outgoing || []).map((c: any) => c.target?.id).filter(Boolean);
						// Find which lane this element is in
						let lane = "General";
						if (el.parent?.type === "bpmn:Lane") {
							lane = el.parent.businessObject?.name || "General";
						} else if (el.parent?.type === "bpmn:Participant") {
							lane = el.parent.businessObject?.name || "General";
						}
						extracted.push({
							id: el.id,
							type: el.type.replace("bpmn:", "").replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, ""),
							label: el.businessObject?.name || "",
							state: "confirmed",
							lane,
							connections: outgoing,
						});
					}
					if (extracted.length > 0) {
						rebuildNodes = extracted;
					}
				} catch (err) {
					console.warn("[rebuildFromNodes] Canvas extraction failed:", err);
				}
			}

			if (rebuildNodes.length === 0) {
				setRenderError("No hay datos de nodos para regenerar el diagrama.");
				return;
			}

			try {
				// Step 1: Preprocess graph + calculate positions with ELK
				const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
				const elkInstance = new ELK();

				const allNodes = rebuildNodes;
				const pp = preprocessForElk(allNodes);
				const lanes = pp.lanes;

				const elkResult = await elkInstance.layout({
					id: "root",
					layoutOptions: { ...ELK_BPMN_CONFIG },
					children: pp.elkNodes.map(({ _lane, ...n }) => n),
					edges: pp.elkEdges,
				});

				// Extract coordinates: X from ELK, Y from lane assignment
				const { positions: lanePositions, laneLayouts } = assignLaneYPositions(
					elkResult, pp, LANE_H, 50,
				);
				const positions = new Map<string, { x: number; y: number }>();
				const poolOffset = 40; // pool header width

				for (const [id, pos] of lanePositions) {
					positions.set(id, { x: pos.x + poolOffset, y: pos.y });
				}

				// Pool size
				let poolW = 0, poolH = 0;
				for (const ll of laneLayouts) { poolH = Math.max(poolH, ll.y + ll.height); }
				for (const child of elkResult.children || []) {
					poolW = Math.max(poolW, (child.x || 0) + (child.width || 160));
				}
				poolW += poolOffset + 80;
				poolH += 20;

				// Step 2: Import empty diagram
				const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="Diagram_1"><bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" /></bpmndi:BPMNDiagram>
</bpmn:definitions>`;
				await modeler.importXML(emptyXml);
				const canvas = modeler.get("canvas");
				const modeling = modeler.get("modeling");
				const elementFactory = modeler.get("elementFactory");
				const elementRegistry = modeler.get("elementRegistry");

				const rootProcess = canvas.getRootElement();

				// Step 3: Create Pool (Participant)
				const participantShape = elementFactory.createParticipantShape({ type: "bpmn:Participant" });
				modeling.createShape(participantShape, { x: poolW / 2, y: poolH / 2, width: poolW, height: poolH }, rootProcess);
				const participant = elementRegistry.filter((e: any) => e.type === "bpmn:Participant")[0];

				if (!participant) {
					throw new Error("Failed to create participant");
				}

				// Step 4: Create Lanes inside the participant
				// The participant already has 1 default lane. Reuse it as lanes[0].
				// Only call addLane() for lanes[1..N-1] to avoid N+1 duplicate lanes.
				const existingLanes = elementRegistry.filter((e: any) => e.type === "bpmn:Lane");
				if (existingLanes.length > 0 && lanes.length > 0) {
					// Rename the default lane to lanes[0]
					modeling.updateProperties(existingLanes[0], { name: lanes[0] });
				}
				// Add additional lanes for lanes[1..N-1]
				for (let li = 1; li < lanes.length; li++) {
					try {
						const laneShape = modeling.addLane(participant, "bottom");
						if (laneShape) {
							modeling.updateProperties(laneShape, { name: lanes[li] });
						}
					} catch {
						// Lane creation may not work as expected
					}
				}

				// Build lane name → lane element map
				const allLaneElements = elementRegistry.filter((e: any) => e.type === "bpmn:Lane");
				const laneMap = new Map<string, any>();
				for (const laneEl of allLaneElements) {
					const name = laneEl.businessObject?.name;
					if (name) laneMap.set(name, laneEl);
				}

				// Step 5: Create all shapes in participant, then move to correct lanes
				// Strategy: create with correct absolute positions in participant first
				// (this preserves connection routing), then reassign to lanes after.
				const createdElements = new Map<string, any>();

				for (const n of allNodes) {
					const type = bpmnType(n.type);
					const pos = positions.get(n.id) || { x: 200, y: 200 };
					const d = dims(n.type);

					try {
						const shape = elementFactory.createShape({ type });
						const created = modeling.createShape(
							shape,
							{ x: pos.x + d.w / 2, y: pos.y + d.h / 2 },
							participant,
						);
						if (created) {
							modeling.updateProperties(created, { name: n.label || undefined });
							createdElements.set(n.id, created);
						}
					} catch (err) {
						console.warn(`[rebuildFromNodes] Failed to create ${n.id}:`, err);
					}
				}

				// Step 6: Create connections with labels (for gateway conditions)
				for (const n of allNodes) {
					const sourceEl = createdElements.get(n.id);
					if (!sourceEl) continue;
					for (let ci = 0; ci < n.connections.length; ci++) {
						const targetId = n.connections[ci];
						const targetEl = createdElements.get(targetId);
						if (!targetEl) continue;
						try {
							const connection = modeling.connect(sourceEl, targetEl);
							// Add label for gateway outgoing flows
							const condLabel = n.connectionLabels?.[ci];
							if (condLabel && connection) {
								modeling.updateProperties(connection, { name: condLabel });
							}
						} catch {
							// ok
						}
					}
				}

				// Step 7: Resize lanes to encompass their shapes
				// Instead of moving shapes into lanes (which repositions them),
				// we resize each lane to cover the Y-band where its shapes are.
				for (const ll of laneLayouts) {
					const laneEl = laneMap.get(ll.name);
					if (!laneEl) continue;

					// Find min/max Y of shapes in this lane
					let minY = Infinity, maxY = -Infinity;
					for (const n of allNodes) {
						if ((n.lane || "General") !== ll.name) continue;
						const el = createdElements.get(n.id);
						if (!el) continue;
						minY = Math.min(minY, el.y);
						maxY = Math.max(maxY, el.y + el.height);
					}
					if (minY === Infinity) continue; // No shapes in this lane

					const padding = 30;
					const newY = minY - padding;
					const newH = (maxY - minY) + padding * 2;

					try {
						modeling.resizeLane(laneEl, {
							x: laneEl.x,
							y: newY,
							width: laneEl.width,
							height: Math.max(newH, 120),
						});
					} catch {
						// resizeLane may not be available, try moveShape + resize
						try {
							modeling.resizeShape(laneEl, {
								x: laneEl.x,
								y: newY,
								width: laneEl.width,
								height: Math.max(newH, 120),
							});
						} catch { /* ok */ }
					}
				}

				// Step 8: Re-layout all connections for proper orthogonal routing
				// bpmn-js uses Manhattan routing but it needs to be triggered after
				// all shapes are in their final positions
				try {
					const layouter = modeler.get("connectionDocking");
					const allConnections = elementRegistry.filter((e: any) => e.type === "bpmn:SequenceFlow");
					for (const conn of allConnections) {
						try {
							modeling.layoutConnection(conn);
						} catch { /* ok */ }
					}
				} catch { /* connectionDocking not available */ }

				try { try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ } } catch { /* empty/zero-size canvas */ }
				// Apply colors after a tick to ensure all shapes are fully rendered
				setTimeout(() => {
					try { applyBizagiColors(modeler); } catch { /* ok */ }
				}, 100);
				forceCanvasWhite(containerRef.current);

				// Reset incremental state
				bootstrappedRef.current = true;
				knownNodesRef.current.clear();
				knownConnectionsRef.current.clear();
				for (const node of rebuildNodes) {
					knownNodesRef.current.set(node.id, { ...node });
					for (const target of node.connections) {
						knownConnectionsRef.current.add(`${node.id}->${target}`);
					}
				}

				setRenderError(null);
				setRecovered(true);
			} catch (err) {
				console.error("[useBpmnModeler] Rebuild from nodes failed:", err);
				setRenderError("No se pudo regenerar el diagrama.");
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
				// Skip if element already exists on canvas (e.g. synced from DB after save)
				if (elementRegistry.get(node.id)) {
					known.set(node.id, { ...node });
					continue;
				}

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

				// Apply state marker
				if (node.state === "forming") {
					try {
						canvas.addMarker(node.id, "state-forming");
					} catch { /* ok */ }

					// Add confirm/reject overlay buttons
					addFormingOverlay(overlays, node.id, onConfirmNode, onRejectNode);
				}

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
				try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ }
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
		if (canvas) try { canvas.zoom("fit-viewport", "auto"); } catch { /* non-finite SVG */ }
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

	/** Get node hierarchy from modeler's element registry for the properties view tree */
	const getNodeHierarchy = useCallback(() => {
		const modeler = modelerRef.current;
		if (!modeler || !isReady) return [];

		try {
			const elementRegistry = modeler.get("elementRegistry");
			const elements = elementRegistry.getAll();
			const result: { id: string; type: string; label: string; parentId: string | null }[] = [];

			for (const el of elements) {
				// Only include BPMN flow elements (tasks, events, gateways, subprocesses)
				const type = el.type;
				if (!type?.startsWith("bpmn:") || type === "bpmn:Process" || type === "bpmn:Collaboration"
					|| type === "bpmn:Participant" || type === "bpmn:Lane" || type === "bpmn:LaneSet"
					|| type === "bpmn:SequenceFlow" || type === "bpmn:MessageFlow"
					|| type === "label") continue;

				const parentType = el.parent?.type;
				const parentId = parentType === "bpmn:SubProcess" ? el.parent.id : null;

				result.push({
					id: el.id,
					type,
					label: el.businessObject?.name || el.id,
					parentId,
				});
			}

			return result;
		} catch {
			return [];
		}
	}, [isReady]);

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
		getNodeHierarchy,
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

/**
 * Add confirm/reject overlay buttons to a forming node.
 */
function addFormingOverlay(
	overlays: any,
	nodeId: string,
	onConfirm?: (id: string) => void,
	onReject?: (id: string) => void,
): void {
	if (!onConfirm && !onReject) return;

	const container = document.createElement("div");
	container.style.cssText = "display:flex; gap:4px; pointer-events:auto;";

	if (onConfirm) {
		const confirmBtn = document.createElement("button");
		confirmBtn.innerHTML = "✓";
		confirmBtn.title = "Confirmar nodo";
		confirmBtn.style.cssText =
			"width:22px; height:22px; border-radius:6px; border:none; cursor:pointer; font-size:12px; font-weight:bold; " +
			"background:#16A34A; color:white; display:flex; align-items:center; justify-content:center; " +
			"box-shadow:0 1px 3px rgba(0,0,0,0.3); transition:transform 75ms;";
		confirmBtn.onmouseenter = () => { confirmBtn.style.transform = "scale(1.15)"; };
		confirmBtn.onmouseleave = () => { confirmBtn.style.transform = "scale(1)"; };
		confirmBtn.onclick = (e) => {
			e.stopPropagation();
			onConfirm(nodeId);
		};
		container.appendChild(confirmBtn);
	}

	if (onReject) {
		const rejectBtn = document.createElement("button");
		rejectBtn.innerHTML = "✗";
		rejectBtn.title = "Rechazar nodo";
		rejectBtn.style.cssText =
			"width:22px; height:22px; border-radius:6px; border:none; cursor:pointer; font-size:12px; font-weight:bold; " +
			"background:#DC2626; color:white; display:flex; align-items:center; justify-content:center; " +
			"box-shadow:0 1px 3px rgba(0,0,0,0.3); transition:transform 75ms;";
		rejectBtn.onmouseenter = () => { rejectBtn.style.transform = "scale(1.15)"; };
		rejectBtn.onmouseleave = () => { rejectBtn.style.transform = "scale(1)"; };
		rejectBtn.onclick = (e) => {
			e.stopPropagation();
			onReject(nodeId);
		};
		container.appendChild(rejectBtn);
	}

	try {
		overlays.add(nodeId, "forming-actions", {
			position: { bottom: -8, right: -8 },
			html: container,
		});
	} catch {
		// Element may not exist yet
	}
}

async function defaultBpmnXml(processName?: string): Promise<string> {
	const name = processName || "Proceso";
	const startNode: DiagramNode = {
		id: "start_default",
		type: "start_event",
		label: name,
		state: "confirmed",
		lane: name,
		connections: [],
	};
	const rawXml = await buildBpmnXml([startNode]);
	return layoutBpmnXml(rawXml);
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
