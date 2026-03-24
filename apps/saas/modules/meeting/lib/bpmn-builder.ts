/**
 * BPMN XML Builder
 *
 * Converts DiagramNode[] → valid BPMN 2.0 XML.
 *
 * ARCHITECTURE:
 * 1. This module generates semantic BPMN XML (process structure only, NO coordinates)
 * 2. bpmn-auto-layout adds professional DI (diagram interchange) with proper
 *    orthogonal routing, spacing, and lane distribution
 *
 * This separation means we only care about correct BPMN structure here —
 * layout is handled by the same engine that powers bpmn.io's professional tools.
 */

import type { DiagramNode } from "../types";
import { escapeHtml as esc } from "./html-utils";

// Re-export layout constants for useBpmnModeler incremental placement
export { TASK_W, TASK_H, GW_SIZE, EVENT_SIZE, LANE_H, X_GAP, Y_PAD, POOL_X, CONTENT_X } from "./layout-constants";

export function bpmnTag(type: string): string {
	const map: Record<string, string> = {
		task: "task",
		user_task: "userTask",
		usertask: "userTask",
		service_task: "serviceTask",
		servicetask: "serviceTask",
		manual_task: "manualTask",
		manualtask: "manualTask",
		business_rule_task: "businessRuleTask",
		businessruletask: "businessRuleTask",
		subprocess: "subProcess",
		sub_process: "subProcess",
		start_event: "startEvent",
		startevent: "startEvent",
		end_event: "endEvent",
		endevent: "endEvent",
		exclusive_gateway: "exclusiveGateway",
		exclusivegateway: "exclusiveGateway",
		parallel_gateway: "parallelGateway",
		parallelgateway: "parallelGateway",
		intermediate_event: "intermediateCatchEvent",
		intermediateevent: "intermediateCatchEvent",
		timer_event: "intermediateCatchEvent",
		timerevent: "intermediateCatchEvent",
		message_event: "intermediateCatchEvent",
		messageevent: "intermediateCatchEvent",
		text_annotation: "textAnnotation",
		textannotation: "textAnnotation",
		data_object: "dataObjectReference",
		dataobject: "dataObjectReference",
	};
	return map[type.toLowerCase()] || "task";
}

export function dims(type: string) {
	const tag = bpmnTag(type);
	if (tag.includes("Gateway")) return { w: 50, h: 50 };
	if (tag.includes("Event") || tag === "intermediateCatchEvent")
		return { w: 36, h: 36 };
	if (tag === "subProcess") return { w: 120, h: 100 };
	return { w: 160, h: 80 };
}

export function bpmnType(type: string): string {
	const tag = bpmnTag(type);
	const map: Record<string, string> = {
		task: "bpmn:Task",
		userTask: "bpmn:UserTask",
		serviceTask: "bpmn:ServiceTask",
		manualTask: "bpmn:ManualTask",
		businessRuleTask: "bpmn:BusinessRuleTask",
		subProcess: "bpmn:SubProcess",
		startEvent: "bpmn:StartEvent",
		endEvent: "bpmn:EndEvent",
		exclusiveGateway: "bpmn:ExclusiveGateway",
		parallelGateway: "bpmn:ParallelGateway",
		intermediateCatchEvent: "bpmn:IntermediateCatchEvent",
		textAnnotation: "bpmn:TextAnnotation",
		dataObjectReference: "bpmn:DataObjectReference",
	};
	return map[tag] || "bpmn:Task";
}

/**
 * Build BPMN 2.0 XML from DiagramNode array.
 *
 * Generates semantic XML WITHOUT diagram interchange (DI).
 * Call layoutBpmnXml() on the result to add professional layout.
 */
