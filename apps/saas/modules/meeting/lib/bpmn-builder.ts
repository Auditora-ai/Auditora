/**
 * BPMN XML Builder
 *
 * Converts DiagramNode[] -> valid BPMN 2.0 XML with:
 * - Pool with horizontal lanes (one per role/department)
 * - Tasks, gateways, events with proper branching
 * - Sequence flows preserving the LLM's connection graph
 * - Topological layout that handles parallel/exclusive paths
 */

import type { DiagramNode } from "../types";
import {
	TASK_W,
	TASK_H,
	GW_SIZE,
	EVENT_SIZE,
	LANE_H,
	X_GAP,
	Y_PAD,
	POOL_X,
	CONTENT_X,
} from "./layout-constants";
import { escapeHtml as esc } from "./html-utils";

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
		timer_event: "intermediateCatchEvent",
		timerevent: "intermediateCatchEvent",
		message_event: "intermediateCatchEvent",
		messageevent: "intermediateCatchEvent",
		signal_event: "intermediateCatchEvent",
		signalevent: "intermediateCatchEvent",
		conditional_event: "intermediateCatchEvent",
		conditionalevent: "intermediateCatchEvent",
		text_annotation: "textAnnotation",
		textannotation: "textAnnotation",
		data_object: "dataObjectReference",
		dataobject: "dataObjectReference",
	};
	return map[type.toLowerCase()] || "task";
}

export function dims(type: string) {
	const tag = bpmnTag(type);
	if (tag.includes("Gateway")) return { w: GW_SIZE, h: GW_SIZE };
	if (tag.includes("Event") || tag === "intermediateCatchEvent")
		return { w: EVENT_SIZE, h: EVENT_SIZE };
	if (tag === "subProcess") return { w: 120, h: 100 };
	if (tag === "textAnnotation") return { w: 100, h: 30 };
	if (tag === "dataObjectReference") return { w: 36, h: 50 };
	return { w: TASK_W, h: TASK_H };
}

/** Map bpmnTag output to the full bpmn: prefixed type */
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
 * Compute column (X position) for each node using longest-path-from-start.
 * This handles branching from gateways properly.
 */
function computeColumns(ordered: DiagramNode[]): Map<string, number> {
	const columns = new Map<string, number>();
	const idSet = new Set(ordered.map((n) => n.id));

	// Build adjacency: node -> targets
	const adj = new Map<string, string[]>();
	for (const n of ordered) {
		adj.set(
			n.id,
			n.connections.filter((c) => idSet.has(c)),
		);
	}

	// BFS/longest-path from _start
	columns.set("_start", 0);
	const queue = ["_start"];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (visited.has(current)) continue;
		visited.add(current);

		const currentCol = columns.get(current) || 0;
		const targets = adj.get(current) || [];

		for (const target of targets) {
			const existingCol = columns.get(target) || 0;
			const newCol = currentCol + 1;
			if (newCol > existingCol) {
				columns.set(target, newCol);
			}
			// Always re-enqueue to propagate longest path
			if (!visited.has(target)) {
				queue.push(target);
			}
		}
	}

	// Assign any unvisited nodes to the end
	for (const n of ordered) {
		if (!columns.has(n.id)) {
			columns.set(n.id, (columns.get("_end") || ordered.length - 1) - 1);
		}
	}

	return columns;
}

/**
 * Compute dynamic lane heights based on how many elements each lane has.
 * Professional BPMN: lanes expand to fit their content.
 */
function computeLaneHeights(
	ordered: DiagramNode[],
	lanes: string[],
	columns: Map<string, number>,
): Map<string, number> {
	const heights = new Map<string, number>();

	for (const lane of lanes) {
		// Count max nodes in any single column for this lane
		const colCounts = new Map<number, number>();
		for (const n of ordered) {
			if ((n.lane || "General") !== lane) continue;
			const col = columns.get(n.id) || 0;
			colCounts.set(col, (colCounts.get(col) || 0) + 1);
		}
		const maxInColumn = Math.max(1, ...colCounts.values());
		// Each element needs ~100px vertical space, min LANE_H
		const height = Math.max(LANE_H, maxInColumn * 110 + 60);
		heights.set(lane, height);
	}

	return heights;
}

/**
 * For nodes sharing the same column AND lane, offset them vertically
 * to avoid overlaps. Uses dynamic lane heights.
 */
