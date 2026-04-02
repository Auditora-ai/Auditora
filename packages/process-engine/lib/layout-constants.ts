/**
 * Shared BPMN layout constants
 *
 * Used by bpmn-builder.ts (XML generation) and useBpmnModeler.ts (incremental placement).
 * Keep in sync — changing these affects both initial render and live updates.
 *
 * Sizes follow professional BPMN modeling standards (Bizagi, Signavio).
 */

/** Task box — wide enough to fit 4-5 word labels without overflow */
export const TASK_W = 160;
export const TASK_H = 80;

/** Gateway diamond */
export const GW_SIZE = 50;

/** Event circle */
export const EVENT_SIZE = 36;

/** Minimum lane height — expands dynamically based on content */
export const LANE_H = 250;

/** Horizontal gap between elements — room for labels + arrows */
export const X_GAP = 220;

/** Vertical padding inside the pool */
export const Y_PAD = 60;

/** Pool header width (left label area) */
export const POOL_X = 0;

/** Content start X (after lane header) */
export const CONTENT_X = 200;

// ─── BPMN Type Helpers ────────────────────────────────────────────────
// These live here (not in bpmn-builder.ts) to avoid circular imports.
// bpmn-layout-preprocessor.ts and bpmn-builder.ts both need them.

export function bpmnTag(type: string): string {
	const map: Record<string, string> = {
		task: "task", user_task: "userTask", usertask: "userTask",
		service_task: "serviceTask", servicetask: "serviceTask",
		manual_task: "manualTask", manualtask: "manualTask",
		business_rule_task: "businessRuleTask", businessruletask: "businessRuleTask",
		subprocess: "subProcess", sub_process: "subProcess",
		start_event: "startEvent", startevent: "startEvent",
		end_event: "endEvent", endevent: "endEvent",
		exclusive_gateway: "exclusiveGateway", exclusivegateway: "exclusiveGateway",
		parallel_gateway: "parallelGateway", parallelgateway: "parallelGateway",
		intermediate_event: "intermediateCatchEvent", intermediateevent: "intermediateCatchEvent",
		timer_event: "intermediateCatchEvent", timerevent: "intermediateCatchEvent",
		message_event: "intermediateCatchEvent", messageevent: "intermediateCatchEvent",
		text_annotation: "textAnnotation", textannotation: "textAnnotation",
		data_object: "dataObjectReference", dataobject: "dataObjectReference",
	};
	return map[type.toLowerCase()] || "task";
}

export function dims(type: string) {
	const tag = bpmnTag(type);
	if (tag.includes("Gateway")) return { w: 50, h: 50 };
	if (tag.includes("Event") || tag === "intermediateCatchEvent") return { w: 36, h: 36 };
	if (tag === "subProcess") return { w: 120, h: 100 };
	return { w: 160, h: 80 };
}

export function bpmnType(type: string): string {
	const tag = bpmnTag(type);
	const map: Record<string, string> = {
		task: "bpmn:Task", userTask: "bpmn:UserTask", serviceTask: "bpmn:ServiceTask",
		manualTask: "bpmn:ManualTask", businessRuleTask: "bpmn:BusinessRuleTask",
		subProcess: "bpmn:SubProcess", startEvent: "bpmn:StartEvent", endEvent: "bpmn:EndEvent",
		exclusiveGateway: "bpmn:ExclusiveGateway", parallelGateway: "bpmn:ParallelGateway",
		intermediateCatchEvent: "bpmn:IntermediateCatchEvent",
		textAnnotation: "bpmn:TextAnnotation", dataObjectReference: "bpmn:DataObjectReference",
	};
	return map[tag] || "bpmn:Task";
}

/**
 * Unified ELK configuration for BPMN layout.
 *
 * Used by both bpmn-builder.ts and useBpmnModeler.ts.
 * Validated via spike tests (elk-port-spike.test.ts).
 *
 * Key design decisions:
 * - FLAT graph (no ELK groups for lanes) — cross-lane edges break group layout
 * - Port constraints (FIXED_SIDE) — controls edge attachment points
 * - Back-edges OMITTED from ELK graph — bpmn-js renders them separately
 * - NETWORK_SIMPLEX for both layering and node placement — most balanced results
 * - ORTHOGONAL routing — BPMN standard (not splines)
 */
export const ELK_BPMN_CONFIG: Record<string, string> = {
	"elk.algorithm": "layered",
	"elk.direction": "RIGHT",

	// Spacing (compact like Bizagi, not excessive)
	"elk.spacing.nodeNode": "50",
	"elk.layered.spacing.nodeNodeBetweenLayers": "80",
	"elk.spacing.edgeEdge": "15",
	"elk.spacing.edgeNode": "30",
	"elk.layered.spacing.edgeNodeBetweenLayers": "25",

	// Edge routing — ORTHOGONAL is BPMN standard
	"elk.edgeRouting": "ORTHOGONAL",

	// Crossing minimization
	"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
	"elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",

	// Node placement — NETWORK_SIMPLEX produces most balanced layout
	"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",

	// Layer assignment — NETWORK_SIMPLEX for logical layer ordering
	"elk.layered.layering.strategy": "NETWORK_SIMPLEX",

	// Respect model order when it doesn't conflict with crossing minimization
	"elk.layered.crossingMinimization.considerModelOrder.strategy": "PREFER_NODES",

	// Reading direction congruency
	"elk.layered.directionCongruency": "READING_DIRECTION",

	// Thoroughness (higher = better quality, slightly slower)
	"elk.layered.thoroughness": "10",

	// Separate disconnected components
	"elk.separateConnectedComponents": "true",
};
