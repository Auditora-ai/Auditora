"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DiagramNode, BotActivity, TranscriptEntry } from "../types";

export interface DiagramWarning {
	type: string;
	nodeId: string;
	message: string;
	severity: string;
}

export interface DiagramHealth {
	valid: boolean;
	needsRepair: boolean;
	warningCount: number;
	warnings: DiagramWarning[];
}

export interface LiveSessionState {
	sessionId: string;
	processId?: string;
	sessionStatus: "ACTIVE" | "ENDED";
	transcript: TranscriptEntry[];
	nodes: DiagramNode[];
	teleprompterQuestion: string | null;
	questionQueue: string[];
	completenessScore: number | null;
	sipocCoverage: Record<string, number> | null;
	gapType: string | null;
	botActivity: BotActivity;
	diagramHealth: DiagramHealth;

	// UI state
	aiEnabled: boolean;
	selectedTool: "select" | "connect" | "text" | "ai-auto";

	// Modeler reference (any to avoid circular import with useBpmnModeler)
	modelerApi: any | null;
}

export interface LiveSessionActions {
	toggleAi: () => void;
	setSelectedTool: (tool: "select" | "connect" | "text" | "ai-auto") => void;
	confirmNode: (nodeId: string) => void;
	rejectNode: (nodeId: string) => void;
	endSession: () => void;
	exportDiagram: (format: "svg" | "png" | "bpmn") => void;
}

export type LiveSessionContextValue = LiveSessionState & LiveSessionActions;

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

export function useLiveSessionContext() {
	const ctx = useContext(LiveSessionContext);
	if (!ctx) {
		throw new Error("useLiveSessionContext must be used within LiveSessionProvider");
	}
	return ctx;
}

interface LiveSessionProviderProps {
	value: LiveSessionContextValue;
	children: ReactNode;
}

export function LiveSessionProvider({ value, children }: LiveSessionProviderProps) {
	return (
		<LiveSessionContext.Provider value={value}>
			{children}
		</LiveSessionContext.Provider>
	);
}
