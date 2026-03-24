export interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
	confidence?: number | null;
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