export function buildBpmnXml(inputNodes: DiagramNode[]): string {
	// Filter: no rejected, no orphans without connections AND without incoming
	let visible = inputNodes.filter((n) => n.state !== "rejected");
	if (visible.length === 0) return emptyXml();

	// Remove completely disconnected nodes (no connections AND no other node points to them)
	const allConnTargets = new Set(visible.flatMap((n) => n.connections));
	visible = visible.filter((n) => {
		const tag = bpmnTag(n.type);
		// Always keep start/end events
		if (tag === "startEvent" || tag === "endEvent") return true;
		// Keep if node has connections OR is targeted by another node
		return n.connections.length > 0 || allConnTargets.has(n.id);
	});

	const validIds = new Set(visible.map((n) => n.id));
	const lanes = [...new Set(visible.map((n) => n.lane || "General"))];

	// Sanitize node IDs for XML (must be valid NCName: no special chars)
	const idMap = new Map<string, string>();
	let idCounter = 0;
	function safeId(originalId: string): string {
		if (idMap.has(originalId)) return idMap.get(originalId)!;
		// Keep simple IDs, replace complex ones
		const safe = /^[a-zA-Z_][\w.-]*$/.test(originalId)
			? originalId
			: `node_${idCounter++}`;
		idMap.set(originalId, safe);
		return safe;
	}

	// Build ordered node list with auto start/end
	const ordered: DiagramNode[] = [];

	ordered.push({
		id: safeId("_start"),
		type: "start_event",
		label: "Inicio",
		state: "confirmed",
		lane: lanes[0],
		connections: [],
	});

	// Collect IDs of LLM start/end events (we add our own _start/_end)
	const skippedIds = new Set<string>();
	for (const n of visible) {
		const tag = bpmnTag(n.type);
		if (tag === "startEvent" || tag === "endEvent") {
			skippedIds.add(n.id);
		}
	}

	// Add visible nodes (skip LLM start/end events)
	for (const n of visible) {
		const tag = bpmnTag(n.type);
		if (tag === "startEvent" || tag === "endEvent") continue;
		ordered.push({
			...n,
			id: safeId(n.id),
			// Filter connections: remove refs to skipped events, replace with _end/_start
			connections: n.connections
				.map((c) => {
					if (skippedIds.has(c)) {
						// This connected to a LLM end event → connect to our _end
						const skippedNode = visible.find((v) => v.id === c);
						if (skippedNode && bpmnTag(skippedNode.type) === "endEvent") return safeId("_end");
						if (skippedNode && bpmnTag(skippedNode.type) === "startEvent") return safeId("_start");
						return null;
					}
					return validIds.has(c) ? safeId(c) : null;
				})
				.filter((c): c is string => c !== null),
		});
	}

	// Add end event
	ordered.push({
		id: safeId("_end"),
		type: "end_event",
		label: "Fin",
		state: "confirmed",
		lane: lanes[lanes.length - 1] || "General",
		connections: [],
	});

	// --- Wire connections ---
	const middleNodes = ordered.filter(
		(n) => n.id !== "_start" && n.id !== "_end",
	);
	const totalConnections = middleNodes.reduce((sum, n) => sum + n.connections.length, 0);

	if (middleNodes.length >= 2 && totalConnections < middleNodes.length * 0.3) {
		// Broken connections — sequential fallback
		for (let i = 0; i < middleNodes.length - 1; i++) {
			middleNodes[i].connections = [middleNodes[i + 1].id];
		}
		middleNodes[middleNodes.length - 1].connections = ["_end"];
		ordered[0].connections = [middleNodes[0].id];
	} else if (middleNodes.length === 0) {
		ordered[0].connections = ["_end"];
	} else {
		// Wire start/end based on graph topology
		const incoming = new Map<string, string[]>();
		for (const n of ordered) {
			if (n.id === "_start" || n.id === "_end") continue;
			for (const target of n.connections) {
				if (!incoming.has(target)) incoming.set(target, []);
				incoming.get(target)!.push(n.id);
			}
		}

		const roots = middleNodes.filter((n) => !incoming.has(n.id));
		if (roots.length === 0) {
			ordered[0].connections = [middleNodes[0].id];
		} else {
			// Start → first root only (BPMN rule: 1 output from events)
			ordered[0].connections = [roots[0].id];
			// Chain remaining roots sequentially
			for (let i = 1; i < roots.length; i++) {
				const prev = findLastInChain(roots[i - 1], ordered);
				if (prev && !prev.type.toLowerCase().includes("gateway")) {
					prev.connections = prev.connections.filter(c => c !== "_end");
					prev.connections.push(roots[i].id);
				}
			}
		}

		// Terminal nodes → end
		for (const t of middleNodes) {
			if (t.connections.length === 0) {
				t.connections = ["_end"];
			}
		}
	}

	// --- BPMN Rule Enforcement ---
	for (const n of ordered) {
		// Tasks/events: max 1 output
		if (n.connections.length > 1 && !n.type.toLowerCase().includes("gateway")) {
			n.connections = [n.connections[0]];
		}
	}

	// Break cycles: if A → B → ... → A, remove the back-edge
	const visited = new Set<string>();
	const inStack = new Set<string>();
	function breakCycles(nodeId: string) {
		if (inStack.has(nodeId)) return; // cycle detected, already handled
		if (visited.has(nodeId)) return;
		visited.add(nodeId);
		inStack.add(nodeId);
		const node = ordered.find((n) => n.id === nodeId);
		if (node) {
			node.connections = node.connections.filter((targetId) => {
				if (inStack.has(targetId)) {
					// Back-edge — break the cycle
					return false;
				}
				return true;
			});
			for (const targetId of node.connections) {
				breakCycles(targetId);
			}
		}
		inStack.delete(nodeId);
	}
	breakCycles(ordered[0].id);

	// --- Generate semantic XML (NO DI coordinates) ---
	let processXml = "";
	let flowsXml = "";
	let flowId = 0;

	// Lane set
	let laneSetXml = "    <bpmn:laneSet>\n";
	for (let li = 0; li < lanes.length; li++) {
		const refs = ordered
			.filter((n) => (n.lane || "General") === lanes[li])
			.map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
			.join("\n");
		laneSetXml += `      <bpmn:lane id="Lane_${li}" name="${esc(lanes[li])}">\n${refs}\n      </bpmn:lane>\n`;
	}
	laneSetXml += "    </bpmn:laneSet>\n";

	// Elements + flows
	for (const n of ordered) {
		const tag = bpmnTag(n.type);
		const nameAttr = n.label ? ` name="${esc(n.label)}"` : "";

		// Element XML
		if (n.connections.length > 0) {
			const outRefs = n.connections
				.map((_, i) => `      <bpmn:outgoing>flow_${flowId + i + 1}</bpmn:outgoing>`)
				.join("\n");
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr}>\n${outRefs}\n    </bpmn:${tag}>\n`;
		} else {
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr} />\n`;
		}

		// Sequence flows
		for (let ci = 0; ci < n.connections.length; ci++) {
			const targetId = n.connections[ci];
			flowId++;
			const fid = `flow_${flowId}`;
			const condLabel = (n as any).connectionLabels?.[ci];
			const condAttr = condLabel ? ` name="${esc(condLabel)}"` : "";
			flowsXml += `    <bpmn:sequenceFlow id="${fid}"${condAttr} sourceRef="${n.id}" targetRef="${targetId}" />\n`;
		}
	}

	// Generate XML with minimal empty DI (bpmn-auto-layout will fill it)
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
${laneSetXml}${processXml}${flowsXml}  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

