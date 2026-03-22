/**
 * BPMN XML Builder
 *
 * Converts an array of DiagramNodes into valid BPMN 2.0 XML
 * with lanes, tasks, gateways, events, and sequence flows.
 */

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

const ELEMENT_WIDTH = 100;
const ELEMENT_HEIGHT = 80;
const GATEWAY_SIZE = 50;
const EVENT_SIZE = 36;
const LANE_HEIGHT = 150;
const X_SPACING = 180;
const Y_PADDING = 40;
const LANE_LABEL_WIDTH = 30;

function getElementDimensions(type: string) {
	if (type.includes("gateway") || type.includes("Gateway")) {
		return { w: GATEWAY_SIZE, h: GATEWAY_SIZE };
	}
	if (type.includes("event") || type.includes("Event")) {
		return { w: EVENT_SIZE, h: EVENT_SIZE };
	}
	return { w: ELEMENT_WIDTH, h: ELEMENT_HEIGHT };
}

function toBpmnType(type: string): string {
	const map: Record<string, string> = {
		task: "bpmn:Task",
		start_event: "bpmn:StartEvent",
		startevent: "bpmn:StartEvent",
		end_event: "bpmn:EndEvent",
		endevent: "bpmn:EndEvent",
		exclusive_gateway: "bpmn:ExclusiveGateway",
		exclusivegateway: "bpmn:ExclusiveGateway",
		parallel_gateway: "bpmn:ParallelGateway",
		parallelgateway: "bpmn:ParallelGateway",
	};
	return map[type.toLowerCase()] || "bpmn:Task";
}

