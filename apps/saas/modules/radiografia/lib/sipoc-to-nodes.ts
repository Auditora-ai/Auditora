/**
 * SIPOC to DiagramNode Mapper
 *
 * Converts SipocData into DiagramNode[] that buildBpmnXml() can render.
 * All nodes are created as "confirmed" state (no accept/reject in onboarding).
 */

import type { EnrichedSipocData } from "./sipoc-to-knowledge";

export interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
	connectionLabels?: string[];
}

export function sipocToNodes(sipoc: EnrichedSipocData): DiagramNode[] {
	const nodes: DiagramNode[] = [];
	const sortedSteps = [...sipoc.processSteps].sort(
		(a, b) => a.order - b.order,
	);

	if (sortedSteps.length === 0) return nodes;

	// Determine default lane from first supplier or "Proceso"
	const defaultLane =
		sipoc.suppliers[0]?.name || "Proceso";

	// Start event
	const startId = "start_1";
	const startLabel =
		sipoc.inputs[0]?.name || "Inicio";
	nodes.push({
		id: startId,
		type: "startEvent",
		label: startLabel,
		state: "confirmed",
		lane: defaultLane,
		connections: [],
	});

	// Task nodes from process steps
	let previousId = startId;
	for (let i = 0; i < sortedSteps.length; i++) {
		const step = sortedSteps[i]!;
		const nodeId = `task_${i + 1}`;
		const lane = step.role || defaultLane;

		// If step has a decision, create a gateway instead
		if (step.hasDecision && i < sortedSteps.length - 1) {
			const gwId = `gw_${i + 1}`;
			nodes.push({
				id: gwId,
				type: "exclusiveGateway",
				label: step.label,
				state: "confirmed",
				lane,
				connections: [],
			});

			// Connect previous to gateway
			const prev = nodes.find((n) => n.id === previousId);
			if (prev) prev.connections.push(gwId);

			previousId = gwId;
		} else {
			nodes.push({
				id: nodeId,
				type: "task",
				label: step.label,
				state: "confirmed",
				lane,
				connections: [],
			});

			// Connect previous to this task
			const prev = nodes.find((n) => n.id === previousId);
			if (prev) prev.connections.push(nodeId);

			previousId = nodeId;
		}
	}

	// End event
	const endId = "end_1";
	const endLabel =
		sipoc.outputs[0]?.name || "Fin";
	nodes.push({
		id: endId,
		type: "endEvent",
		label: endLabel,
		state: "confirmed",
		lane: defaultLane,
		connections: [],
	});

	// Connect last node to end
	const lastNode = nodes.find((n) => n.id === previousId);
	if (lastNode) lastNode.connections.push(endId);

	return nodes;
}
