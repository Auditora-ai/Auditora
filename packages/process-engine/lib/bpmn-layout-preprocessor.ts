/**
 * BPMN Layout Preprocessor
 *
 * Analyzes a DiagramNode[] graph and produces an ELK-ready graph with:
 * - Flat structure (no groups — cross-lane edges break ELK group layout)
 * - Port constraints (FIXED_SIDE): in=WEST, out=EAST, back=SOUTH
 * - Layer constraints: start=FIRST, end=LAST
 * - Back-edges omitted (detected via BFS depth, rendered separately by bpmn-js)
 * - Lane Y-positioning handled post-layout
 *
 * Validated via spike tests (elk-port-spike.test.ts).
 */

import type { DiagramNode } from "../types/index";
import { dims, bpmnTag } from "./layout-constants";

// ─── Types ────────────────────────────────────────────────────────────

export interface ElkPort {
	id: string;
	properties: { "port.side": "EAST" | "WEST" | "SOUTH" | "NORTH" };
}

export interface ElkNode {
	id: string;
	width: number;
	height: number;
	ports: ElkPort[];
	layoutOptions: Record<string, string>;
	/** Lane name this node belongs to (for post-layout Y assignment) */
	_lane?: string;
}

export interface ElkEdge {
	id: string;
	sources: string[];
	targets: string[];
}

export interface PreprocessResult {
	/** Flat list of ELK nodes with port constraints */
	elkNodes: ElkNode[];
	/** Forward-only edges (back-edges omitted) */
	elkEdges: ElkEdge[];
	/** Back-edges detected (sourceId->targetId format) — render separately */
	backEdges: Set<string>;
	/** Original back-edge data for rendering */
	backEdgeList: Array<{ sourceId: string; targetId: string; edgeId: string }>;
	/** BFS depth per node (for debugging/validation) */
	nodeDepths: Map<string, number>;
	/** Ordered lane names */
	lanes: string[];
	/** Map of nodeId → lane name */
	nodeLaneMap: Map<string, string>;
}

// ─── Main Function ────────────────────────────────────────────────────

export function preprocessForElk(nodes: DiagramNode[]): PreprocessResult {
	const visible = nodes.filter((n) => n.state !== "rejected");
	if (visible.length === 0) {
		return emptyResult();
	}

	const nodeMap = new Map(visible.map((n) => [n.id, n]));
	const validIds = new Set(visible.map((n) => n.id));

	// ─── Step 1: BFS from start events to determine depth ──────────
	const depths = computeDepths(visible, validIds);

	// ─── Step 2: Detect back-edges ─────────────────────────────────
	const backEdges = new Set<string>();
	const backEdgeList: PreprocessResult["backEdgeList"] = [];
	let edgeCounter = 0;

	for (const node of visible) {
		const sourceDepth = depths.get(node.id) ?? 0;
		for (const targetId of node.connections) {
			if (!validIds.has(targetId)) continue;
			const targetDepth = depths.get(targetId) ?? 0;
			if (targetDepth <= sourceDepth && targetId !== node.id) {
				// Back-edge: target is at same or earlier depth
				const key = `${node.id}->${targetId}`;
				backEdges.add(key);
				backEdgeList.push({
					sourceId: node.id,
					targetId,
					edgeId: `back_${edgeCounter++}`,
				});
			}
		}
	}

	// ─── Step 3: Build lanes list ──────────────────────────────────
	const lanes = [...new Set(visible.map((n) => n.lane || "General"))];
	const nodeLaneMap = new Map<string, string>();
	for (const n of visible) {
		nodeLaneMap.set(n.id, n.lane || "General");
	}

	// ─── Step 4: Build ELK nodes with port constraints ─────────────
	const elkNodes: ElkNode[] = [];

	for (const node of visible) {
		const tag = bpmnTag(node.type);
		const d = dims(node.type);
		const ports: ElkPort[] = [];
		const layoutOptions: Record<string, string> = {
			"elk.portConstraints": "FIXED_SIDE",
		};

		// Determine ports based on node type and connections
		const isStart = tag === "startEvent";
		const isEnd = tag === "endEvent";
		const hasBackEdgeOut = node.connections.some(
			(t) => backEdges.has(`${node.id}->${t}`),
		);

		// Input port (WEST) — all except start events
		if (!isStart) {
			ports.push({ id: `${node.id}_in`, properties: { "port.side": "WEST" } });
		}

		// Output port (EAST) — all except end events
		if (!isEnd) {
			ports.push({ id: `${node.id}_out`, properties: { "port.side": "EAST" } });
		}

		// Back-edge output port (SOUTH) — only if this node has a back-edge out
		if (hasBackEdgeOut) {
			ports.push({ id: `${node.id}_back`, properties: { "port.side": "SOUTH" } });
		}

		// Layer constraints
		if (isStart) {
			layoutOptions["elk.layered.layering.layerConstraint"] = "FIRST";
		} else if (isEnd) {
			layoutOptions["elk.layered.layering.layerConstraint"] = "LAST";
		}

		elkNodes.push({
			id: node.id,
			width: d.w,
			height: d.h,
			ports,
			layoutOptions,
			_lane: node.lane || "General",
		});
	}

	// ─── Step 5: Build forward-only edges ──────────────────────────
	const elkEdges: ElkEdge[] = [];
	let fwdEdgeCounter = 0;

	for (const node of visible) {
		for (const targetId of node.connections) {
			if (!validIds.has(targetId)) continue;
			const key = `${node.id}->${targetId}`;
			if (backEdges.has(key)) continue; // Skip back-edges

			const sourcePort = `${node.id}_out`;
			const targetPort = `${targetId}_in`;

			elkEdges.push({
				id: `ef_${fwdEdgeCounter++}`,
				sources: [sourcePort],
				targets: [targetPort],
			});
		}
	}

	return {
		elkNodes,
		elkEdges,
		backEdges,
		backEdgeList,
		nodeDepths: depths,
		lanes,
		nodeLaneMap,
	};
}

