import { describe, it, expect } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import { preprocessForElk, assignLaneYPositions } from "../bpmn-layout-preprocessor";
import { ELK_BPMN_CONFIG } from "../layout-constants";
import type { DiagramNode } from "../../types";

function makeNode(overrides: Partial<DiagramNode> & { id: string }): DiagramNode {
	return {
		type: "task",
		label: `Node ${overrides.id}`,
		state: "confirmed",
		connections: [],
		...overrides,
	};
}

// ─── preprocessForElk ─────────────────────────────────────────────────

describe("preprocessForElk", () => {
	it("returns empty result for empty input", () => {
		const result = preprocessForElk([]);
		expect(result.elkNodes).toHaveLength(0);
		expect(result.elkEdges).toHaveLength(0);
		expect(result.backEdges.size).toBe(0);
	});

	it("filters rejected nodes", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", state: "confirmed" }),
			makeNode({ id: "n2", state: "rejected" }),
		];
		const result = preprocessForElk(nodes);
		expect(result.elkNodes).toHaveLength(1);
		expect(result.elkNodes[0].id).toBe("n1");
	});

	it("assigns FIRST layer constraint to start events", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1" }),
		];
		const result = preprocessForElk(nodes);
		const startNode = result.elkNodes.find((n) => n.id === "s1");
		expect(startNode?.layoutOptions["elk.layered.layering.layerConstraint"]).toBe("FIRST");
	});

	it("assigns LAST layer constraint to end events", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "t1", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		const endNode = result.elkNodes.find((n) => n.id === "e1");
		expect(endNode?.layoutOptions["elk.layered.layering.layerConstraint"]).toBe("LAST");
	});

	it("creates WEST input and EAST output ports for tasks", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "t1", connections: ["t2"] }),
			makeNode({ id: "t2" }),
		];
		const result = preprocessForElk(nodes);
		const task = result.elkNodes.find((n) => n.id === "t1");
		expect(task?.ports).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "t1_in", properties: { "port.side": "WEST" } }),
				expect.objectContaining({ id: "t1_out", properties: { "port.side": "EAST" } }),
			]),
		);
	});

	it("creates only EAST output port for start events (no input)", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1" }),
		];
		const result = preprocessForElk(nodes);
		const start = result.elkNodes.find((n) => n.id === "s1");
		expect(start?.ports).toHaveLength(1);
		expect(start?.ports[0].properties["port.side"]).toBe("EAST");
	});

	it("creates only WEST input port for end events (no output)", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "t1", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		const end = result.elkNodes.find((n) => n.id === "e1");
		expect(end?.ports).toHaveLength(1);
		expect(end?.ports[0].properties["port.side"]).toBe("WEST");
	});

	it("all nodes have FIXED_SIDE port constraints", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		for (const node of result.elkNodes) {
			expect(node.layoutOptions["elk.portConstraints"]).toBe("FIXED_SIDE");
		}
	});
});

// ─── Back-edge detection ──────────────────────────────────────────────

describe("back-edge detection", () => {
	it("detects no back-edges in a DAG (no cycles)", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["t2"] }),
			makeNode({ id: "t2", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		expect(result.backEdges.size).toBe(0);
		expect(result.backEdgeList).toHaveLength(0);
		// All edges should be forward
		expect(result.elkEdges.length).toBe(3);
	});

	it("detects single back-edge in a gateway loop", () => {
		// s1 → t1 → gw1 → t2 → e1
		//              ↓ (back to t1)
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["gw1"] }),
			makeNode({ id: "gw1", type: "exclusive_gateway", connections: ["t2", "t1"] }), // t1 is back-edge
			makeNode({ id: "t2", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);

		expect(result.backEdges.size).toBe(1);
		expect(result.backEdges.has("gw1->t1")).toBe(true);
		expect(result.backEdgeList).toHaveLength(1);

		// Forward edges: s1→t1, t1→gw1, gw1→t2, t2→e1 = 4
		expect(result.elkEdges.length).toBe(4);
	});

	it("adds SOUTH port to gateway with back-edge", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["gw1"] }),
			makeNode({ id: "gw1", type: "exclusive_gateway", connections: ["t2", "t1"] }),
			makeNode({ id: "t2", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		const gw = result.elkNodes.find((n) => n.id === "gw1");

		// Should have 3 ports: WEST (in), EAST (forward out), SOUTH (back out)
		expect(gw?.ports).toHaveLength(3);
		expect(gw?.ports).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ properties: { "port.side": "SOUTH" } }),
			]),
		);
	});

	it("detects multiple back-edges", () => {
		// Two separate loops: gw1 → t1 and gw2 → t2
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["gw1"] }),
			makeNode({ id: "gw1", type: "exclusive_gateway", connections: ["t2", "t1"] }),
			makeNode({ id: "t2", connections: ["gw2"] }),
			makeNode({ id: "gw2", type: "exclusive_gateway", connections: ["e1", "t2"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);

		expect(result.backEdges.size).toBe(2);
		expect(result.backEdges.has("gw1->t1")).toBe(true);
		expect(result.backEdges.has("gw2->t2")).toBe(true);
	});

	it("handles disconnected components gracefully", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "t1", connections: ["t2"] }),
			makeNode({ id: "t2" }),
			makeNode({ id: "t3" }), // disconnected
		];
		const result = preprocessForElk(nodes);
		expect(result.elkNodes).toHaveLength(3);
		// No back-edges in disconnected components
		expect(result.backEdges.size).toBe(0);
	});

	it("handles multiple start events", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "s2", type: "start_event", connections: ["t1"] }),
			makeNode({ id: "t1", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event" }),
		];
		const result = preprocessForElk(nodes);
		const starts = result.elkNodes.filter(
			(n) => n.layoutOptions["elk.layered.layering.layerConstraint"] === "FIRST",
		);
		expect(starts).toHaveLength(2);
	});
});

