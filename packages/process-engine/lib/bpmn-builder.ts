/**
 * BPMN XML Builder
 *
 * Converts DiagramNode[] → valid BPMN 2.0 XML with professional layout.
 *
 * ARCHITECTURE:
 * 1. Build connection graph (sequential fallback, cycle breaking, BPMN rules)
 * 2. Convert to ELK graph (lanes as groups, nodes with dimensions)
 * 3. ELK computes coordinates (horizontal, orthogonal routing)
 * 4. Generate XML with Collaboration/Pool/Lanes + DI from ELK coordinates
 */

import type { DiagramNode } from "../types/index";
import { escapeHtml as esc } from "./html-utils";
import ELK from "elkjs/lib/elk.bundled.js";
import { ELK_BPMN_CONFIG, LANE_H, bpmnTag, dims, bpmnType } from "./layout-constants";
import { preprocessForElk, assignLaneYPositions } from "./bpmn-layout-preprocessor";

// Re-export layout constants for useBpmnModeler incremental placement
export { TASK_W, TASK_H, GW_SIZE, EVENT_SIZE, LANE_H, X_GAP, Y_PAD, POOL_X, CONTENT_X } from "./layout-constants";

const elk = new ELK();

// bpmnTag, dims, bpmnType are re-exported from layout-constants to avoid circular imports
export { bpmnTag, dims, bpmnType } from "./layout-constants";

/** Optional labels for BPMN start/end events. Defaults to empty (no label). */
interface BpmnBuildOptions {
	startLabel?: string;
	endLabel?: string;
}

/**
 * Build BPMN 2.0 XML with ELK-powered professional layout.
 */