// ─── BFS Depth Computation ────────────────────────────────────────────

function computeDepths(
	nodes: DiagramNode[],
	validIds: Set<string>,
): Map<string, number> {
	const depths = new Map<string, number>();

	// Find start events or nodes with no incoming edges
	const incoming = new Set<string>();
	for (const n of nodes) {
		for (const t of n.connections) {
			if (validIds.has(t)) incoming.add(t);
		}
	}

	const roots: string[] = [];
	for (const n of nodes) {
		const tag = bpmnTag(n.type);
		if (tag === "startEvent") {
			roots.push(n.id);
		}
	}
	// If no start events, use nodes with no incoming edges
	if (roots.length === 0) {
		for (const n of nodes) {
			if (!incoming.has(n.id)) roots.push(n.id);
		}
	}
	// If still nothing, use first node
	if (roots.length === 0 && nodes.length > 0) {
		roots.push(nodes[0].id);
	}

	// BFS
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const queue: Array<{ id: string; depth: number }> = roots.map((id) => ({
		id,
		depth: 0,
	}));

	while (queue.length > 0) {
		const { id, depth } = queue.shift()!;
		if (depths.has(id)) continue; // Already visited
		depths.set(id, depth);

		const node = nodeMap.get(id);
		if (!node) continue;

		for (const targetId of node.connections) {
			if (validIds.has(targetId) && !depths.has(targetId)) {
				queue.push({ id: targetId, depth: depth + 1 });
			}
		}
	}

	// Assign depth to any unreached nodes (disconnected components)
	for (const n of nodes) {
		if (!depths.has(n.id)) {
			depths.set(n.id, 0);
		}
	}

	return depths;
}

// ─── Post-Layout: Assign Y Positions by Lane ─────────────────────────

export interface LaneLayout {
	name: string;
	y: number;
	height: number;
	nodeIds: string[];
}

/**
 * After ELK computes X positions (layers), assign Y positions based on lanes.
 * Each lane gets a horizontal band. Nodes are centered vertically in their lane.
 */
export function assignLaneYPositions(
	elkResult: any,
	preprocessResult: PreprocessResult,
	laneHeight: number = 200,
	lanePadding: number = 50,
): { positions: Map<string, { x: number; y: number }>; laneLayouts: LaneLayout[] } {
	const { lanes, nodeLaneMap } = preprocessResult;
	const positions = new Map<string, { x: number; y: number }>();

	// Get ELK x-positions from flat result
	const elkPositions = new Map<string, { x: number; y: number; w: number; h: number }>();
	for (const child of elkResult.children || []) {
		elkPositions.set(child.id, {
			x: child.x || 0,
			y: child.y || 0,
			w: child.width || 100,
			h: child.height || 80,
		});
	}

	// Build lane layouts
	const laneLayouts: LaneLayout[] = [];
	let currentY = 0;

	for (const lane of lanes) {
		const nodeIds = [...nodeLaneMap.entries()]
			.filter(([, l]) => l === lane)
			.map(([id]) => id);

		// Sort nodes by ELK Y-position to preserve relative ordering
		const nodesWithElk = nodeIds
			.map((id) => ({ id, elk: elkPositions.get(id) }))
			.filter((n): n is { id: string; elk: NonNullable<typeof n.elk> } => n.elk != null)
			.sort((a, b) => a.elk.y - b.elk.y);

		// Calculate required lane height based on ELK's Y-spread for this lane
		const elkYs = nodesWithElk.map((n) => n.elk.y);
		const elkHs = nodesWithElk.map((n) => n.elk.h);
		let minElkY = elkYs.length > 0 ? Math.min(...elkYs) : 0;
		let maxElkYBottom = elkYs.length > 0
			? Math.max(...elkYs.map((y, i) => y + elkHs[i]))
			: 80;
		const elkSpread = maxElkYBottom - minElkY;

		const actualHeight = Math.max(laneHeight, elkSpread + lanePadding * 2);

		laneLayouts.push({
			name: lane,
			y: currentY,
			height: actualHeight,
			nodeIds,
		});

		// Assign positions: X from ELK, Y preserving ELK's relative ordering within lane
		// Map ELK Y-range into the lane band with padding
		const yOffset = currentY + lanePadding - minElkY;
		// If only 1 node or all at same Y, center vertically
		if (elkSpread < 1) {
			for (const n of nodesWithElk) {
				positions.set(n.id, {
					x: n.elk.x,
					y: currentY + (actualHeight - n.elk.h) / 2,
				});
			}
		} else {
			for (const n of nodesWithElk) {
				positions.set(n.id, {
					x: n.elk.x,
					y: n.elk.y + yOffset,
				});
			}
		}

		currentY += actualHeight;
	}

	return { positions, laneLayouts };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function emptyResult(): PreprocessResult {
	return {
		elkNodes: [],
		elkEdges: [],
		backEdges: new Set(),
		backEdgeList: [],
		nodeDepths: new Map(),
		lanes: [],
		nodeLaneMap: new Map(),
	};
}
