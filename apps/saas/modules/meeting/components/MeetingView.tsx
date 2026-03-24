"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TeleprompterPanel } from "./TeleprompterPanel";
import { DiagramPanel } from "./DiagramPanel";
import { StatusBar } from "./StatusBar";
import { TranscriptPanel } from "./TranscriptPanel";
import { AiSuggestionsPanel } from "./AiSuggestionsPanel";
import type {
	DiagramNode,
	BotActivity,
	ActivityLogEntry,
} from "../types";

/**
 * MeetingView — Single-screen layout for live process elicitation (Modeler Pro)
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ TOPBAR: Process > Subprocess | EN VIVO | REC 00:34 | [End]  │
 * ├──────────────────────────────────────────────────────────────┤
 * │                                                              │
 * │               BPMN DIAGRAM CANVAS (~60%)                     │
 * │                                                              │
 * │══════════════ draggable resize handle ════════════════════════│
 * │                                                              │
 * │ TELEPROMPTER  │  TRANSCRIPT/CHAT   │  SUGGESTIONS + DOCS     │
 * │ (320px fixed)  │  (flexible center) │  (260px fixed)          │
 * │                │                    │                         │
 * ├──────────────────────────────────────────────────────────────┤
 * │ STATUS BAR                                                   │
 * └──────────────────────────────────────────────────────────────┘
 */

// ── React Context for diagram node operations (replaces window global hack) ──

interface DiagramContextType {
	addNodeToCanvas: ((node: DiagramNode) => void) | null;
	registerAddNode: (fn: (node: DiagramNode) => void) => void;
	zoomToElement: ((labelOrLane: string) => void) | null;
	registerZoomToElement: (fn: (labelOrLane: string) => void) => void;
}

const DiagramContext = createContext<DiagramContextType>({
	addNodeToCanvas: null,
	registerAddNode: () => {},
	zoomToElement: null,
	registerZoomToElement: () => {},
});

export function useDiagramContext() {
	return useContext(DiagramContext);
}

// ── Types ──

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	correctedText?: string | null;
	timestamp: number;
	source?: string;
}

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

// ── Constants ──

const MIN_DIAGRAM_HEIGHT = 200;
const MIN_BOTTOM_HEIGHT = 150;
const DEFAULT_DIAGRAM_RATIO = 0.6; // 60% diagram, 40% bottom

