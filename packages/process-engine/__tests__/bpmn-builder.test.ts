import { describe, it, expect } from "vitest";
import { buildBpmnXml, bpmnTag, dims, bpmnType } from "../lib/bpmn-builder";
import type { DiagramNode } from "../types";

// ─── Helper ───────────────────────────────────────────────────────────
function makeNode(
	overrides: Partial<DiagramNode> & { id: string },
): DiagramNode {
	return {
		type: "task",
		label: `Node ${overrides.id}`,
		state: "confirmed",
		connections: [],
		...overrides,
	};
}

// ─── bpmnTag ──────────────────────────────────────────────────────────
describe("bpmnTag", () => {
	it("maps snake_case node types to camelCase BPMN tags", () => {
		expect(bpmnTag("start_event")).toBe("startEvent");
		expect(bpmnTag("end_event")).toBe("endEvent");
		expect(bpmnTag("exclusive_gateway")).toBe("exclusiveGateway");
		expect(bpmnTag("parallel_gateway")).toBe("parallelGateway");
		expect(bpmnTag("task")).toBe("task");
	});

	it("handles case-insensitive input", () => {
		expect(bpmnTag("START_EVENT")).toBe("startEvent");
		expect(bpmnTag("Exclusive_Gateway")).toBe("exclusiveGateway");
	});

	it("handles concatenated forms (no underscore)", () => {
		expect(bpmnTag("startevent")).toBe("startEvent");
		expect(bpmnTag("endevent")).toBe("endEvent");
		expect(bpmnTag("exclusivegateway")).toBe("exclusiveGateway");
	});

	it("falls back to 'task' for unknown types", () => {
		expect(bpmnTag("unknown_type")).toBe("task");
		expect(bpmnTag("")).toBe("task");
	});

	it("maps new expanded BPMN element types", () => {
		expect(bpmnTag("subprocess")).toBe("subProcess");
		expect(bpmnTag("user_task")).toBe("userTask");
		expect(bpmnTag("service_task")).toBe("serviceTask");
		expect(bpmnTag("manual_task")).toBe("manualTask");
		expect(bpmnTag("business_rule_task")).toBe("businessRuleTask");
		expect(bpmnTag("timer_event")).toBe("intermediateCatchEvent");
		expect(bpmnTag("message_event")).toBe("intermediateCatchEvent");
		expect(bpmnTag("text_annotation")).toBe("textAnnotation");
		expect(bpmnTag("data_object")).toBe("dataObjectReference");
	});
});

// ─── dims ─────────────────────────────────────────────────────────────
describe("dims", () => {
	it("returns correct dimensions for tasks", () => {
		expect(dims("task")).toEqual({ w: 160, h: 80 });
	});

	it("returns correct dimensions for gateways", () => {
		expect(dims("exclusive_gateway")).toEqual({ w: 50, h: 50 });
		expect(dims("parallel_gateway")).toEqual({ w: 50, h: 50 });
	});

	it("returns correct dimensions for events", () => {
		expect(dims("start_event")).toEqual({ w: 36, h: 36 });
		expect(dims("end_event")).toEqual({ w: 36, h: 36 });
	});

	it("defaults to task dimensions for unknown types", () => {
		expect(dims("unknown")).toEqual({ w: 160, h: 80 });
	});
});

// ─── bpmnType ─────────────────────────────────────────────────────────
describe("bpmnType", () => {
	it("maps to bpmn: prefixed types", () => {
		expect(bpmnType("task")).toBe("bpmn:Task");
		expect(bpmnType("start_event")).toBe("bpmn:StartEvent");
		expect(bpmnType("end_event")).toBe("bpmn:EndEvent");
		expect(bpmnType("exclusive_gateway")).toBe("bpmn:ExclusiveGateway");
		expect(bpmnType("parallel_gateway")).toBe("bpmn:ParallelGateway");
	});

	it("defaults to bpmn:Task for unknown types", () => {
		expect(bpmnType("unknown")).toBe("bpmn:Task");
	});
});

