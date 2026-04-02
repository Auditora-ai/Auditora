// Re-export BPMN types from the shared process-engine package
export type { DiagramNode, NodeProperties } from "@repo/process-engine";

// Bot activity feedback types
export type BotActivityType =
	| "listening"
	| "extracting"
	| "diagramming"
	| "suggesting";

export interface BotActivity {
	type: BotActivityType;
	detail: string | null;
	updatedAt: number | null;
	stale: boolean;
}

export interface ActivityLogEntry {
	type: BotActivityType;
	detail: string;
	timestamp: number;
}

export interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	correctedText?: string | null;
	timestamp: number;
	source?: string;
}