export async function buildBpmnXml(inputNodes: DiagramNode[], options?: BpmnBuildOptions): Promise<string> {
	const startLabel = options?.startLabel ?? "";
	const endLabel = options?.endLabel ?? "";
	// --- Filter nodes ---
	let visible = inputNodes.filter((n) => n.state !== "rejected");
	if (visible.length === 0) return emptyXml();

	const allConnTargets = new Set(visible.flatMap((n) => n.connections));
	visible = visible.filter((n) => {
		const tag = bpmnTag(n.type);
		if (tag === "startEvent" || tag === "endEvent") return true;
		return n.connections.length > 0 || allConnTargets.has(n.id);
	});

	const validIds = new Set(visible.map((n) => n.id));
	const lanes = [...new Set(visible.map((n) => n.lane || "General"))];

	// Sanitize IDs
	const idMap = new Map<string, string>();
	let idCounter = 0;
	function safeId(originalId: string): string {
		if (idMap.has(originalId)) return idMap.get(originalId)!;
		const safe = /^[a-zA-Z_][\w.-]*$/.test(originalId) ? originalId : `node_${idCounter++}`;
		idMap.set(originalId, safe);
		return safe;
	}

	// --- Build ordered node list ---
	const ordered: DiagramNode[] = [];

	ordered.push({ id: safeId("_start"), type: "start_event", label: startLabel, state: "confirmed", lane: lanes[0], connections: [] });

	const skippedIds = new Set<string>();
	for (const n of visible) {
		if (bpmnTag(n.type) === "startEvent" || bpmnTag(n.type) === "endEvent") skippedIds.add(n.id);
	}

	for (const n of visible) {
		if (bpmnTag(n.type) === "startEvent" || bpmnTag(n.type) === "endEvent") continue;
		ordered.push({
			...n, id: safeId(n.id),
			connections: n.connections.map((c) => {
				if (skippedIds.has(c)) {
					const sk = visible.find((v) => v.id === c);
					if (sk && bpmnTag(sk.type) === "endEvent") return safeId("_end");
					if (sk && bpmnTag(sk.type) === "startEvent") return safeId("_start");
					return null;
				}
				return validIds.has(c) ? safeId(c) : null;
			}).filter((c): c is string => c !== null),
		});
	}

	ordered.push({ id: safeId("_end"), type: "end_event", label: endLabel, state: "confirmed", lane: lanes[lanes.length - 1] || "General", connections: [] });

	// --- Wire connections ---
	const middleNodes = ordered.filter((n) => n.id !== "_start" && n.id !== "_end");
	const totalConns = middleNodes.reduce((s, n) => s + n.connections.length, 0);

	if (middleNodes.length >= 2 && totalConns < middleNodes.length * 0.3) {
		for (let i = 0; i < middleNodes.length - 1; i++) middleNodes[i].connections = [middleNodes[i + 1].id];
		middleNodes[middleNodes.length - 1].connections = ["_end"];
		ordered[0].connections = [middleNodes[0].id];
	} else if (middleNodes.length === 0) {
		ordered[0].connections = ["_end"];
	} else {
		const incoming = new Map<string, string[]>();
		for (const n of ordered) {
			if (n.id === "_start" || n.id === "_end") continue;
			for (const t of n.connections) { if (!incoming.has(t)) incoming.set(t, []); incoming.get(t)!.push(n.id); }
		}
		const roots = middleNodes.filter((n) => !incoming.has(n.id));
		if (roots.length === 0) { ordered[0].connections = [middleNodes[0].id]; }
		else {
			ordered[0].connections = [roots[0].id];
			for (let i = 1; i < roots.length; i++) {
				const prev = findLastInChain(roots[i - 1], ordered);
				if (prev && !prev.type.toLowerCase().includes("gateway")) {
					prev.connections = prev.connections.filter(c => c !== "_end");
					prev.connections.push(roots[i].id);
				}
			}
		}
		for (const t of middleNodes) { if (t.connections.length === 0) t.connections = ["_end"]; }
	}

	// BPMN rules: max 1 output for non-gateways
	for (const n of ordered) {
		if (n.connections.length > 1 && !n.type.toLowerCase().includes("gateway")) n.connections = [n.connections[0]];
	}

	// --- Preprocessor: detect back-edges, build flat ELK graph with port constraints ---
	// Back-edges are NOT removed — they're omitted from ELK and rendered separately.
	const pp = preprocessForElk(ordered);

	const nodeById = new Map(ordered.map((n) => [n.id, n]));

	let elkResult: any;
	try {
		elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});
	} catch (err) {
		console.warn("[bpmn-builder] ELK layout failed, using fallback:", err);
		return emptyXml();
	}

	// --- Extract coordinates: X from ELK, Y from lane assignment ---
	const { positions: lanePositions, laneLayouts } = assignLaneYPositions(
		elkResult, pp, LANE_H, 50,
	);
	const nodeCoords = new Map<string, { x: number; y: number }>();
	const laneCoords = new Map<string, { x: number; y: number; w: number; h: number }>();

	// Find max X to determine pool width
	let maxX = 0;
	for (const child of elkResult.children || []) {
		const x = (child.x || 0) + (child.width || 160);
		if (x > maxX) maxX = x;
	}

	for (const [id, pos] of lanePositions) {
		nodeCoords.set(id, { x: pos.x, y: pos.y });
	}

	// Build lane coordinate map for XML generation
	for (let li = 0; li < laneLayouts.length; li++) {
		const ll = laneLayouts[li];
		laneCoords.set(`Lane_${li}`, { x: 0, y: ll.y, w: maxX + 80, h: ll.height });
	}

	// Pool dimensions
	const poolX = 0;
	const poolY = 20;
	const poolHeaderW = 40; // Lane header width
	let poolW = 0;
	let poolH = 0;
	for (const [, lc] of laneCoords) {
		poolW = Math.max(poolW, lc.x + lc.w);
		poolH = Math.max(poolH, lc.y + lc.h);
	}
	poolW += poolHeaderW + 40;
	poolH += 40;

	// Offset all coordinates by pool header
	for (const [, coord] of nodeCoords) {
		coord.x += poolHeaderW + 20;
		coord.y += poolY;
	}

	// Remap lanes from preprocessor names to ordered indices
	const ppLaneToIndex = new Map<string, number>();
	for (let li = 0; li < lanes.length; li++) {
		ppLaneToIndex.set(lanes[li], li);
	}

	// --- Build edge lookup from ELK result for waypoints ---
	// Map from "sourceId->targetId" to ELK edge sections
	const elkEdgeSections = new Map<string, any>();
	for (const edge of elkResult.edges || []) {
		const section = edge.sections?.[0];
		if (section) {
			// Extract node IDs from port IDs (e.g., "task1_out" → "task1")
			const sourceNodeId = edge.sources?.[0]?.replace(/_out$|_back$/, "") || "";
			const targetNodeId = edge.targets?.[0]?.replace(/_in$/, "") || "";
			elkEdgeSections.set(`${sourceNodeId}->${targetNodeId}`, section);
		}
	}

	// --- Generate XML ---
	let processXml = "";
	let flowsXml = "";
	let shapesXml = "";
	let edgesXml = "";
	let flowId = 0;

	// Lane set
	let laneSetXml = "    <bpmn:laneSet>\n";
	for (let li = 0; li < lanes.length; li++) {
		const refs = ordered.filter((n) => (n.lane || "General") === lanes[li])
			.map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`).join("\n");
		laneSetXml += `      <bpmn:lane id="Lane_${li}" name="${esc(lanes[li])}">\n${refs}\n      </bpmn:lane>\n`;

		const lc = laneCoords.get(`Lane_${li}`);
		if (lc) {
			shapesXml += `    <bpmndi:BPMNShape id="Lane_${li}_di" bpmnElement="Lane_${li}" isHorizontal="true">
      <dc:Bounds x="${poolHeaderW}" y="${poolY + lc.y}" width="${poolW - poolHeaderW}" height="${lc.h}" />
    </bpmndi:BPMNShape>\n`;
		}
	}
	laneSetXml += "    </bpmn:laneSet>\n";

	// Elements + shapes + flows
	for (const n of ordered) {
		const tag = bpmnTag(n.type);
		const d = dims(n.type);
		const nameAttr = n.label ? ` name="${esc(n.label)}"` : "";
		const coord = nodeCoords.get(n.id) || { x: 100, y: 100 };

		// Element XML
		if (n.connections.length > 0) {
			const outRefs = n.connections.map((_, i) => `      <bpmn:outgoing>flow_${flowId + i + 1}</bpmn:outgoing>`).join("\n");
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr}>\n${outRefs}\n    </bpmn:${tag}>\n`;
		} else {
			processXml += `    <bpmn:${tag} id="${n.id}"${nameAttr} />\n`;
		}

		// Shape DI
		shapesXml += `    <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}">
      <dc:Bounds x="${Math.round(coord.x)}" y="${Math.round(coord.y)}" width="${d.w}" height="${d.h}" />
    </bpmndi:BPMNShape>\n`;

		// Sequence flows + edge DI
		for (let ci = 0; ci < n.connections.length; ci++) {
			const targetId = n.connections[ci];
			flowId++;
			const fid = `flow_${flowId}`;
			const condLabel = (n as any).connectionLabels?.[ci];
			const condAttr = condLabel ? ` name="${esc(condLabel)}"` : "";
			flowsXml += `    <bpmn:sequenceFlow id="${fid}"${condAttr} sourceRef="${n.id}" targetRef="${targetId}" />\n`;

			// Straight line waypoints from node positions (ELK flat layout + lane Y)
			const tc = nodeCoords.get(targetId) || { x: coord.x + 200, y: coord.y };
			const td = dims(nodeById.get(targetId)?.type || "task");

			const isBackEdge = pp.backEdges.has(`${n.id}->${targetId}`);

			let waypoints: string;
			if (isBackEdge) {
				// Back-edge: exit from bottom of source, route down and back to target
				const srcBottom = { x: coord.x + d.w / 2, y: coord.y + d.h };
				const tgtBottom = { x: tc.x + td.w / 2, y: tc.y + td.h };
				const routeY = Math.max(srcBottom.y, tgtBottom.y) + 40;
				waypoints = [
					`      <di:waypoint x="${Math.round(srcBottom.x)}" y="${Math.round(srcBottom.y)}" />`,
					`      <di:waypoint x="${Math.round(srcBottom.x)}" y="${Math.round(routeY)}" />`,
					`      <di:waypoint x="${Math.round(tgtBottom.x)}" y="${Math.round(routeY)}" />`,
					`      <di:waypoint x="${Math.round(tgtBottom.x)}" y="${Math.round(tgtBottom.y)}" />`,
				].join("\n");
			} else {
				// Forward edge: use ELK waypoints if available, otherwise straight line
				const section = elkEdgeSections.get(`${n.id}->${targetId}`);
				if (section) {
					const pts: { x: number; y: number }[] = [];
					pts.push({ x: (section.startPoint?.x || 0) + poolHeaderW + 20, y: (section.startPoint?.y || 0) + poolY });
					for (const bp of section.bendPoints || []) {
						pts.push({ x: bp.x + poolHeaderW + 20, y: bp.y + poolY });
					}
					pts.push({ x: (section.endPoint?.x || 0) + poolHeaderW + 20, y: (section.endPoint?.y || 0) + poolY });
					waypoints = pts.map((p) => `      <di:waypoint x="${Math.round(p.x)}" y="${Math.round(p.y)}" />`).join("\n");
				} else {
					// Fallback: straight line between node edges
					waypoints = `      <di:waypoint x="${Math.round(coord.x + d.w)}" y="${Math.round(coord.y + d.h / 2)}" />\n      <di:waypoint x="${Math.round(tc.x)}" y="${Math.round(tc.y + td.h / 2)}" />`;
				}
			}
			edgesXml += `    <bpmndi:BPMNEdge id="${fid}_di" bpmnElement="${fid}">\n${waypoints}\n    </bpmndi:BPMNEdge>\n`;
		}
	}

	// Pool shape
	shapesXml = `    <bpmndi:BPMNShape id="Pool_di" bpmnElement="Pool" isHorizontal="true">
      <dc:Bounds x="${poolX}" y="${poolY}" width="${poolW}" height="${poolH}" />
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

// layoutBpmnXml is no longer needed — ELK runs inside buildBpmnXml
export async function layoutBpmnXml(xml: string): Promise<string> {
	return xml; // pass-through, layout is now built-in
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
