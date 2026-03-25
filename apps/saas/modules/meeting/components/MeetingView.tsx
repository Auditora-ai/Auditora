"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { useLiveSession } from "../hooks/useLiveSession";
import { LiveSessionProvider, type LiveSessionContextValue, type PropertyTab } from "../context/LiveSessionContext";
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
	organizationSlug,
	bpmnXml,
	shareToken,
}: MeetingViewProps & { shareToken?: string }) {
	const router = useRouter();
	// UI state
	const [aiEnabled, setAiEnabled] = useState(true);
	const [selectedTool, setSelectedTool] = useState<"select" | "connect" | "text" | "ai-auto">("select");

	// Properties view tab state
	const [activeCentralTab, setActiveCentralTab] = useState("diagram");
	const [openPropertyTabs, setOpenPropertyTabs] = useState<PropertyTab[]>([]);

	const openPropertyTab = useCallback((elementId: string, label: string) => {
		const tabId = `props:${elementId}`;
		setOpenPropertyTabs((prev) => {
			if (prev.some((t) => t.id === tabId)) return prev;
			return [...prev, { id: tabId, label, elementId }];
		});
		setActiveCentralTab(tabId);
	}, []);

	const closePropertyTab = useCallback((tabId: string) => {
		setOpenPropertyTabs((prev) => prev.filter((t) => t.id !== tabId));
		setActiveCentralTab((current) => current === tabId ? "diagram" : current);
	}, []);

	// bpmn-js modeler
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerApi = useBpmnModeler({
		containerRef,
		initialXml: bpmnXml,
		processName,
		onConfirmNode: (nodeId) => handleNodeAction(nodeId, "confirm"),
		onRejectNode: (nodeId) => handleNodeAction(nodeId, "reject"),
		onOpenProperties: (elementId, elementType, parentId) => {
			// For tasks, open the parent process/subprocess tab and scroll to the task
			// For subprocesses, open that subprocess's own tab
			if (elementType === "bpmn:SubProcess") {
				const modeler = modelerApi?.getModeler();
				const el = modeler?.get("elementRegistry")?.get(elementId);
				const label = el?.businessObject?.name || elementId;
				openPropertyTab(elementId, label);
			} else {
				// Open the parent container (root process or subprocess)
				const targetId = parentId || "Process_1";
				const modeler = modelerApi?.getModeler();
				const el = modeler?.get("elementRegistry")?.get(targetId);
				const label = el?.businessObject?.name || processName || "Proceso";
				openPropertyTab(targetId, label);
			}
		},
	});

	// Live session polling
	const liveData = useLiveSession(sessionId, modelerApi, aiEnabled);

	// Warn user before closing tab during active session
	useEffect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (liveData.sessionStatus === "ACTIVE" || liveData.sessionStatus === "CONNECTING") {
				e.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [liveData.sessionStatus]);

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
			toast.info("Finalizando sesion...");
			const res = await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Sesion finalizada. Generando entregables...");
			// Navigate to review page
			const slug = organizationSlug || "default";
			router.push(`/${slug}/session/${sessionId}/review`);
		} catch (err) {
			console.error("[MeetingView] End session failed:", err);
			toast.error("Error al finalizar la sesion");
		}
	}, [sessionId, organizationSlug, router]);

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
		shareToken,
		...liveData,
		aiEnabled,
		selectedTool,
		activeCentralTab,
		openPropertyTabs,
		modelerApi,
		toggleAi: () => setAiEnabled((prev) => !prev),
		setSelectedTool,
		confirmNode: (nodeId) => handleNodeAction(nodeId, "confirm"),
		rejectNode: (nodeId) => handleNodeAction(nodeId, "reject"),
		endSession: handleEndSession,
		exportDiagram: handleExport,
		openPropertyTab,
		closePropertyTab,
		setActiveCentralTab,
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
				{/* Connection banners removed — managed by LiveIndicator in TopBar */}
				<TopBar processName={processName} clientName={clientName} />
				<LeftPanel />
				<CentralCanvas containerRef={containerRef} />
				<RightPanel organizationId={organizationId} processId={processId} />
				<BottomBar />
			</div>
		</LiveSessionProvider>
	);
}
