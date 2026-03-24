/**
 * BPMN Diagram Validator
 *
 * Validates DiagramNode[] for structural and logical problems
 * BEFORE they're rendered as BPMN XML. Returns warnings that
 * can be displayed to the user or used to trigger auto-repair.
 */

import type { DiagramNode } from "../types";

export interface DiagramWarning {
	type: "orphan" | "cycle" | "duplicate" | "dead_end" | "missing_connection" | "invalid_ref";
	nodeId: string;
	message: string;
	severity: "info" | "warning" | "error";
}

export interface ValidationResult {
	valid: boolean;
	warnings: DiagramWarning[];
	/** True if the diagram has problems severe enough to warrant auto-repair */
	needsRepair: boolean;
}

/**
 * Validate diagram nodes for common structural problems.
 */
export function validateDiagram(inputNodes: DiagramNode[]): ValidationResult {
	const nodes = inputNodes.filter((n) => n.state !== "rejected");
	const warnings: DiagramWarning[] = [];
	const nodeMap = new Map(nodes.map((n) => [n.id, n]));
	const nodeIds = new Set(nodes.map((n) => n.id));

	// 1. Check for invalid connection references
	for (const node of nodes) {
		for (const targetId of node.connections) {
			if (!nodeIds.has(targetId)) {
				warnings.push({
					type: "invalid_ref",
					nodeId: node.id,
					message: `"${node.label}" connects to non-existent node "${targetId}"`,
					severity: "warning",
				});
			}
		}
	}

	// 2. Check for orphaned nodes (no incoming + no outgoing)
	const hasIncoming = new Set<string>();
	for (const node of nodes) {
		for (const targetId of node.connections) {
			hasIncoming.add(targetId);
		}
	}
	for (const node of nodes) {
		if (node.connections.length === 0 && !hasIncoming.has(node.id) && nodes.length > 1) {
			warnings.push({
				type: "orphan",
				nodeId: node.id,
				message: `"${node.label}" is disconnected from the process flow`,
				severity: "warning",
			});
		}
	}

	// 3. Check for dead ends (has incoming but no outgoing, not a typical end)
	for (const node of nodes) {
		if (
			node.connections.length === 0 &&
			hasIncoming.has(node.id) &&
			node.type !== "end_event" &&
			node.type !== "endEvent"
		) {
			// Only warn if there are other nodes that do have connections
			const hasFlowingNodes = nodes.some((n) => n.connections.length > 0);
			if (hasFlowingNodes) {
				warnings.push({
					type: "dead_end",
					nodeId: node.id,
					message: `"${node.label}" is a dead end (no outgoing connections)`,
					severity: "info",
				});
			}
		}
	}

	// 4. Check for duplicate nodes (same label + type + lane)
	const seen = new Map<string, string>(); // key -> first node id
	for (const node of nodes) {
		const key = `${node.label.toLowerCase().trim()}|${node.type}|${(node.lane || "").toLowerCase().trim()}`;
		const existing = seen.get(key);
		if (existing) {
			warnings.push({
				type: "duplicate",
				nodeId: node.id,
				message: `"${node.label}" appears to be a duplicate of node "${existing}"`,
				severity: "warning",
			});
		} else {
			seen.set(key, node.id);
		}
	}

	// 5. Check for simple cycles (A→B→A without a gateway in between)
	for (const node of nodes) {
		for (const targetId of node.connections) {
			const target = nodeMap.get(targetId);
			if (target && target.connections.includes(node.id)) {
				const isGateway =
					node.type.includes("gateway") ||
					node.type.includes("Gateway") ||
					target.type.includes("gateway") ||
					target.type.includes("Gateway");
				if (!isGateway) {
					warnings.push({
						type: "cycle",
						nodeId: node.id,
						message: `Circular flow between "${node.label}" and "${target.label}" without a gateway`,
						severity: "error",
					});
				}
			}
		}
	}

	const errorCount = warnings.filter((w) => w.severity === "error").length;
	const warningCount = warnings.filter((w) => w.severity === "warning").length;

	return {
		valid: errorCount === 0,
		warnings,
		needsRepair: errorCount > 0 || warningCount >= 3,
	};
}
