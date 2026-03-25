export interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
	/** Flow condition labels for each connection (same index as connections array). E.g. ["Sí", "No"] */
	connectionLabels?: string[];
	confidence?: number | null;
	/** Task properties: description, SLA, systems, inputs/outputs, costs, etc. */
	properties?: NodeProperties | null;
	/** Generated SOP/procedure document */
	procedure?: Record<string, any> | null;
}

export interface NodeProperties {
	/** TipTap JSON document or legacy plain string */
	description?: string | Record<string, any>;
	attachments?: { name: string; url: string; type: string; size: number }[];
	responsable?: string;
	slaValue?: number | null;
	slaUnit?: "minutes" | "hours" | "days";
	frequency?: "daily" | "weekly" | "monthly" | "per_event";
	frequencyCount?: number | null;
	systems?: string[];
	inputs?: string[];
	outputs?: string[];
	costPerExecution?: number | null;
	costCurrency?: string;
	estimatedDuration?: number | null;
}

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