// ─── buildBpmnXml ─────────────────────────────────────────────────────
describe("buildBpmnXml", () => {
	it("returns valid empty BPMN XML for empty array", async () => {
		const xml = await buildBpmnXml([]);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain("bpmn:definitions");
		expect(xml).toContain("bpmn:process");
		expect(xml).not.toContain("bpmn:task");
	});

	it("returns empty XML when all nodes are rejected", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", state: "rejected" }),
			makeNode({ id: "n2", state: "rejected" }),
		];
		const xml = await buildBpmnXml(nodes);
		expect(xml).not.toContain("bpmn:task");
		expect(xml).toContain("bpmn:process");
	});

	it("generates XML with start and end events for a single task", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", label: "Do Something", lane: "Sales", connections: ["n2"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('id="_start"');
		expect(xml).toContain('id="_end"');
		expect(xml).toContain('id="n1"');
		expect(xml).toContain('name="Do Something"');
		expect(xml).toContain("bpmn:startEvent");
		expect(xml).toContain("bpmn:endEvent");
		expect(xml).toContain("bpmn:task");
	});

	it("creates lanes from node lane properties", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", lane: "Sales", connections: ["n2"] }),
			makeNode({ id: "n2", lane: "IT" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('name="Sales"');
		expect(xml).toContain('name="IT"');
		expect(xml).toContain("bpmn:lane");
		expect(xml).toContain("bpmn:laneSet");
	});

	it("defaults lane to 'General' when not specified", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);
		expect(xml).toContain('name="General"');
	});

	it("generates sequence flows for connected nodes", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2"] }),
			makeNode({ id: "n2", connections: ["n3"] }),
			makeNode({ id: "n3" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain("bpmn:sequenceFlow");
		expect(xml).toContain('sourceRef="n1"');
		expect(xml).toContain('targetRef="n2"');
		expect(xml).toContain('sourceRef="n2"');
		expect(xml).toContain('targetRef="n3"');
	});

	it("handles exclusive gateway branching", async () => {
		const nodes: DiagramNode[] = [
			makeNode({
				id: "gw1",
				type: "exclusive_gateway",
				label: "Decision",
				connections: ["n2", "n3"],
			}),
			makeNode({ id: "n2", label: "Path A" }),
			makeNode({ id: "n3", label: "Path B" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain("bpmn:exclusiveGateway");
		expect(xml).toContain('sourceRef="gw1"');
		expect(xml).toContain('targetRef="n2"');
		expect(xml).toContain('targetRef="n3"');
	});

	it("handles parallel gateway branching", async () => {
		const nodes: DiagramNode[] = [
			makeNode({
				id: "pg1",
				type: "parallel_gateway",
				connections: ["n2", "n3"],
			}),
			makeNode({ id: "n2" }),
			makeNode({ id: "n3" }),
		];
		const xml = await buildBpmnXml(nodes);
		expect(xml).toContain("bpmn:parallelGateway");
	});

	it("filters out connections to non-existent nodes", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2", "nonexistent"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('targetRef="n2"');
		expect(xml).not.toContain('targetRef="nonexistent"');
	});

	it("skips LLM-generated start/end events (uses own _start/_end)", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "llm_start", type: "start_event", label: "Begin" }),
			makeNode({ id: "n1", connections: ["llm_end"] }),
			makeNode({ id: "llm_end", type: "end_event", label: "End" }),
		];
		const xml = await buildBpmnXml(nodes);

		// Should have _start and _end, not llm_start/llm_end
		expect(xml).toContain('id="_start"');
		expect(xml).toContain('id="_end"');
		expect(xml).not.toContain('id="llm_start"');
		expect(xml).not.toContain('id="llm_end"');
	});

	it("connects _start to root nodes (no incoming connections)", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);

		// _start should connect to n1 (root node)
		expect(xml).toContain('sourceRef="_start"');
		expect(xml).toContain('targetRef="n1"');
	});

	it("connects terminal nodes (no outgoing) to _end", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2"] }),
			makeNode({ id: "n2" }), // terminal — no connections
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('sourceRef="n2"');
		expect(xml).toContain('targetRef="_end"');
	});

	it("escapes special XML characters in labels", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", label: 'Check "A" & <B>', connections: ["n2"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain("&amp;");
		expect(xml).toContain("&lt;");
		expect(xml).toContain("&gt;");
		expect(xml).toContain("&quot;");
		expect(xml).not.toContain('name="Check "A"');
	});

	it("generates BPMNDiagram shapes for all elements", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", connections: ["n2"] }),
			makeNode({ id: "n2" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain("BPMNShape");
		expect(xml).toContain("BPMNEdge");
		expect(xml).toContain('bpmnElement="n1"');
		expect(xml).toContain('bpmnElement="n2"');
		expect(xml).toContain("dc:Bounds");
		expect(xml).toContain("di:waypoint");
	});

	it("includes Pool and Collaboration elements", async () => {
		const nodes: DiagramNode[] = [makeNode({ id: "n1" })];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain("bpmn:collaboration");
		expect(xml).toContain("bpmn:participant");
		expect(xml).toContain('processRef="Process_1"');
		expect(xml).toContain('bpmnElement="Pool"');
	});

	it("handles forming nodes (visible in diagram)", async () => {
		const nodes: DiagramNode[] = [
			makeNode({ id: "n1", state: "forming", connections: ["n2"] }),
			makeNode({ id: "n2", state: "confirmed" }),
		];
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('id="n1"');
		expect(xml).toContain('id="n2"');
	});

	it("handles large graph (10+ nodes) without errors", async () => {
		const nodes: DiagramNode[] = [];
		for (let i = 1; i <= 10; i++) {
			nodes.push(
				makeNode({
					id: `n${i}`,
					lane: i <= 5 ? "Team A" : "Team B",
					connections: i < 10 ? [`n${i + 1}`] : [],
				}),
			);
		}
		const xml = await buildBpmnXml(nodes);

		expect(xml).toContain('id="n1"');
		expect(xml).toContain('id="n10"');
		expect(xml).toContain('name="Team A"');
		expect(xml).toContain('name="Team B"');
	});
});

