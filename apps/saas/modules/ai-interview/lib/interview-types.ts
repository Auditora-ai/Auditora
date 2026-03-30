import type { SipocCoverage, TeleprompterGapType } from "@repo/ai";

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
	metadata?: {
		gapType?: TeleprompterGapType;
		completenessScore?: number;
		sipocCoverage?: SipocCoverage;
		reasoning?: string;
	};
}

export interface ChatResponse {
	question: string;
	reasoning: string;
	gapType: TeleprompterGapType;
	completenessScore: number;
	sipocCoverage: SipocCoverage;
	readyForReveal: boolean;
	messageCount: number;
	ghostNodes?: GhostNode[];
}

export interface GhostNode {
	id: string;
	type: string;
	label: string;
	lane?: string;
}

export interface InterviewCompletionStatus {
	status: "processing" | "done" | "error";
	step?: string;
	progress?: number;
	bpmnXml?: string;
	riskSummary?: {
		totalRiskScore: number;
		criticalCount: number;
		highCount: number;
		topRiskArea: string;
	};
	risks?: Array<{
		title: string;
		description: string;
		riskType: string;
		severity: number;
		probability: number;
		source: string;
	}>;
	error?: string;
}

export const MAX_MESSAGES = 30;
export const MAX_MESSAGE_LENGTH = 2000;
export const REVEAL_THRESHOLD = 70;
export const GHOST_EXTRACTION_INTERVAL = 3; // every 3rd message