// ─── Lane Y-positioning ──────────────────────────────────────────────

describe("assignLaneYPositions", () => {
	it("assigns nodes to correct lane bands", () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "t1", lane: "Sales", connections: ["t2"] }),
			makeNode({ id: "t2", lane: "IT" }),
		];
		const pp = preprocessForElk(nodes);

		// Mock ELK result: flat nodes with X positions
		const mockElkResult = {
			children: [
				{ id: "t1", x: 0, y: 0, width: 160, height: 80 },
				{ id: "t2", x: 240, y: 0, width: 160, height: 80 },
			],
		};

		const { positions, laneLayouts } = assignLaneYPositions(mockElkResult, pp, 200, 50);

		// Two lanes
		expect(laneLayouts).toHaveLength(2);
		expect(laneLayouts[0].name).toBe("Sales");
		expect(laneLayouts[1].name).toBe("IT");

		// Nodes in different Y bands
		const t1 = positions.get("t1")!;
		const t2 = positions.get("t2")!;
		expect(t1.y).toBeLessThan(t2.y); // Sales lane is above IT lane

		// X preserved from ELK
		expect(t1.x).toBe(0);
		expect(t2.x).toBe(240);
	});
});

// ─── Integration: preprocessor + ELK produces correct L→R order ──────

describe("integration: preprocessor + ELK layout", () => {
	it("produces left-to-right layout for linear process", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", lane: "Ops", connections: ["t1"] }),
			makeNode({ id: "t1", lane: "Ops", connections: ["t2"] }),
			makeNode({ id: "t2", lane: "Ops", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event", lane: "Ops" }),
		];

		const pp = preprocessForElk(nodes);
		const elk = new ELK();

		const elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});

		const { positions } = assignLaneYPositions(elkResult, pp);

		const s1 = positions.get("s1")!;
		const t1 = positions.get("t1")!;
		const t2 = positions.get("t2")!;
		const e1 = positions.get("e1")!;

		// Strict left-to-right order
		expect(s1.x).toBeLessThan(t1.x);
		expect(t1.x).toBeLessThan(t2.x);
		expect(t2.x).toBeLessThan(e1.x);
	});

	it("produces L→R layout with gateway loop (back-edge omitted)", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", lane: "Ops", connections: ["t1"] }),
			makeNode({ id: "t1", lane: "Ops", connections: ["gw1"] }),
			makeNode({ id: "gw1", type: "exclusive_gateway", lane: "Ops", connections: ["t2", "t1"] }),
			makeNode({ id: "t2", lane: "Ops", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event", lane: "Ops" }),
		];

		const pp = preprocessForElk(nodes);
		expect(pp.backEdges.has("gw1->t1")).toBe(true);

		const elk = new ELK();
		const elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});

		const { positions } = assignLaneYPositions(elkResult, pp);

		const s1 = positions.get("s1")!;
		const t1 = positions.get("t1")!;
		const gw1 = positions.get("gw1")!;
		const t2 = positions.get("t2")!;
		const e1 = positions.get("e1")!;

		// Forward flow left-to-right despite the loop
		expect(s1.x).toBeLessThan(t1.x);
		expect(t1.x).toBeLessThan(gw1.x);
		expect(gw1.x).toBeLessThan(t2.x);
		expect(t2.x).toBeLessThan(e1.x);
	});

	it("produces L→R layout across multiple lanes", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "s1", type: "start_event", lane: "Analista", connections: ["t1"] }),
			makeNode({ id: "t1", lane: "Analista", connections: ["t2"] }),
			makeNode({ id: "t2", lane: "Gerente", connections: ["t3"] }),
			makeNode({ id: "t3", lane: "Analista", connections: ["e1"] }),
			makeNode({ id: "e1", type: "end_event", lane: "Analista" }),
		];

		const pp = preprocessForElk(nodes);
		const elk = new ELK();

		const elkResult = await elk.layout({
			id: "root",
			layoutOptions: { ...ELK_BPMN_CONFIG },
			children: pp.elkNodes.map(({ _lane, ...n }) => n),
			edges: pp.elkEdges,
		});

		const { positions } = assignLaneYPositions(elkResult, pp);

		const s1 = positions.get("s1")!;
		const t1 = positions.get("t1")!;
		const t2 = positions.get("t2")!;
		const t3 = positions.get("t3")!;
		const e1 = positions.get("e1")!;

		// Left-to-right across lanes
		expect(s1.x).toBeLessThan(t1.x);
		expect(t1.x).toBeLessThan(t2.x);
		expect(t2.x).toBeLessThan(t3.x);
		expect(t3.x).toBeLessThan(e1.x);

		// Cross-lane nodes in different Y bands
		// t1 (Analista) and t2 (Gerente) should be in different Y positions
		expect(t1.y).not.toBe(t2.y);
	});
});