export function buildBpmnXml(nodes: DiagramNode[]): string {
	const visibleNodes = nodes.filter((n) => n.state !== "rejected");

	if (visibleNodes.length === 0) {
		return getEmptyDiagram();
	}

	// Collect unique lanes
	const laneNames = [...new Set(visibleNodes.map((n) => n.lane || "General").filter(Boolean))];

	// Add start and end events if missing
	const hasStart = visibleNodes.some((n) => toBpmnType(n.type) === "bpmn:StartEvent");
	const hasEnd = visibleNodes.some((n) => toBpmnType(n.type) === "bpmn:EndEvent");

	const allNodes = [...visibleNodes];
	if (!hasStart) {
		allNodes.unshift({
			id: "_start",
			type: "start_event",
			label: "Start",
			state: "confirmed",
			lane: laneNames[0] || "General",
			connections: visibleNodes.length > 0 ? [visibleNodes[0].id] : [],
		});
	}
	if (!hasEnd) {
		allNodes.push({
			id: "_end",
			type: "end_event",
			label: "End",
			state: "confirmed",
			lane: laneNames[laneNames.length - 1] || "General",
			connections: [],
		});
		// Connect last non-end node to end
		const lastTask = [...allNodes].reverse().find(
			(n) => n.id !== "_end" && n.connections.length === 0,
		);
		if (lastTask) {
			lastTask.connections = ["_end"];
		}
	}

	// Build sequential connections if none exist
	let hasAnyConnections = allNodes.some((n) => n.connections.length > 0 && n.id !== "_start");
	if (!hasAnyConnections) {
		for (let i = 0; i < allNodes.length - 1; i++) {
			if (allNodes[i].connections.length === 0) {
				allNodes[i].connections = [allNodes[i + 1].id];
			}
		}
	}

	// Assign positions
	const laneMap = new Map<string, number>();
	laneNames.forEach((name, i) => laneMap.set(name, i));

	// Build BPMN process elements
	let processElements = "";
	let diagramElements = "";
	let sequenceFlows = "";
	let flowCounter = 0;

	// Lane set
	let laneSetXml = '      <bpmn:laneSet id="LaneSet_1">\n';
	for (const [laneName, laneIndex] of laneMap) {
		const nodeIds = allNodes
			.filter((n) => (n.lane || "General") === laneName)
			.map((n) => `          <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
			.join("\n");
		laneSetXml += `        <bpmn:lane id="Lane_${laneIndex}" name="${escapeXml(laneName)}">\n${nodeIds}\n        </bpmn:lane>\n`;
	}
	laneSetXml += "      </bpmn:laneSet>\n";

	// Process elements and shapes
	for (let i = 0; i < allNodes.length; i++) {
		const node = allNodes[i];
		const bpmnType = toBpmnType(node.type);
		const tagName = bpmnType.replace("bpmn:", "");
		const dims = getElementDimensions(node.type);
		const laneIndex = laneMap.get(node.lane || "General") || 0;

		const x = LANE_LABEL_WIDTH + 40 + i * X_SPACING;
		const y = Y_PADDING + laneIndex * LANE_HEIGHT + (LANE_HEIGHT - dims.h) / 2;

		// Outgoing flows
		const outgoing = node.connections
			.map((targetId) => {
				const flowId = `Flow_${++flowCounter}`;
				sequenceFlows += `      <bpmn:sequenceFlow id="${flowId}" sourceRef="${node.id}" targetRef="${targetId}" />\n`;

				// Flow edge in diagram
				const targetNode = allNodes.find((n) => n.id === targetId);
				if (targetNode) {
					const targetIndex = allNodes.indexOf(targetNode);
					const targetLaneIndex = laneMap.get(targetNode.lane || "General") || 0;
					const targetDims = getElementDimensions(targetNode.type);
					const tx = LANE_LABEL_WIDTH + 40 + targetIndex * X_SPACING;
					const ty = Y_PADDING + targetLaneIndex * LANE_HEIGHT + (LANE_HEIGHT - targetDims.h) / 2;

					diagramElements += `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${x + dims.w}" y="${y + dims.h / 2}" />
        <di:waypoint x="${tx}" y="${ty + targetDims.h / 2}" />
      </bpmndi:BPMNEdge>\n`;
				}

				return `        <bpmn:outgoing>${flowId}</bpmn:outgoing>`;
			})
			.join("\n");

		const outgoingXml = outgoing ? `\n${outgoing}\n      ` : "";

		if (bpmnType === "bpmn:Task") {
			processElements += `      <bpmn:task id="${node.id}" name="${escapeXml(node.label)}">${outgoingXml}</bpmn:task>\n`;
		} else if (bpmnType === "bpmn:StartEvent") {
			processElements += `      <bpmn:startEvent id="${node.id}" name="${escapeXml(node.label)}">${outgoingXml}</bpmn:startEvent>\n`;
		} else if (bpmnType === "bpmn:EndEvent") {
			processElements += `      <bpmn:endEvent id="${node.id}" name="${escapeXml(node.label)}" />\n`;
		} else if (bpmnType === "bpmn:ExclusiveGateway") {
			processElements += `      <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.label)}">${outgoingXml}</bpmn:exclusiveGateway>\n`;
		} else if (bpmnType === "bpmn:ParallelGateway") {
			processElements += `      <bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.label)}">${outgoingXml}</bpmn:parallelGateway>\n`;
		}

		// Shape in diagram
		diagramElements += `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${x}" y="${y}" width="${dims.w}" height="${dims.h}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;
	}

	// Lane shapes
	let laneShapes = "";
	const totalWidth = (allNodes.length + 1) * X_SPACING + LANE_LABEL_WIDTH + 80;
	for (const [laneName, laneIndex] of laneMap) {
		const laneY = Y_PADDING + laneIndex * LANE_HEIGHT - 10;
		laneShapes += `      <bpmndi:BPMNShape id="Lane_${laneIndex}_di" bpmnElement="Lane_${laneIndex}" isHorizontal="true">
        <dc:Bounds x="${LANE_LABEL_WIDTH}" y="${laneY}" width="${totalWidth - LANE_LABEL_WIDTH}" height="${LANE_HEIGHT}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;
	}

	// Participant shape (pool)
	const totalHeight = laneNames.length * LANE_HEIGHT + Y_PADDING * 2;
	const participantShape = `      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="0" y="${Y_PADDING - 10}" width="${totalWidth}" height="${totalHeight}" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>\n`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Process" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
${laneSetXml}${processElements}${sequenceFlows}  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
${participantShape}${laneShapes}${diagramElements}    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function getEmptyDiagram(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