// ─── BpmnBuildOptions ────────────────────────────────────────────────
describe("buildBpmnXml — BpmnBuildOptions", () => {
	const singleNode: DiagramNode[] = [
		makeNode({ id: "t1", label: "Process Task", lane: "Operations" }),
	];

	it("uses empty string for start/end labels by default (no options)", async () => {
		const xml = await buildBpmnXml(singleNode);
		// Default: no startLabel/endLabel options → empty name attributes
		expect(xml).toContain('id="_start"');
		expect(xml).toContain('id="_end"');
		// Should NOT have hardcoded language-specific labels
		expect(xml).not.toContain('name="Start"');
		expect(xml).not.toContain('name="End"');
		expect(xml).not.toContain('name="Inicio"');
		expect(xml).not.toContain('name="Fin"');
	});

	it("applies custom startLabel and endLabel from options", async () => {
		const xml = await buildBpmnXml(singleNode, {
			startLabel: "Process Start",
			endLabel: "Process End",
		});
		expect(xml).toContain('name="Process Start"');
		expect(xml).toContain('name="Process End"');
	});

	it("applies only startLabel when endLabel is omitted", async () => {
		const xml = await buildBpmnXml(singleNode, { startLabel: "Inicio del Proceso" });
		expect(xml).toContain('name="Inicio del Proceso"');
		// endLabel defaults to empty string
		expect(xml).not.toContain('name="End"');
		expect(xml).not.toContain('name="Fin"');
	});

	it("applies only endLabel when startLabel is omitted", async () => {
		const xml = await buildBpmnXml(singleNode, { endLabel: "Fin del Proceso" });
		expect(xml).toContain('name="Fin del Proceso"');
		// startLabel defaults to empty string
		expect(xml).not.toContain('name="Start"');
		expect(xml).not.toContain('name="Inicio"');
	});

	it("handles empty string options explicitly (same as default)", async () => {
		const xml = await buildBpmnXml(singleNode, { startLabel: "", endLabel: "" });
		expect(xml).toContain('id="_start"');
		expect(xml).toContain('id="_end"');
		// Empty name should not produce extra noise
		expect(xml).not.toContain('name="Start"');
		expect(xml).not.toContain('name="Inicio"');
	});

	it("supports locale-specific labels for Spanish (es)", async () => {
		const xml = await buildBpmnXml(singleNode, {
			startLabel: "Inicio",
			endLabel: "Fin",
		});
		expect(xml).toContain('name="Inicio"');
		expect(xml).toContain('name="Fin"');
	});

	it("is backward compatible: existing callers without options still work", async () => {
		// Simulate old API call style (no options arg)
		const xml = await buildBpmnXml(singleNode);
		expect(xml).not.toBeNull();
		expect(typeof xml).toBe("string");
		expect(xml.length).toBeGreaterThan(100);
		expect(xml).toContain("bpmn:definitions");
	});
});
