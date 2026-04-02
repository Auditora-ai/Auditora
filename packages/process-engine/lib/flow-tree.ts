/**
 * Flow Tree — converts flat DiagramNode[] into an ordered, indented tree
 * for the Process Tree Editor. Pure functions, no side effects.
 */

import type { DiagramNode } from "../types/index";
import { bpmnTag } from "./layout-constants";

// ─── Types ───────────────────────────────────────────────────────────

export interface FlowTreeItem {
	nodeId: string;
	node: DiagramNode;
	depth: number;
	branchLabel?: string;
	gatewayId?: string;
	isGatewayStart?: boolean;
	isGatewayEnd?: boolean;
}

export interface ConnectionPatch {
	nodeId: string;
	connections: string[];
	connectionLabels?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function tag(node: DiagramNode): string {
	return bpmnTag(node.type);
}

function isGateway(node: DiagramNode): boolean {
	const t = tag(node);
	return t === "exclusiveGateway" || t === "parallelGateway";
}

function isStartEvent(node: DiagramNode): boolean {
	return tag(node) === "startEvent";
}

function isEndEvent(node: DiagramNode): boolean {
	return tag(node) === "endEvent";
}

/** Build a map of nodeId → set of incoming node IDs */
function buildIncomingMap(nodes: DiagramNode[]): Map<string, Set<string>> {
	const incoming = new Map<string, Set<string>>();
	for (const n of nodes) {
		if (!incoming.has(n.id)) incoming.set(n.id, new Set());
		for (const targetId of n.connections) {
			if (!incoming.has(targetId)) incoming.set(targetId, new Set());
			incoming.get(targetId)!.add(n.id);
		}
	}
	return incoming;
}

/** Build a nodeId → DiagramNode lookup map */
function buildNodeMap(nodes: DiagramNode[]): Map<string, DiagramNode> {
	const map = new Map<string, DiagramNode>();
	for (const n of nodes) map.set(n.id, n);
	return map;
}

/**
 * Find the reconvergence point for a gateway — the first node reachable
 * from ALL branches. Returns null if branches don't reconverge.
 */
function findReconvergence(
	gateway: DiagramNode,
	nodeMap: Map<string, DiagramNode>,
): string | null {
	const branches = gateway.connections;
	if (branches.length < 2) return null;

	// For each branch, collect all reachable node IDs via BFS
	const reachableSets: Set<string>[] = branches.map((branchStart) => {
		const reachable = new Set<string>();
		const queue = [branchStart];
		const visited = new Set<string>();
		while (queue.length > 0) {
			const id = queue.shift()!;
			if (visited.has(id)) continue;
			visited.add(id);
			reachable.add(id);
			const node = nodeMap.get(id);
			if (node) {
				for (const next of node.connections) queue.push(next);
			}
		}
		return reachable;
	});

	// Find intersection — nodes reachable from ALL branches
	const intersection = new Set(reachableSets[0]);
	for (let i = 1; i < reachableSets.length; i++) {
		for (const id of intersection) {
			if (!reachableSets[i].has(id)) intersection.delete(id);
		}
	}

	if (intersection.size === 0) return null;

	// Return the closest reconvergence point (shortest BFS distance from first branch)
	const queue = [branches[0]];
	const visited = new Set<string>();
	while (queue.length > 0) {
		const id = queue.shift()!;
		if (visited.has(id)) continue;
		visited.add(id);
		if (intersection.has(id) && id !== branches[0]) return id;
		const node = nodeMap.get(id);
		if (node) {
			for (const next of node.connections) queue.push(next);
		}
	}

	return null;
}

// ─── buildFlowTree ───────────────────────────────────────────────────

export function buildFlowTree(nodes: DiagramNode[]): FlowTreeItem[] {
	const filtered = nodes.filter((n) => n.state !== "rejected");
	if (filtered.length === 0) return [];

	const nodeMap = buildNodeMap(filtered);
	const incoming = buildIncomingMap(filtered);
	const result: FlowTreeItem[] = [];
	const visited = new Set<string>();

	// Find start events
	const startNodes = filtered.filter((n) => isStartEvent(n));
	// Fallback: nodes with no incoming connections
	const roots = startNodes.length > 0
		? startNodes
		: filtered.filter((n) => (incoming.get(n.id)?.size ?? 0) === 0);

	function traverse(nodeId: string, depth: number, branchLabel?: string, gatewayId?: string) {
		if (visited.has(nodeId)) return;
		const node = nodeMap.get(nodeId);
		if (!node) return;

		visited.add(nodeId);

		const item: FlowTreeItem = {
			nodeId,
			node,
			depth,
			branchLabel,
			gatewayId,
			isGatewayStart: isGateway(node),
		};
		result.push(item);

		if (isGateway(node) && node.connections.length > 1) {
			// Find reconvergence point
			const reconvergeId = findReconvergence(node, nodeMap);

			// Traverse each branch
			for (let i = 0; i < node.connections.length; i++) {
				const branchTargetId = node.connections[i];
				const label = node.connectionLabels?.[i] || `Rama ${i + 1}`;

				// Traverse branch nodes until reconvergence
				let currentId: string | null = branchTargetId;
				while (currentId && currentId !== reconvergeId && !visited.has(currentId)) {
					const currentNode = nodeMap.get(currentId);
					if (!currentNode) break;

					visited.add(currentId);
					result.push({
						nodeId: currentId,
						node: currentNode,
						depth: depth + 1,
						branchLabel: currentId === branchTargetId ? label : undefined,
						gatewayId: nodeId,
						isGatewayStart: isGateway(currentNode),
					});

					// If this branch node is itself a gateway, recurse
					if (isGateway(currentNode) && currentNode.connections.length > 1) {
						const innerReconverge = findReconvergence(currentNode, nodeMap);
						for (let j = 0; j < currentNode.connections.length; j++) {
							traverse(
								currentNode.connections[j],
								depth + 2,
								currentNode.connectionLabels?.[j] || `Rama ${j + 1}`,
								currentId,
							);
						}
						// Continue from inner reconvergence
						currentId = innerReconverge;
					} else {
						currentId = currentNode.connections[0] || null;
					}
				}
			}

			// Continue from reconvergence point
			if (reconvergeId) {
				traverse(reconvergeId, depth);
			}
		} else if (node.connections.length > 0) {
			// Linear flow — follow first connection
			traverse(node.connections[0], depth);
		}
	}

	for (const root of roots) {
		traverse(root.id, 0);
	}

	// Add any orphan nodes not reached by traversal
	for (const node of filtered) {
		if (!visited.has(node.id)) {
			result.push({ nodeId: node.id, node, depth: 0 });
		}
	}

	return result;
}

// ─── Reorder ─────────────────────────────────────────────────────────

/**
 * Compute connection patches after moving a node from one position to another in the tree.
 * Returns the minimal set of nodes whose connections need to change.
 */
export function reorderNode(
	nodes: DiagramNode[],
	tree: FlowTreeItem[],
	fromIndex: number,
	toIndex: number,
): ConnectionPatch[] {
	const nodeMap = buildNodeMap(nodes.filter((n) => n.state !== "rejected"));
	const incoming = buildIncomingMap(nodes.filter((n) => n.state !== "rejected"));
	const movedItem = tree[fromIndex];
	if (!movedItem) return [];

	const movedNode = movedItem.node;
	const patches: Map<string, ConnectionPatch> = new Map();

	function getPatch(nodeId: string): ConnectionPatch {
		if (!patches.has(nodeId)) {
			const n = nodeMap.get(nodeId);
			patches.set(nodeId, {
				nodeId,
				connections: n ? [...n.connections] : [],
				connectionLabels: n?.connectionLabels ? [...n.connectionLabels] : undefined,
			});
		}
		return patches.get(nodeId)!;
	}

	// 1. Remove the moved node from its current position
	// Find predecessors (nodes that connect TO the moved node)
	const predecessors = incoming.get(movedNode.id) || new Set();
	for (const predId of predecessors) {
		const patch = getPatch(predId);
		const idx = patch.connections.indexOf(movedNode.id);
		if (idx >= 0) {
			// Replace connection to moved node with moved node's outgoing connections
			const replacements = movedNode.connections;
			patch.connections.splice(idx, 1, ...replacements);
			if (patch.connectionLabels) {
				const labels = movedNode.connectionLabels || [];
				patch.connectionLabels.splice(idx, 1, ...labels);
			}
		}
	}

	// 2. Insert the moved node at the new position
	const targetItem = tree[toIndex];
	if (!targetItem) return Array.from(patches.values());

	// Find the node that should now precede the moved node
	const insertBeforeId = targetItem.nodeId;
	const insertBeforePreds = incoming.get(insertBeforeId) || new Set();

	// The moved node's new connections: point to what's at toIndex
	const movedPatch = getPatch(movedNode.id);
	movedPatch.connections = [insertBeforeId];
	movedPatch.connectionLabels = undefined;

	// Update predecessors of the target to point to moved node instead
	for (const predId of insertBeforePreds) {
		if (predId === movedNode.id) continue;
		const patch = getPatch(predId);
		const idx = patch.connections.indexOf(insertBeforeId);
		if (idx >= 0) {
			patch.connections[idx] = movedNode.id;
		}
	}

	return Array.from(patches.values());
}

// ─── Connection manipulation ─────────────────────────────────────────

export function addConnection(
	nodes: DiagramNode[],
	sourceId: string,
	targetId: string,
	label?: string,
): ConnectionPatch[] {
	const nodeMap = buildNodeMap(nodes);
	const source = nodeMap.get(sourceId);
	if (!source) return [];

	const newConns = [...source.connections, targetId];
	const newLabels = source.connectionLabels
		? [...source.connectionLabels, label || ""]
		: label ? [...source.connections.map(() => ""), label] : undefined;

	return [{ nodeId: sourceId, connections: newConns, connectionLabels: newLabels }];
}

export function removeConnection(
	nodes: DiagramNode[],
	sourceId: string,
	targetId: string,
): ConnectionPatch[] {
	const nodeMap = buildNodeMap(nodes);
	const source = nodeMap.get(sourceId);
	if (!source) return [];

	const idx = source.connections.indexOf(targetId);
	if (idx < 0) return [];

	const newConns = source.connections.filter((_, i) => i !== idx);
	const newLabels = source.connectionLabels?.filter((_, i) => i !== idx);

	return [{ nodeId: sourceId, connections: newConns, connectionLabels: newLabels }];
}

/**
 * Insert a new node into the flow after a given node.
 * The new node takes over the afterNode's outgoing connections.
 */
export function insertNodeAfter(
	nodes: DiagramNode[],
	afterNodeId: string,
	newNodeId: string,
): ConnectionPatch[] {
	const nodeMap = buildNodeMap(nodes);
	const afterNode = nodeMap.get(afterNodeId);
	if (!afterNode) return [];

	// New node inherits afterNode's connections
	const newNodePatch: ConnectionPatch = {
		nodeId: newNodeId,
		connections: [...afterNode.connections],
		connectionLabels: afterNode.connectionLabels ? [...afterNode.connectionLabels] : undefined,
	};

	// afterNode now connects only to the new node
	const afterPatch: ConnectionPatch = {
		nodeId: afterNodeId,
		connections: [newNodeId],
		connectionLabels: undefined,
	};

	return [afterPatch, newNodePatch];
}

/**
 * Remove a node from the flow, reconnecting its predecessors to its successors.
 */
export function removeNodeFromFlow(
	nodes: DiagramNode[],
	nodeId: string,
): ConnectionPatch[] {
	const nodeMap = buildNodeMap(nodes);
	const incoming = buildIncomingMap(nodes);
	const node = nodeMap.get(nodeId);
	if (!node) return [];

	const patches: ConnectionPatch[] = [];
	const predecessors = incoming.get(nodeId) || new Set();

	for (const predId of predecessors) {
		const pred = nodeMap.get(predId);
		if (!pred) continue;

		const idx = pred.connections.indexOf(nodeId);
		if (idx < 0) continue;

		// Replace the connection to the removed node with the removed node's connections
		const newConns = [...pred.connections];
		const newLabels = pred.connectionLabels ? [...pred.connectionLabels] : undefined;

		newConns.splice(idx, 1, ...node.connections);
		if (newLabels && node.connectionLabels) {
			newLabels.splice(idx, 1, ...node.connectionLabels);
		} else if (newLabels) {
			newLabels.splice(idx, 1, ...node.connections.map(() => ""));
		}

		patches.push({ nodeId: predId, connections: newConns, connectionLabels: newLabels });
	}

	// The removed node itself gets empty connections
	patches.push({ nodeId, connections: [], connectionLabels: [] });

	return patches;
}
