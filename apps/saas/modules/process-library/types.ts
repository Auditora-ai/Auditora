export type ProcessChild = {
	id: string;
	name: string;
	level: string;
	processStatus: string;
	description: string | null;
};

export type SessionDeliverable = {
	type: string;
	status: string;
	data: Record<string, unknown> | null;
};

export type ProcessSession = {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	endedAt: string | null;
	_count: { diagramNodes: number };
	deliverables?: SessionDeliverable[];
};

export type ProcessVersionEntry = {
	id: string;
	version: number;
	changeNote: string | null;
	createdBy: string;
	createdAt: string;
	bpmnXml?: string | null;
};

export type RaciEntry = {
	activityName: string;
	role: string;
	assignment: string;
};

export interface ProcessData {
	id: string;
	name: string;
	description: string | null;
	level: string;
	processStatus: string;
	category: string | null;
	owner: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	bpmnXml: string | null;
	parent?: { id: string; name: string; level: string } | null;
	children?: ProcessChild[];
	sessions?: ProcessSession[];
	versions?: ProcessVersionEntry[];
	raciEntries?: RaciEntry[];
	sessionsCount: number;
	versionsCount: number;
	raciCount: number;
	risksCount: number;
	hasIntelligence: boolean;
	conflictsCount: number;
}

export const STATUS_MAP: Record<string, "success" | "info" | "warning" | "error"> = {
	DRAFT: "info",
	MAPPED: "warning",
	VALIDATED: "success",
	APPROVED: "success",
};

export const SESSION_STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> = {
	ACTIVE: "info",
	CONNECTING: "warning",
	ENDED: "success",
	FAILED: "error",
	SCHEDULED: "info",
};