export function MeetingView({
	sessionId,
	sessionType,
	processName,
	clientName,
	botId,
	startedAt,
	processId,
	organizationId,
	organizationSlug,
	bpmnXml,
}: MeetingViewProps) {
	const router = useRouter();

	// ── Core state ──
	const [nodes, setNodes] = useState<DiagramNode[]>([]);
	const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
	const [currentQuestion, setCurrentQuestion] = useState<string>(
		sessionType === "DISCOVERY"
			? "Cuéntame sobre las áreas principales de negocio y las operaciones core de tu empresa."
			: `Vamos a mapear el proceso "${processName}". ¿Dónde empieza?`,
	);
	const [questionQueue, setQuestionQueue] = useState<string[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "degraded" | "disconnected"
	>(botId ? "connected" : "disconnected");
	const [isRecording, setIsRecording] = useState(!!botId);
	const [elapsedTime, setElapsedTime] = useState(() => {
		if (!startedAt) return 0;
		return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
	});
	const [sessionStatus, setSessionStatus] = useState<"ACTIVE" | "ENDED">("ACTIVE");
	const [isEndingSession, setIsEndingSession] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);

	// ── Teleprompter metadata ──
	const [completenessScore, setCompletenessScore] = useState<number | undefined>(undefined);
	const [gapType, setGapType] = useState<string | undefined>(undefined);
	const [sipocCoverage, setSipocCoverage] = useState<
		{ suppliers: number; inputs: number; process: number; outputs: number; customers: number } | undefined
	>(undefined);

	// ── Bot activity ──
	const [botActivity, setBotActivity] = useState<BotActivity>({
		type: "listening",
		detail: null,
		updatedAt: null,
		stale: true,
	});
	const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

	// ── Flash triggers ──
	const prevNodeCountRef = useRef(0);
	const prevQuestionRef = useRef<string | null>(null);
	const [newNodesArrived, setNewNodesArrived] = useState(false);
	const [newQuestionArrived, setNewQuestionArrived] = useState(false);

	// ── Resizable split ──
	const containerRef = useRef<HTMLDivElement>(null);
	const [diagramRatio, setDiagramRatio] = useState(DEFAULT_DIAGRAM_RATIO);
	const isDraggingRef = useRef(false);
	const [isDragging, setIsDragging] = useState(false);

	// ── Diagram Context (replaces window.__diagramPanel_addNode) ──
	const addNodeFnRef = useRef<((node: DiagramNode) => void) | null>(null);
	const registerAddNode = useCallback((fn: (node: DiagramNode) => void) => {
		addNodeFnRef.current = fn;
	}, []);
	const zoomToElementFnRef = useRef<((labelOrLane: string) => void) | null>(null);
	const registerZoomToElement = useCallback((fn: (labelOrLane: string) => void) => {
		zoomToElementFnRef.current = fn;
	}, []);

	const diagramContextValue: DiagramContextType = {
		addNodeToCanvas: addNodeFnRef.current,
		registerAddNode,
		zoomToElement: zoomToElementFnRef.current,
		registerZoomToElement,
	};

	// ── Resize handle drag ──
	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		isDraggingRef.current = true;
		setIsDragging(true);

		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!isDraggingRef.current || !containerRef.current) return;
			const containerRect = containerRef.current.getBoundingClientRect();
			const totalHeight = containerRect.height;
			const mouseY = moveEvent.clientY - containerRect.top;
			const ratio = Math.max(
				MIN_DIAGRAM_HEIGHT / totalHeight,
				Math.min(1 - MIN_BOTTOM_HEIGHT / totalHeight, mouseY / totalHeight),
			);
			setDiagramRatio(ratio);
		};

		const handleMouseUp = () => {
			isDraggingRef.current = false;
			setIsDragging(false);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		document.body.style.cursor = "row-resize";
		document.body.style.userSelect = "none";
	}, []);

	// ── Poll for live data every 3 seconds ──
	const fetchLiveData = useCallback(async () => {
		try {
			const res = await fetch(`/api/sessions/${sessionId}/live-data`);
			if (!res.ok) return;

			const data = await res.json();

			if (data.transcript?.length > 0) {
				setTranscript(data.transcript);
				setConnectionStatus("connected");
				setIsRecording(true);
			}

			if (data.nodes?.length > 0) {
				setNodes(data.nodes);
			}

			// Detect new nodes for flash + sound
			const nodeCount = data.nodes?.length ?? 0;
			if (nodeCount > prevNodeCountRef.current && prevNodeCountRef.current > 0) {
				setNewNodesArrived(true);
				setTimeout(() => setNewNodesArrived(false), 100);
			}
			prevNodeCountRef.current = nodeCount;

			// Detect new teleprompter question for flash + smart zoom
			if (data.teleprompterQuestion) {
				if (
					prevQuestionRef.current &&
					data.teleprompterQuestion !== prevQuestionRef.current
				) {
					setNewQuestionArrived(true);
					setTimeout(() => setNewQuestionArrived(false), 100);

					// Smart zoom: find node labels or lane names mentioned in the question
					const questionLower = data.teleprompterQuestion.toLowerCase();
					const currentNodes = data.nodes || nodes;
					const allLabels = currentNodes.map((n: any) => n.label).filter(Boolean);
					const allLanes = [...new Set(currentNodes.map((n: any) => n.lane).filter(Boolean))] as string[];

					// Check for node label match first (more specific)
					let zoomTarget: string | null = null;
					for (const label of allLabels) {
						if (questionLower.includes(label.toLowerCase())) {
							zoomTarget = label;
							break;
						}
					}
					// Then check for lane/role match
					if (!zoomTarget) {
						for (const lane of allLanes) {
							if (questionLower.includes(lane.toLowerCase())) {
								zoomTarget = lane;
								break;
							}
						}
					}

					if (zoomTarget && zoomToElementFnRef.current) {
						zoomToElementFnRef.current(zoomTarget);
					}
				}
				prevQuestionRef.current = data.teleprompterQuestion;
				setCurrentQuestion(data.teleprompterQuestion);
			}

			// Update teleprompter metadata (completeness, gap type, SIPOC)
			if (data.completenessScore != null) {
				setCompletenessScore(data.completenessScore);
			}
			if (data.gapType != null) {
				setGapType(data.gapType);
			}
			if (data.sipocCoverage != null) {
				setSipocCoverage(data.sipocCoverage);
			}

			if (data.questionQueue?.length > 0) {
				setQuestionQueue(data.questionQueue);
			}

			// Bot activity
			if (data.botActivity) {
				const activity = data.botActivity.stale
					? { ...data.botActivity, type: "listening" as const }
					: data.botActivity;
				setBotActivity(activity);
			}

			if (data.status === "ENDED") {
				setConnectionStatus("disconnected");
				setIsRecording(false);
				setSessionStatus("ENDED");
			}
		} catch {
			// Silent fail — next poll will try again
		}
	}, [sessionId]);

	useEffect(() => {
		const interval = setInterval(fetchLiveData, 3000);
		fetchLiveData();
		return () => clearInterval(interval);
	}, [fetchLiveData]);

	// ── Activity log ──
	useEffect(() => {
		if (botActivity.type === "listening" || !botActivity.detail) return;
		setActivityLog((prev) => {
			const last = prev.at(-1);
			if (last && last.type === botActivity.type && Date.now() - last.timestamp < 5000) {
				return prev;
			}
			const entry: ActivityLogEntry = {
				type: botActivity.type,
				detail: botActivity.detail!,
				timestamp: Date.now(),
			};
			return [...prev.slice(-2), entry];
		});
	}, [botActivity]);

	// ── Elapsed time counter ──
	useEffect(() => {
		const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
		return () => clearInterval(timer);
	}, []);

	// ── Node confirmation/rejection (replaces window global) ──
	const handleAddSuggestion = async (node: DiagramNode) => {
		if (addNodeFnRef.current) {
			addNodeFnRef.current(node);
		}
		setNodes((prev) =>
			prev.map((n) =>
				n.id === node.id ? { ...n, state: "confirmed" as const } : n,
			),
		);
		await fetch(`/api/sessions/${sessionId}/nodes/${node.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "confirm" }),
		});
	};

	const handleRejectNode = async (nodeId: string) => {
		setNodes((prev) =>
			prev.map((n) =>
				n.id === nodeId ? { ...n, state: "rejected" as const } : n,
			),
		);
		await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "reject" }),
		});
	};

	const handleEndSession = async () => {
		const confirmed = window.confirm(
			"¿Terminar esta sesión? Se detendrá la grabación y se generarán los entregables automáticamente.",
		);
		if (!confirmed) return;
		setIsEndingSession(true);
		await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
		setTimeout(() => {
			router.push(`/${organizationSlug || organizationId}/session/${sessionId}/review`);
		}, 3000);
	};

	// ── Forming nodes for suggestions panel ──
	const formingNodes = nodes.filter((n) => n.state === "forming");

	// ── Keyboard shortcuts (Ctrl+1/2/3 panel focus, Enter confirm, Escape cancel) ──
	const [focusedPanel, setFocusedPanel] = useState<"teleprompter" | "transcript" | "suggestions" | null>(null);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// Don't capture when typing in inputs
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

			// Ctrl+1: Focus teleprompter panel
			if (e.ctrlKey && e.key === "1") {
				e.preventDefault();
				const panel = document.querySelector<HTMLElement>('[data-panel="teleprompter"]');
				if (panel) { panel.focus(); setFocusedPanel("teleprompter"); }
				return;
			}

			// Ctrl+2: Focus transcript panel
			if (e.ctrlKey && e.key === "2") {
				e.preventDefault();
				const panel = document.querySelector<HTMLElement>('[data-panel="transcript"]');
				if (panel) { panel.focus(); setFocusedPanel("transcript"); }
				return;
			}

			// Ctrl+3: Focus suggestions panel
			if (e.ctrlKey && e.key === "3") {
				e.preventDefault();
				const panel = document.querySelector<HTMLElement>('[data-panel="suggestions"]');
				if (panel) { panel.focus(); setFocusedPanel("suggestions"); }
				return;
			}

			// Enter: Confirm first forming suggestion when suggestions panel is focused
			if (e.key === "Enter" && focusedPanel === "suggestions" && formingNodes.length > 0) {
				e.preventDefault();
				handleAddSuggestion(formingNodes[0]);
				return;
			}

			// Escape: Exit fullscreen first, then blur panel
			if (e.key === "Escape") {
				if (isFullscreen) {
					setIsFullscreen(false);
					return;
				}
				if (focusedPanel) {
					setFocusedPanel(null);
					(document.activeElement as HTMLElement)?.blur();
				}
				return;
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [sessionStatus, focusedPanel, formingNodes, handleAddSuggestion]);

	// ── Bottom panel tab state (for md breakpoint) ──
	const [activeBottomTab, setActiveBottomTab] = useState<"teleprompter" | "transcript" | "suggestions">("transcript");

	// ── Gap 17: Selected element label for document linking ──
	const [selectedElementLabel, setSelectedElementLabel] = useState<string | null>(null);

	// ── Gap 18: Detachable floating panels ──
	type PanelKey = "teleprompter" | "transcript" | "suggestions";
	const [detachedPanels, setDetachedPanels] = useState<Set<PanelKey>>(new Set());
	const [panelPositions, setPanelPositions] = useState<Record<PanelKey, { x: number; y: number }>>({
		teleprompter: { x: 100, y: 100 },
		transcript: { x: 200, y: 100 },
		suggestions: { x: 300, y: 100 },
	});
	const panelDragRef = useRef<{ panel: PanelKey; startX: number; startY: number; origX: number; origY: number } | null>(null);

	const detachPanel = useCallback((panel: PanelKey) => {
		setDetachedPanels((prev) => new Set(prev).add(panel));
		setPanelPositions((prev) => ({
			...prev,
			[panel]: {
				x: Math.max(50, (window.innerWidth - 400) / 2 + (panel === "teleprompter" ? -220 : panel === "suggestions" ? 220 : 0)),
				y: Math.max(50, (window.innerHeight - 300) / 2),
			},
		}));
	}, []);

	const redockPanel = useCallback((panel: PanelKey) => {
		setDetachedPanels((prev) => {
			const next = new Set(prev);
			next.delete(panel);
			return next;
		});
	}, []);

	const startPanelDrag = useCallback((panel: PanelKey, e: React.MouseEvent) => {
		e.preventDefault();
		const pos = panelPositions[panel];
		panelDragRef.current = { panel, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

		const handleMove = (ev: MouseEvent) => {
			const drag = panelDragRef.current;
			if (!drag) return;
			const dx = ev.clientX - drag.startX;
			const dy = ev.clientY - drag.startY;
			setPanelPositions((prev) => ({
				...prev,
				[drag.panel]: {
					x: Math.max(0, drag.origX + dx),
					y: Math.max(0, drag.origY + dy),
				},
			}));
		};
		const handleUp = () => {
			panelDragRef.current = null;
			document.removeEventListener("mousemove", handleMove);
			document.removeEventListener("mouseup", handleUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
		document.addEventListener("mousemove", handleMove);
		document.addEventListener("mouseup", handleUp);
		document.body.style.cursor = "grabbing";
		document.body.style.userSelect = "none";
	}, [panelPositions]);

	// ── Gap 20: Transcript-diagram bidirectional highlighting ──
	const highlightedEntryIds = useMemo(() => {
		if (!selectedElementLabel) return new Set<string>();
		const needle = selectedElementLabel.toLowerCase();
		const ids = new Set<string>();
		for (const entry of transcript) {
			const text = (entry.correctedText ?? entry.text).toLowerCase();
			if (text.includes(needle)) {
				ids.add(entry.id);
			}
		}
		return ids;
	}, [selectedElementLabel, transcript]);

	const handleTranscriptEntryClick = useCallback((entry: TranscriptEntry) => {
		const text = (entry.correctedText ?? entry.text).toLowerCase();
		for (const node of nodes) {
			if (node.label && text.includes(node.label.toLowerCase())) {
				if (zoomToElementFnRef.current) {
					zoomToElementFnRef.current(node.label);
				}
				break;
			}
		}
	}, [nodes]);

	// Panel labels for floating window headers
	const panelTitles: Record<PanelKey, string> = {
		teleprompter: "Teleprompter",
		transcript: "Transcripcion",
		suggestions: "Sugerencias IA",
	};

	// Helper: detach button (arrow-up-right icon)
	const renderDetachButton = (panel: PanelKey) => (
		<button
			type="button"
			onClick={() => detachPanel(panel)}
			className="ml-auto rounded p-0.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300"
			title="Desprender panel"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
				<path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
			</svg>
		</button>
	);

	// Helper: render a floating panel overlay
	const renderFloatingPanel = (panel: PanelKey, content: React.ReactNode) => {
		if (!detachedPanels.has(panel)) return null;
		const pos = panelPositions[panel];
		return (
			<div
				key={`floating-${panel}`}
				className="rounded-lg border shadow-2xl"
				style={{
					position: "fixed",
					left: pos.x,
					top: pos.y,
					width: 400,
					height: 300,
					zIndex: 50,
					backgroundColor: "#0F172A",
					borderColor: "#334155",
					resize: "both",
					overflow: "auto",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					className="flex flex-shrink-0 cursor-grab items-center gap-2 border-b px-3 py-1.5 active:cursor-grabbing"
					style={{ borderColor: "#334155" }}
					onMouseDown={(e) => startPanelDrag(panel, e)}
				>
					<span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
						{panelTitles[panel]}
					</span>
					<button
						type="button"
						onClick={() => redockPanel(panel)}
						className="ml-auto rounded p-0.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300"
						title="Re-acoplar panel"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
							<path fillRule="evenodd" d="M14.78 5.22a.75.75 0 0 0-1.06 0L6.5 12.44V6.75a.75.75 0 0 0-1.5 0v7.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 0-1.5H7.56l7.22-7.22a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
						</svg>
					</button>
				</div>
				<div className="min-h-0 flex-1 overflow-hidden">
					{content}
				</div>
			</div>
		);
	};

	return (
		<DiagramContext.Provider value={diagramContextValue}>
			{/* ══ MOBILE GUARD (<768px) ══ */}
			<div className="flex h-screen flex-col items-center justify-center bg-[#0F172A] md:hidden">
				<svg
					className="mb-6 h-16 w-16 text-slate-500"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="1.5"
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
				</svg>
				<h2 className="mb-2 text-xl font-semibold text-white">
					Usa un dispositivo con pantalla grande para sesiones en vivo
				</h2>
				<p className="text-sm text-slate-400">
					La sesion en vivo requiere una pantalla de al menos 768px de ancho
				</p>
			</div>

			{/* ══ MAIN LAYOUT (>=768px) ══ */}
			<div
				ref={containerRef}
				className="hidden h-screen flex-col overflow-hidden bg-background md:flex"
			>
				{/* ══ DIAGRAM AREA (top, resizable — fullscreen takes 100%) ══ */}
				<div
					role="region"
					aria-label="Diagrama BPMN"
					className="relative overflow-hidden"
					style={{
						height: isFullscreen ? '100%' : `${diagramRatio * 100}%`,
						transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					}}
				>
					<DiagramPanel
						bpmnXml={bpmnXml}
						processId={processId}
						sessionId={sessionId}
						sessionType={sessionType}
						sessionStatus={sessionStatus}
						isFullscreen={isFullscreen}
						onToggleFullscreen={() => setIsFullscreen((f) => !f)}
						isFlashing={newNodesArrived}
						onSelectedElementChange={setSelectedElementLabel}
						nodes={nodes}
					/>
				</div>

				{/* ══ RESIZE HANDLE (hidden in fullscreen) ══ */}
				{!isFullscreen && (
					<div
						className="group flex h-2 flex-shrink-0 cursor-row-resize items-center justify-center bg-[#0F172A] transition-colors hover:bg-[#334155]"
						onMouseDown={handleResizeStart}
						title="Arrastra para ajustar el tamaño"
					>
						<div className="h-0.5 w-16 rounded-full bg-[#334155] transition-colors group-hover:bg-[#64748B]" />
					</div>
				)}

				{/* ══ BOTTOM PANEL — 3-column (lg+), tabbed (md-lg), hidden in fullscreen ══ */}

				{/* Desktop 3-column layout (>=1024px) */}
				<div
					className={`min-h-0 flex-1 overflow-hidden bg-[#0F172A] lg:flex ${isFullscreen ? "!hidden" : "hidden"}`}
				>
					{/* Left: Teleprompter — xl:320px, lg:260px (Ctrl+1) */}
					{!detachedPanels.has("teleprompter") && (
						<div
							data-panel="teleprompter"
							tabIndex={-1}
							role="region"
							aria-label="Teleprompter — Ctrl+1 para enfocar"
							className={`flex-shrink-0 overflow-hidden border-r border-[#1E293B] lg:w-[260px] xl:w-80 outline-none ${focusedPanel === "teleprompter" ? "ring-1 ring-blue-500/50 ring-inset" : ""}`}
						>
							<div className="flex items-center border-b px-3 py-1" style={{ borderColor: "#1E293B" }}>
								{renderDetachButton("teleprompter")}
							</div>
							<TeleprompterPanel
								currentQuestion={currentQuestion}
								questionQueue={questionQueue}
								aiSuggestion={null}
								sessionType={sessionType}
								isFlashing={newQuestionArrived}
								completenessScore={completenessScore}
								gapType={gapType}
								sipocCoverage={sipocCoverage}
							/>
						</div>
					)}

					{/* Center: Transcript (flexible) (Ctrl+2) */}
					{!detachedPanels.has("transcript") && (
						<div
							data-panel="transcript"
							tabIndex={-1}
							role="region"
							aria-label="Transcripcion — Ctrl+2 para enfocar"
							className={`flex min-w-0 flex-1 flex-col overflow-hidden outline-none ${focusedPanel === "transcript" ? "ring-1 ring-blue-500/50 ring-inset" : ""}`}
						>
							<div className="flex items-center border-b px-3 py-1" style={{ borderColor: "#1E293B" }}>
								{renderDetachButton("transcript")}
							</div>
							<TranscriptPanel
								entries={transcript}
								sessionId={sessionId}
								sessionStatus={sessionStatus}
								highlightedEntryIds={highlightedEntryIds}
								onEntryClick={handleTranscriptEntryClick}
							/>
						</div>
					)}

					{/* Right: AI Suggestions + Docs — xl:260px, lg:220px (Ctrl+3, Enter to confirm) */}
					{!detachedPanels.has("suggestions") && (
						<div
							data-panel="suggestions"
							tabIndex={-1}
							role="region"
							aria-label="Sugerencias de IA — Ctrl+3 para enfocar, Enter para confirmar"
							className={`flex-shrink-0 overflow-hidden border-l border-[#1E293B] lg:w-[220px] xl:w-[260px] outline-none ${focusedPanel === "suggestions" ? "ring-1 ring-blue-500/50 ring-inset" : ""}`}
						>
							<div className="flex items-center border-b px-3 py-1" style={{ borderColor: "#1E293B" }}>
								{renderDetachButton("suggestions")}
							</div>
							<AiSuggestionsPanel
								suggestions={formingNodes}
								onAddNode={handleAddSuggestion}
								onRejectNode={handleRejectNode}
								sessionId={sessionId}
								processId={processId}
								selectedElementLabel={selectedElementLabel}
							/>
						</div>
					)}
				</div>

				{/* Floating detached panels */}
				{renderFloatingPanel("teleprompter", (
					<TeleprompterPanel
						currentQuestion={currentQuestion}
						questionQueue={questionQueue}
						aiSuggestion={null}
						sessionType={sessionType}
						isFlashing={newQuestionArrived}
						completenessScore={completenessScore}
						gapType={gapType}
						sipocCoverage={sipocCoverage}
					/>
				))}
				{renderFloatingPanel("transcript", (
					<TranscriptPanel
						entries={transcript}
						sessionId={sessionId}
						sessionStatus={sessionStatus}
						highlightedEntryIds={highlightedEntryIds}
						onEntryClick={handleTranscriptEntryClick}
					/>
				))}
				{renderFloatingPanel("suggestions", (
					<AiSuggestionsPanel
						suggestions={formingNodes}
						onAddNode={handleAddSuggestion}
						onRejectNode={handleRejectNode}
						sessionId={sessionId}
						processId={processId}
						selectedElementLabel={selectedElementLabel}
					/>
				))}

				{/* Tablet tabbed layout (768-1024px), hidden in fullscreen */}
				<div className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0F172A] lg:hidden ${isFullscreen ? "!hidden" : ""}`}>
					{/* Tab bar */}
					<div className="flex border-b border-[#1E293B]">
						{([
							{ key: "teleprompter" as const, label: "Teleprompter" },
							{ key: "transcript" as const, label: "Transcripcion" },
							{ key: "suggestions" as const, label: "Sugerencias" },
						]).map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveBottomTab(tab.key)}
								className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
									activeBottomTab === tab.key
										? "border-b-2 border-blue-500 text-white"
										: "text-slate-400 hover:text-slate-300"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Tab content */}
					<div className="min-h-0 flex-1 overflow-hidden">
						{activeBottomTab === "teleprompter" && (
							<div role="region" aria-label="Teleprompter" className="h-full">
								<TeleprompterPanel
									currentQuestion={currentQuestion}
									questionQueue={questionQueue}
									aiSuggestion={null}
									sessionType={sessionType}
									isFlashing={newQuestionArrived}
									completenessScore={completenessScore}
									gapType={gapType}
									sipocCoverage={sipocCoverage}
								/>
							</div>
						)}
						{activeBottomTab === "transcript" && (
							<div role="region" aria-label="Transcripcion" className="h-full">
								<TranscriptPanel
									entries={transcript}
									sessionId={sessionId}
									sessionStatus={sessionStatus}
									highlightedEntryIds={highlightedEntryIds}
									onEntryClick={handleTranscriptEntryClick}
								/>
							</div>
						)}
						{activeBottomTab === "suggestions" && (
							<div role="region" aria-label="Sugerencias de IA" className="h-full">
								<AiSuggestionsPanel
									suggestions={formingNodes}
									onAddNode={handleAddSuggestion}
									onRejectNode={handleRejectNode}
									sessionId={sessionId}
									processId={processId}
									selectedElementLabel={selectedElementLabel}
								/>
							</div>
						)}
					</div>
				</div>

				{/* ══ SESSION ENDING OVERLAY ══ */}
				{isEndingSession && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/95">
						<div className="flex flex-col items-center gap-8">
							<h2
								className="text-4xl text-white"
								style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
							>
								Sesion finalizada
							</h2>
							<p className="text-lg text-slate-400">Generando entregables...</p>
							<div className="flex flex-col gap-3">
								{[
									"Resumen ejecutivo",
									"Auditoria de proceso",
									"Matriz RACI",
									"Analisis de riesgos",
								].map((label) => (
									<div key={label} className="flex items-center gap-3 text-slate-300">
										<svg
											className="h-4 w-4 animate-spin text-blue-400"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										<span className="text-sm">{label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* ══ STATUS BAR ══ */}
				<StatusBar
					connectionStatus={connectionStatus}
					isRecording={isRecording}
					nodeCount={nodes.length}
					confirmedCount={nodes.filter((n) => n.state === "confirmed").length}
					formingCount={formingNodes.length}
					elapsedTime={elapsedTime}
					layout="balanced"
					onLayoutChange={() => {}}
					sessionId={sessionId}
					onEndSession={handleEndSession}
					botActivity={botActivity}
					activityLog={activityLog}
					onNewNodes={newNodesArrived}
				/>
			</div>
		</DiagramContext.Provider>
	);
}
