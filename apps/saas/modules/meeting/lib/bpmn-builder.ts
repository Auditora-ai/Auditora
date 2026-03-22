/**
 * BPMN XML Builder
 *
 * Converts DiagramNode[] → valid BPMN 2.0 XML with:
 * - Pool with horizontal lanes (one per role/department)
 * - Tasks, gateways, events
 * - Sequence flows connecting all elements
 * - Auto-layout with proper positioning
 */

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

const TASK_W = 100;
const TASK_H = 80;
const GW_SIZE = 50;
const EVENT_SIZE = 36;
const LANE_H = 150;
const X_GAP = 180;
const Y_PAD = 50;
const POOL_X = 0;
const CONTENT_X = 160;

function bpmnTag(type: string): string {
	const map: Record<string, string> = {
		task: "task",
		start_event: "startEvent",
		startevent: "startEvent",
		end_event: "endEvent",
		endevent: "endEvent",
		exclusive_gateway: "exclusiveGateway",
		exclusivegateway: "exclusiveGateway",
		parallel_gateway: "parallelGateway",
		parallelgateway: "parallelGateway",
	};
	return map[type.toLowerCase()] || "task";
}

function dims(type: string) {
	const tag = bpmnTag(type);
	if (tag.includes("Gateway")) return { w: GW_SIZE, h: GW_SIZE };
	if (tag.includes("Event")) return { w: EVENT_SIZE, h: EVENT_SIZE };
	return { w: TASK_W, h: TASK_H };
}

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildBpmnXml(inputNodes: DiagramNode[]): string {
	const visible = inputNodes.filter((n) => n.state !== "rejected");
	if (visible.length === 0) return emptyXml();

	// Collect valid node IDs for connection filtering
	const validIds = new Set(visible.map((n) => n.id));

	// Collect lanes
	const lanes = [...new Set(visible.map((n) => n.lane || "General"))];

	// Build ordered node list: start → tasks/gateways → end
	// Always add start and end events
	const ordered: DiagramNode[] = [];

	ordered.push({
		id: "_start",
		type: "start_event",
		label: "",
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
		label: "",
		state: "confirmed",
		lane: lanes[lanes.length - 1] || "General",
		connections: [],
	});

	// Create sequential connections: each node → next node
	// This ensures the diagram always has a connected flow
	for (let i = 0; i < ordered.length - 1; i++) {
		ordered[i].connections = [ordered[i + 1].id];
	}

	// Build XML
	const totalW = CONTENT_X + ordered.length * X_GAP + 60;
	const totalH = lanes.length * LANE_H + Y_PAD * 2;

	let processXml = "";
	let flowsXml = "";
	let shapesXml = "";
	let edgesXml = "";
	let flowId = 0;

	// Lane set
	let laneSetXml = "    <bpmn:laneSet>\n";
	for (let li = 0; li < lanes.length; li++) {
		const refs = ordered
			.filter((n) => (n.lane || "General") === lanes[li])
			.map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
			.join("\n");
		laneSetXml += `      <bpmn:lane id="Lane_${li}" name="${esc(lanes[li])}">\n${refs}\n      </bpmn:lane>\n`;

		// Lane shape
		shapesXml += `    <bpmndi:BPMNShape id="Lane_${li}_di" bpmnElement="Lane_${li}" isHorizontal="true">
      <dc:Bounds x="${CONTENT_X - 130}" y="${Y_PAD + li * LANE_H}" width="${totalW - CONTENT_X + 130}" height="${LANE_H}" />
    </bpmndi:BPMNShape>\n`;
	}
	laneSetXml += "    </bpmn:laneSet>\n";

	// Elements + shapes + flows
	for (let i = 0; i < ordered.length; i++) {
		const n = ordered[i];
		const tag = bpmnTag(n.type);
		const d = dims(n.type);
		const li = lanes.indexOf(n.lane || "General");
		const x = CONTENT_X + i * X_GAP;
		const y = Y_PAD + li * LANE_H + (LANE_H - d.h) / 2;

		// Element XML
		const nameAttr = n.label ? ` name="${esc(n.label)}"` : "";
		if (n.connections.length > 0) {
			const outRefs = n.connections.map((_, fi) => {
				const fid = `flow_${flowId + fi + 1}`;
				return `      <bpmn:outgoing>${fid}</bpmn:outgoing>`;
			}).join("\n");
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr}>\n${outRefs}\n    </bpmn:${tag}>\n`;
		} else {
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr} />\n`;
		}

		// Shape
		shapesXml += `    <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}">
      <dc:Bounds x="${x}" y="${y}" width="${d.w}" height="${d.h}" />
    </bpmndi:BPMNShape>\n`;

		// Flows
		for (const targetId of n.connections) {
			flowId++;
			const fid = `flow_${flowId}`;
			const ti = ordered.findIndex((t) => t.id === targetId);
			if (ti === -1) continue;

			const target = ordered[ti];
			const td = dims(target.type);
			const tli = lanes.indexOf(target.lane || "General");
			const tx = CONTENT_X + ti * X_GAP;
			const ty = Y_PAD + tli * LANE_H + (LANE_H - td.h) / 2;

			flowsXml += `    <bpmn:sequenceFlow id="${fid}" sourceRef="${n.id}" targetRef="${targetId}" />\n`;
			edgesXml += `    <bpmndi:BPMNEdge id="${fid}_di" bpmnElement="${fid}">
      <di:waypoint x="${x + d.w}" y="${y + d.h / 2}" />
      <di:waypoint x="${tx}" y="${ty + td.h / 2}" />
    </bpmndi:BPMNEdge>\n`;
		}
	}

	// Pool shape
	shapesXml = `    <bpmndi:BPMNShape id="Pool_di" bpmnElement="Pool" isHorizontal="true">
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
