"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useBpmnModeler } from "../hooks/useBpmnModeler";
import { useLiveSession } from "../hooks/useLiveSession";
import { useKeyboardShortcuts, type ShortcutDef } from "../hooks/useKeyboardShortcuts";
import { LiveSessionProvider, type LiveSessionContextValue, type PropertyTab, type LayoutMode } from "../context/LiveSessionContext";
import { exportSVG, exportPNG, exportXML } from "@repo/process-engine";
import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { CentralCanvas } from "./CentralCanvas";
import { RightPanel } from "./RightPanel";
import { SopPanel } from "./SopPanel";
import { BottomBar } from "./BottomBar";
import { EndSessionDialog, type EndMode } from "./EndSessionDialog";
import { ExpandedSipocChat } from "./ExpandedSipocChat";
import { MeetingViewMobile } from "./MeetingViewMobile";
import { useIsMobile } from "@shared/hooks/use-media-query";

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
	const t = useTranslations("meeting");
	const tm = useTranslations("meetingModule");
	const isMobile = useIsMobile();

	// Accessibility: restore font scale from localStorage
	useEffect(() => {
		const saved = localStorage.getItem("fontScale");
		if (saved) document.documentElement.style.setProperty("--font-scale", saved);
	}, []);

	// Process ID — mutable so TopBar can set it after eager process creation
	const [currentProcessId, setCurrentProcessId] = useState(processId);

	// UI state
	const [aiEnabled, setAiEnabled] = useState(true);
	const [selectedTool, setSelectedTool] = useState<"select" | "connect" | "text" | "ai-auto">("select");
	const [leftCollapsed, setLeftCollapsed] = useState(false);
	const [rightCollapsed, setRightCollapsed] = useState(false);
	const [layoutMode, setLayoutMode] = useState<LayoutMode>("default");

	// Properties view tab state
	const [activeCentralTab, setActiveCentralTab] = useState("diagram");
	const [openPropertyTabs, setOpenPropertyTabs] = useState<PropertyTab[]>([]);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
				const label = el?.businessObject?.name || processName || tm("defaultProcessName");
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

	// End session dialog
	const [showEndDialog, setShowEndDialog] = useState(false);
	const [endLoading, setEndLoading] = useState(false);

	const handleEndSession = useCallback(() => {
		setShowEndDialog(true);
	}, []);

	const handleEndConfirm = useCallback(async (mode: EndMode, newProcessName?: string) => {
		setEndLoading(true);
		try {
			// Save current BPMN state before ending (except discard)
			if (mode !== "discard" && modelerApi?.isReady) {
				const modeler = modelerApi.getModeler();
				if (modeler) {
					try {
						const { xml } = await modeler.saveXML({ format: true });
						if (xml) {
							await fetch(`/api/sessions/${sessionId}/diagram`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ bpmnXml: xml }),
							});
						}
					} catch {
						// Non-critical — endpoint has fallback from nodes
					}
				}
			}

			const res = await fetch(`/api/sessions/${sessionId}/end`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ endMode: mode, newProcessName }),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const slug = organizationSlug || "default";
			if (mode === "full") {
				toast.success(t("toast.sessionEndedFull"));
				router.push(`/${slug}/session/${sessionId}/review`);
			} else if (mode === "save_only") {
				toast.success(t("toast.sessionEndedSave"));
				router.push(`/${slug}/procesos`);
			} else {
				toast.info(t("toast.sessionDiscarded"));
				router.push(`/${slug}`);
			}
		} catch (err) {
			console.error("[MeetingView] End session failed:", err);
			toast.error(t("toast.sessionEndError"));
		} finally {
			setEndLoading(false);
			setShowEndDialog(false);
		}
	}, [sessionId, organizationSlug, router, modelerApi]);

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

	// Zen mode: toggle both panels at once
	const zenRef = useRef(false);
	const toggleZenMode = useCallback(() => {
		// If entering zen mode, collapse both. If already in zen, restore both.
		const entering = !zenRef.current;
		zenRef.current = entering;
		setLeftCollapsed(entering);
		setRightCollapsed(entering);
	}, []);

	// Keyboard shortcuts for panel toggles
	const panelShortcuts = useMemo<ShortcutDef[]>(() => [
		{ key: "\\", ctrl: true, handler: () => { if (layoutMode === "default") toggleZenMode(); }, description: "Zen mode (toggle ambos paneles)" },
		{ key: "[", ctrl: true, handler: () => { if (layoutMode === "default") setLeftCollapsed((p) => !p); }, description: "Toggle panel izquierdo" },
		{ key: "]", ctrl: true, handler: () => { if (layoutMode === "default") setRightCollapsed((p) => !p); }, description: "Toggle panel derecho" },
		{ key: "l", ctrl: true, shift: true, handler: () => setLayoutMode((m) => m === "default" ? "chat-focus" : "default"), description: "Cambiar layout" },
	], [toggleZenMode, layoutMode]);
	useKeyboardShortcuts(panelShortcuts);

	// Assemble context value
	const contextValue: LiveSessionContextValue = {
		sessionId,
		processId: currentProcessId,
		shareToken,
		...liveData,
		aiEnabled,
		selectedTool,
		layoutMode,
		activeCentralTab,
		openPropertyTabs,
		selectedNodeId,
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
		setSelectedNodeId,
		setProcessId: setCurrentProcessId,
		setLayoutMode,
	};

	// Mobile: render simplified mobile view
	if (isMobile) {
		return (
			<LiveSessionProvider value={contextValue}>
				<MeetingViewMobile />
				<EndSessionDialog
					open={showEndDialog}
					onOpenChange={setShowEndDialog}
					onConfirm={handleEndConfirm}
					loading={endLoading}
					hasProcess={!!currentProcessId}
					defaultProcessName={processName}
				/>
			</LiveSessionProvider>
		);
	}

	return (
		<LiveSessionProvider value={contextValue}>
			<div
				className="grid overflow-hidden bg-chrome-base font-sans"
				data-chrome=""
				style={{
					zoom: "var(--font-scale, 1)",
					width: "calc(100vw / var(--font-scale, 1))",
					height: "calc(100vh / var(--font-scale, 1))",
					gridTemplateRows: "48px 1fr 36px",
					gridTemplateColumns: layoutMode === "chat-focus"
						? "1fr 1fr 0px"
						: `${leftCollapsed ? "0px" : "220px"} 1fr ${rightCollapsed ? "0px" : "280px"}`,
					gridTemplateAreas: `
						"top    top    top"
						"left   canvas right"
						"bottom bottom bottom"
					`,
					transition: "grid-template-columns 200ms ease",
				}}
			>
				{/* Connection banners removed — managed by LiveIndicator in TopBar */}
				<TopBar processName={processName} clientName={clientName} />
				{layoutMode === "default" ? (
					<LeftPanel collapsed={leftCollapsed} />
				) : (
					<ExpandedSipocChat />
				)}
				<CentralCanvas containerRef={containerRef} leftCollapsed={layoutMode === "chat-focus" || leftCollapsed} rightCollapsed={layoutMode === "chat-focus" || rightCollapsed} onToggleLeft={layoutMode === "default" ? () => setLeftCollapsed((p) => !p) : undefined} onToggleRight={layoutMode === "default" ? () => setRightCollapsed((p) => !p) : undefined} />
				{layoutMode === "default" && (
					activeCentralTab !== "diagram" && selectedNodeId ? (
						<SopPanel collapsed={rightCollapsed} />
					) : (
						<RightPanel organizationId={organizationId} processId={currentProcessId} collapsed={rightCollapsed} />
					)
				)}
				<BottomBar />
			</div>

			<EndSessionDialog
				open={showEndDialog}
				onOpenChange={setShowEndDialog}
				onConfirm={handleEndConfirm}
				loading={endLoading}
				hasProcess={!!currentProcessId}
				defaultProcessName={processName}
			/>
		</LiveSessionProvider>
	);
}