/**
 * Apply professional auto-layout to BPMN XML.
 * Uses bpmn-auto-layout (from bpmn.io) to add DI with proper
 * orthogonal routing, lane spacing, and element distribution.
 */
/**
 * Apply professional auto-layout to BPMN XML via server-side API.
 * bpmn-auto-layout requires bpmn-moddle which only works in Node.js.
 */
export async function layoutBpmnXml(xml: string): Promise<string> {
	try {
		// Server-side: import directly
		if (typeof window === "undefined") {
			const { layoutProcess } = await import("bpmn-auto-layout");
			return await layoutProcess(xml);
		}

		// Client-side: call the server API
		const res = await fetch("/api/bpmn/layout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ xml }),
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			console.warn("[bpmn-builder] Layout API returned", res.status);
			return data.xml || xml; // API returns raw xml on 422
		}

		const data = await res.json();
		return data.xml;
	} catch (err) {
		console.warn("[bpmn-builder] Auto-layout failed, using raw XML:", err);
		return xml;
	}
}

function findLastInChain(startNode: DiagramNode, allNodes: DiagramNode[]): DiagramNode | null {
	let current = startNode;
	const visited = new Set<string>();
	while (current.connections.length === 1 && !visited.has(current.id)) {
		visited.add(current.id);
		const nextId = current.connections[0];
		if (nextId === "_end") return current;
		const next = allNodes.find((n) => n.id === nextId);
		if (!next) return current;
		current = next;
	}
	return current;
}

function emptyXml(): string {
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
