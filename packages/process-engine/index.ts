// ─── Types ────────────────────────────────────────────────────────────
export type { DiagramNode, NodeProperties } from "./types/index";

// ─── Layout Constants ────────────────────────────────────────────────
export {
	TASK_W, TASK_H, GW_SIZE, EVENT_SIZE, LANE_H, X_GAP, Y_PAD, POOL_X, CONTENT_X,
	bpmnTag, dims, bpmnType,
	ELK_BPMN_CONFIG,
} from "./lib/layout-constants";

// ─── HTML Utils ──────────────────────────────────────────────────────
export { escapeHtml } from "./lib/html-utils";

// ─── BPMN Layout Preprocessor ────────────────────────────────────────
export {
	preprocessForElk,
	assignLaneYPositions,
	type ElkPort, type ElkNode, type ElkEdge, type PreprocessResult, type LaneLayout,
} from "./lib/bpmn-layout-preprocessor";

// ─── BPMN Builder ────────────────────────────────────────────────────
export { buildBpmnXml, layoutBpmnXml } from "./lib/bpmn-builder";

// ─── BPMN Colors ─────────────────────────────────────────────────────
export { ELEMENT_COLORS, applyBizagiColors } from "./lib/bpmn-colors";

// ─── BPMN Export ─────────────────────────────────────────────────────
export { exportSVG, exportPNG, exportXML } from "./lib/bpmn-export";

// ─── Flow Tree ───────────────────────────────────────────────────────
export {
	buildFlowTree,
	reorderNode,
	addConnection,
	removeConnection,
	insertNodeAfter,
	removeNodeFromFlow,
	type FlowTreeItem, type ConnectionPatch,
} from "./lib/flow-tree";
