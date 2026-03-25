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
	shareToken?: string;
	sessionStatus: "ACTIVE" | "ENDED" | "FAILED" | "CONNECTING";
	connectionStatus: "connected" | "reconnecting" | "disconnected";
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

	// Properties view tabs
	/** Currently active central view: "diagram" or a property tab id (e.g. "props:Process_1") */
	activeCentralTab: string;
	/** Open property tabs: [{ id: "props:{elementId}", label: "Process Name", elementId }] */
	openPropertyTabs: PropertyTab[];

	// Modeler reference (any to avoid circular import with useBpmnModeler)
	modelerApi: any | null;
}

export interface PropertyTab {
	id: string;
	label: string;
	elementId: string;
}

export interface LiveSessionActions {
	toggleAi: () => void;
	setSelectedTool: (tool: "select" | "connect" | "text" | "ai-auto") => void;
	confirmNode: (nodeId: string) => void;
	rejectNode: (nodeId: string) => void;
	endSession: () => void;
	exportDiagram: (format: "svg" | "png" | "bpmn") => void;
	/** Open a property tab for a process/subprocess. If already open, switch to it. */
	openPropertyTab: (elementId: string, label: string) => void;
	/** Close a property tab by its id */
	closePropertyTab: (tabId: string) => void;
	/** Switch the active central tab (diagram or a property tab) */
	setActiveCentralTab: (tabId: string) => void;
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
