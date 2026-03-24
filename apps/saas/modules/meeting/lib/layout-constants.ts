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