function computeVerticalOffsets(
	ordered: DiagramNode[],
	columns: Map<string, number>,
	lanes: string[],
	laneHeights: Map<string, number>,
): Map<string, number> {
	const offsets = new Map<string, number>();
	const groups = new Map<string, string[]>();

	for (const n of ordered) {
		const col = columns.get(n.id) || 0;
		const lane = n.lane || "General";
		const key = `${col}:${lane}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(n.id);
	}

	for (const [key, ids] of groups) {
		const lane = key.split(":").slice(1).join(":");
		const laneH = laneHeights.get(lane) || LANE_H;

		if (ids.length <= 1) {
			for (const id of ids) offsets.set(id, 0);
			continue;
		}
		// Spread evenly within the lane height
		const spacing = Math.min(100, laneH / (ids.length + 1));
		for (let i = 0; i < ids.length; i++) {
			offsets.set(ids[i], spacing * (i + 1) - laneH / 2);
		}
	}

	return offsets;
}

export function buildBpmnXml(inputNodes: DiagramNode[]): string {
	const visible = inputNodes.filter((n) => n.state !== "rejected");
	if (visible.length === 0) return emptyXml();

	// Collect valid node IDs for connection filtering
	const validIds = new Set(visible.map((n) => n.id));

	// Collect lanes
	const lanes = [...new Set(visible.map((n) => n.lane || "General"))];

	// Build ordered node list with start/end events
	const ordered: DiagramNode[] = [];

	ordered.push({
		id: "_start",
		type: "start_event",
		label: "Inicio",
		state: "confirmed",
		lane: lanes[0],
		connections: [],
	});

	// Add visible nodes (filter out any start/end events from LLM since we add our own)
	for (const n of visible) {
		const tag = bpmnTag(n.type);
		if (tag === "startEvent" || tag === "endEvent") continue;
		ordered.push({
			...n,
			// Remove connections to non-existent nodes
			connections: n.connections.filter((c) => validIds.has(c)),
		});
	}

	ordered.push({
		id: "_end",
		type: "end_event",
		label: "Fin",
		state: "confirmed",
		lane: lanes[lanes.length - 1] || "General",
		connections: [],
	});

	// --- Check if connections are mostly broken (AI ID mismatch) ---
	const middleNodes = ordered.filter(
		(n) => n.id !== "_start" && n.id !== "_end",
	);
	const totalConnections = middleNodes.reduce((sum, n) => sum + n.connections.length, 0);

	// If less than 30% of middle nodes have valid connections,
	// connections are broken — fall back to sequential order
	if (middleNodes.length >= 2 && totalConnections < middleNodes.length * 0.3) {
		console.log(`[bpmn-builder] Broken connections detected (${totalConnections}/${middleNodes.length}). Using sequential order.`);
		// Wire nodes sequentially: first → second → third → ...
		for (let i = 0; i < middleNodes.length - 1; i++) {
			middleNodes[i].connections = [middleNodes[i + 1].id];
		}
		// Last middle node → end
		middleNodes[middleNodes.length - 1].connections = ["_end"];
		// Start → first middle node
		ordered[0].connections = [middleNodes[0].id];
	} else {
		// --- Wire start/end based on actual graph topology ---

		// Build incoming-connections map
		const incoming = new Map<string, string[]>();
		for (const n of ordered) {
			if (n.id === "_start" || n.id === "_end") continue;
			for (const target of n.connections) {
				if (!incoming.has(target)) incoming.set(target, []);
				incoming.get(target)!.push(n.id);
			}
		}

		// Root nodes: no other node connects TO them
		const roots = middleNodes.filter((n) => !incoming.has(n.id));

		// If there are no roots, connect start to the first middle node
		if (roots.length === 0 && middleNodes.length > 0) {
			ordered[0].connections = [middleNodes[0].id];
		} else {
			ordered[0].connections = roots.map((r) => r.id);
		}

		// Terminal nodes: they have no outgoing connections
		const terminals = middleNodes.filter((n) => n.connections.length === 0);
		for (const t of terminals) {
			t.connections = ["_end"];
		}
	}

	// --- Compute layout ---

	const columns = computeColumns(ordered);
	const laneHeights = computeLaneHeights(ordered, lanes, columns);
	const verticalOffsets = computeVerticalOffsets(ordered, columns, lanes, laneHeights);

	// Find max column to compute total width
	let maxCol = 0;
	for (const col of columns.values()) {
		if (col > maxCol) maxCol = col;
	}

	// Compute cumulative lane Y positions
	const laneYStart = new Map<string, number>();
	let cumulativeY = Y_PAD;
	for (const lane of lanes) {
		laneYStart.set(lane, cumulativeY);
		cumulativeY += laneHeights.get(lane) || LANE_H;
	}

	// Build XML
	const totalW = CONTENT_X + (maxCol + 1) * X_GAP + 100;
	const totalH = cumulativeY + Y_PAD;

	let processXml = "";
	let flowsXml = "";
	let shapesXml = "";
	let edgesXml = "";
	let flowId = 0;

	// Lane set
	let laneSetXml = "    <bpmn:laneSet>\n";
	for (let li = 0; li < lanes.length; li++) {
		const laneName = lanes[li];
		const refs = ordered
			.filter((n) => (n.lane || "General") === laneName)
			.map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
			.join("\n");
		laneSetXml += `      <bpmn:lane id="Lane_${li}" name="${esc(laneName)}">\n${refs}\n      </bpmn:lane>\n`;

		const laneH = laneHeights.get(laneName) || LANE_H;
		const laneY = laneYStart.get(laneName) || (Y_PAD + li * LANE_H);
		shapesXml += `    <bpmndi:BPMNShape id="Lane_${li}_di" bpmnElement="Lane_${li}" isHorizontal="true">
      <dc:Bounds x="${CONTENT_X - 130}" y="${laneY}" width="${totalW - CONTENT_X + 130}" height="${laneH}" />
    </bpmndi:BPMNShape>\n`;
	}
	laneSetXml += "    </bpmn:laneSet>\n";

	// Elements + shapes + flows
	for (const n of ordered) {
		const tag = bpmnTag(n.type);
		const d = dims(n.type);
		const laneName = n.lane || "General";
		const laneH = laneHeights.get(laneName) || LANE_H;
		const laneY = laneYStart.get(laneName) || Y_PAD;
		const col = columns.get(n.id) || 0;
		const yOffset = verticalOffsets.get(n.id) || 0;
		const x = CONTENT_X + col * X_GAP;
		const y = laneY + (laneH - d.h) / 2 + yOffset;

		// Element XML with incoming/outgoing refs
		const nameAttr = n.label ? ` name="${esc(n.label)}"` : "";

		// Collect outgoing flow IDs for this node
		const outFlowIds: string[] = [];
		for (let fi = 0; fi < n.connections.length; fi++) {
			outFlowIds.push(`flow_${flowId + fi + 1}`);
		}

		// Collect incoming flow IDs for this node
		const inFlowIds: string[] = [];
		// We'll track these as we generate flows below — for now, build element XML
		// with outgoing refs only (incoming refs are added via a second pass or omitted,
		// since bpmn-js reconstructs them from the flow definitions)

		if (outFlowIds.length > 0) {
			const outRefs = outFlowIds
				.map((fid) => `      <bpmn:outgoing>${fid}</bpmn:outgoing>`)
				.join("\n");
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr}>\n${outRefs}\n    </bpmn:${tag}>\n`;
		} else {
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr} />\n`;
		}

		// Shape
		shapesXml += `    <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}">
      <dc:Bounds x="${x}" y="${y}" width="${d.w}" height="${d.h}" />
    </bpmndi:BPMNShape>\n`;

		// Flows
		for (let ci = 0; ci < n.connections.length; ci++) {
			const targetId = n.connections[ci];
			flowId++;
			const fid = `flow_${flowId}`;
			const target = ordered.find((t) => t.id === targetId);
			if (!target) continue;

			const td = dims(target.type);
			const tLaneName = target.lane || "General";
			const tLaneH = laneHeights.get(tLaneName) || LANE_H;
			const tLaneY = laneYStart.get(tLaneName) || Y_PAD;
			const tCol = columns.get(target.id) || 0;
			const tYOffset = verticalOffsets.get(target.id) || 0;
			const tx = CONTENT_X + tCol * X_GAP;
			const ty = tLaneY + (tLaneH - td.h) / 2 + tYOffset;

			// Add flow condition label (name) for gateway outgoing flows
			const condLabel = (n as any).connectionLabels?.[ci];
			const nameAttr = condLabel ? ` name="${esc(condLabel)}"` : "";
			flowsXml += `    <bpmn:sequenceFlow id="${fid}"${nameAttr} sourceRef="${n.id}" targetRef="${targetId}" />\n`;

			// Orthogonal routing (Manhattan — right angles only)
			const sx = x + d.w;          // source: right edge
			const sy = y + d.h / 2;      // source: vertical center
			const ex = tx;               // target: left edge
			const ey = ty + td.h / 2;    // target: vertical center

			let waypoints: string;
			if (Math.abs(sy - ey) < 5) {
				// Same Y — straight horizontal line
				waypoints = `      <di:waypoint x="${sx}" y="${sy}" />\n      <di:waypoint x="${ex}" y="${ey}" />`;
			} else {
				// Different Y — orthogonal L-shape or Z-shape routing
				const midX = Math.round((sx + ex) / 2);
				waypoints = `      <di:waypoint x="${sx}" y="${sy}" />\n      <di:waypoint x="${midX}" y="${sy}" />\n      <di:waypoint x="${midX}" y="${ey}" />\n      <di:waypoint x="${ex}" y="${ey}" />`;
			}
			edgesXml += `    <bpmndi:BPMNEdge id="${fid}_di" bpmnElement="${fid}">\n${waypoints}\n    </bpmndi:BPMNEdge>\n`;
		}
	}

	// Pool shape
	shapesXml =
		`    <bpmndi:BPMNShape id="Pool_di" bpmnElement="Pool" isHorizontal="true">
      <dc:Bounds x="${POOL_X}" y="${Y_PAD}" width="${totalW}" height="${totalH - Y_PAD}" />
    </bpmndi:BPMNShape>\n` + shapesXml;

	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collab">
    <bpmn:participant id="Pool" name="Process" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
${laneSetXml}${processXml}${flowsXml}  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collab">
${shapesXml}${edgesXml}    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
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
