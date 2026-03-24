"use client";

import { useCallback, useRef, useState } from "react";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { useLiveSession } from "../hooks/useLiveSession";
import { LiveSessionProvider, type LiveSessionContextValue } from "../context/LiveSessionContext";
import { exportSVG, exportPNG, exportXML } from "../lib/bpmn-export";
import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { CentralCanvas } from "./CentralCanvas";
import { RightPanel } from "./RightPanel";
import { BottomBar } from "./BottomBar";

interface MeetingViewProps {
	sessionId: string;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	processName?: string;
	clientName?: string;
	botId?: string;
	shareToken?: string;
	startedAt?: string;
	processId?: string;
	organizationId: string;
	organizationSlug?: string;
	bpmnXml?: string | null;
}

export function MeetingView({
	sessionId,
	processName,
	clientName,
	processId,
	organizationId,
	bpmnXml,
}: MeetingViewProps) {
	// UI state
	const [aiEnabled, setAiEnabled] = useState(true);
	const [selectedTool, setSelectedTool] = useState<"select" | "connect" | "text" | "ai-auto">("select");

	// bpmn-js modeler
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerApi = useBpmnModeler({
		containerRef,
		initialXml: bpmnXml,
		onConfirmNode: (nodeId) => handleNodeAction(nodeId, "confirm"),
		onRejectNode: (nodeId) => handleNodeAction(nodeId, "reject"),
	});

	// Live session polling
	const liveData = useLiveSession(sessionId, modelerApi, aiEnabled);

	// Node confirm/reject — uses existing API: { action: "confirm" | "reject" }
	const handleNodeAction = useCallback(
		async (nodeId: string, action: "confirm" | "reject") => {
			try {
				await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action }),
				});
			} catch (err) {
				console.error("[MeetingView] Node action failed:", err);
			}
		},
		[sessionId],
	);

	// End session
	const handleEndSession = useCallback(async () => {
		try {
			await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
		} catch (err) {
			console.error("[MeetingView] End session failed:", err);
		}
	}, [sessionId]);

	// Export diagram
	const handleExport = useCallback(
		async (format: "svg" | "png" | "bpmn") => {
			if (!modelerApi?.isReady) return;
			const modeler = modelerApi.getModeler();
			if (!modeler) return;

			try {
				if (format === "svg") await exportSVG(modeler);
				else if (format === "png") await exportPNG(modeler);
				else if (format === "bpmn") await exportXML(modeler);
			} catch (err) {
				console.error("[MeetingView] Export failed:", err);
			}
		},
		[modelerApi],
	);

	// Assemble context value
	const contextValue: LiveSessionContextValue = {
		sessionId,
		processId,
		...liveData,
		aiEnabled,
		selectedTool,
		modelerApi,
		toggleAi: () => setAiEnabled((prev) => !prev),
		setSelectedTool,
		confirmNode: (nodeId) => handleNodeAction(nodeId, "confirm"),
		rejectNode: (nodeId) => handleNodeAction(nodeId, "reject"),
		endSession: handleEndSession,
		exportDiagram: handleExport,
	};

	return (
		<LiveSessionProvider value={contextValue}>
			<div
				className="grid h-screen w-screen overflow-hidden bg-[#0F172A]"
				style={{
					gridTemplateRows: "48px 1fr 36px",
					gridTemplateColumns: "220px 1fr 280px",
					gridTemplateAreas: `
						"top    top    top"
						"left   canvas right"
						"bottom bottom bottom"
					`,
					fontFamily: "Inter, system-ui, -apple-system, sans-serif",
				}}
			>
				<TopBar processName={processName} clientName={clientName} />
				<LeftPanel />
				<CentralCanvas containerRef={containerRef} />
				<RightPanel organizationId={organizationId} processId={processId} />
				<BottomBar />
			</div>
		</LiveSessionProvider>
	);
}
