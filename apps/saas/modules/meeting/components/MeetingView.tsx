"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DiagramPanel } from "./DiagramPanel";
import { TeleprompterPanel } from "./TeleprompterPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { AiSuggestionsPanel } from "./AiSuggestionsPanel";
import { StatusBar } from "./StatusBar";
import type { DiagramNode, BotActivity, ActivityLogEntry } from "../types";

/**
 * MeetingView — Live process elicitation (rewrite: clean, minimal, functional)
 *
 * Based on the working DiagramTab pattern from /procesos/[processId].
 * Layout: diagram canvas (top) + 3-column bottom panel + status bar.
 * Fullscreen: diagram takes 100vh, bottom panels hidden.
 */

// ── DiagramContext: cross-component communication (replaces window global) ──

interface DiagramContextType {
	addNodeToCanvas: ((node: DiagramNode) => void) | null;
	registerAddNode: (fn: (node: DiagramNode) => void) => void;
	zoomToElement: ((label: string) => void) | null;
	registerZoomToElement: (fn: (label: string) => void) => void;
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

export function MeetingView({
	sessionId,
	sessionType,
	processName,
	botId,
	startedAt,
	processId,
	organizationId,
	organizationSlug,
	bpmnXml,
}: MeetingViewProps) {
	const router = useRouter();

	// ── State ──
	const [nodes, setNodes] = useState<DiagramNode[]>([]);
	const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
	const [currentQuestion, setCurrentQuestion] = useState(
		sessionType === "DISCOVERY"
			? "Cuentame sobre las areas principales de negocio y las operaciones core de tu empresa."
			: `Vamos a mapear el proceso "${processName}". ¿Donde empieza?`,
	);
	const [questionQueue, setQuestionQueue] = useState<string[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<"connected" | "degraded" | "disconnected">(
		botId ? "connected" : "disconnected",
	);
	const [isRecording, setIsRecording] = useState(!!botId);
	const [elapsedTime, setElapsedTime] = useState(() => {
		if (!startedAt) return 0;
		return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
	});
	const [sessionStatus, setSessionStatus] = useState<"ACTIVE" | "ENDED">("ACTIVE");
	const [isEndingSession, setIsEndingSession] = useState(false);

	// Bot activity
	const [botActivity, setBotActivity] = useState<BotActivity>({
		type: "listening", detail: null, updatedAt: null, stale: true,
	});
	const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

	// Teleprompter extras
	const [completenessScore, setCompletenessScore] = useState<number | undefined>();
	const [gapType, setGapType] = useState<string | undefined>();

	// Flash triggers
	const prevNodeCountRef = useRef(0);
	const prevQuestionRef = useRef<string | null>(null);
	const [newNodesArrived, setNewNodesArrived] = useState(false);
	const [newQuestionArrived, setNewQuestionArrived] = useState(false);

	// ── DiagramContext refs ──
	const addNodeFnRef = useRef<((node: DiagramNode) => void) | null>(null);
	const zoomToElementFnRef = useRef<((label: string) => void) | null>(null);

	const registerAddNode = useCallback((fn: (node: DiagramNode) => void) => {
		addNodeFnRef.current = fn;
	}, []);
	const registerZoomToElement = useCallback((fn: (label: string) => void) => {
		zoomToElementFnRef.current = fn;
	}, []);

	const diagramContext: DiagramContextType = {
		addNodeToCanvas: addNodeFnRef.current,
		registerAddNode,
		zoomToElement: zoomToElementFnRef.current,
		registerZoomToElement,
	};

	// ── Poll live data every 3s ──
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

			// Flash on new nodes
			const nodeCount = data.nodes?.length ?? 0;
			if (nodeCount > prevNodeCountRef.current && prevNodeCountRef.current > 0) {
				setNewNodesArrived(true);
				setTimeout(() => setNewNodesArrived(false), 100);
			}
			prevNodeCountRef.current = nodeCount;

			// Flash on new question + smart zoom
			if (data.teleprompterQuestion) {
				if (prevQuestionRef.current && data.teleprompterQuestion !== prevQuestionRef.current) {
					setNewQuestionArrived(true);
					setTimeout(() => setNewQuestionArrived(false), 100);
					// Smart zoom: find node label mentioned in question
					if (zoomToElementFnRef.current && nodes.length > 0) {
						const q = data.teleprompterQuestion.toLowerCase();
						for (const n of nodes) {
							if (n.label && q.includes(n.label.toLowerCase())) {
								zoomToElementFnRef.current(n.label);
								break;
							}
						}
					}
				}
				prevQuestionRef.current = data.teleprompterQuestion;
				setCurrentQuestion(data.teleprompterQuestion);
			}

			if (data.questionQueue?.length > 0) setQuestionQueue(data.questionQueue);
			if (data.completenessScore != null) setCompletenessScore(data.completenessScore);
			if (data.gapType) setGapType(data.gapType);

			if (data.botActivity) {
				setBotActivity(data.botActivity.stale
					? { ...data.botActivity, type: "listening" as const }
					: data.botActivity);
			}

			if (data.status === "ENDED") {
				setConnectionStatus("disconnected");
				setIsRecording(false);
				setSessionStatus("ENDED");
			}
		} catch { /* silent — next poll retries */ }
	}, [sessionId, nodes]);

	useEffect(() => {
		const interval = setInterval(fetchLiveData, 3000);
		fetchLiveData();
		return () => clearInterval(interval);
	}, [fetchLiveData]);

	// Activity log
	useEffect(() => {
		if (botActivity.type === "listening" || !botActivity.detail) return;
		setActivityLog((prev) => {
			const last = prev[prev.length - 1];
			if (last && last.type === botActivity.type && Date.now() - last.timestamp < 5000) return prev;
			return [...prev.slice(-2), { type: botActivity.type, detail: botActivity.detail!, timestamp: Date.now() }];
		});
	}, [botActivity]);

	// Elapsed time
	useEffect(() => {
		const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
		return () => clearInterval(timer);
	}, []);

	// ── Node confirm/reject ──
	const handleAddSuggestion = async (node: DiagramNode) => {
		if (addNodeFnRef.current) addNodeFnRef.current(node);
		setNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, state: "confirmed" as const } : n));
		await fetch(`/api/sessions/${sessionId}/nodes/${node.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "confirm" }),
		});
	};

	const handleRejectNode = async (nodeId: string) => {
		setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, state: "rejected" as const } : n));
		await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "reject" }),
		});
	};

	const handleEndSession = async () => {
		if (!window.confirm("¿Terminar esta sesion? Se generaran los entregables automaticamente.")) return;
		setIsEndingSession(true);
		await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
		setTimeout(() => {
			router.push(`/${organizationSlug || organizationId}/session/${sessionId}/review`);
		}, 3000);
	};

	const formingNodes = nodes.filter((n) => n.state === "forming");

	// ── Render ──

	// Session ending overlay
	if (isEndingSession) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/95">
				<div className="flex flex-col items-center gap-6 text-center">
					<h2 className="text-3xl font-bold text-white">Sesion finalizada</h2>
					<p className="text-lg text-slate-400">Generando entregables...</p>
					<div className="flex flex-col gap-3">
						{["Resumen ejecutivo", "Auditoria de proceso", "Matriz RACI", "Analisis de riesgos"].map((label) => (
							<div key={label} className="flex items-center gap-3 text-slate-300">
								<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								<span className="text-sm">{label}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<DiagramContext.Provider value={diagramContext}>
			<div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
				{/* ═══ DIAGRAM (60% height) ═══ */}
				<div className="relative" style={{ height: "60%" }}>
					<DiagramPanel
						bpmnXml={bpmnXml}
						processId={processId}
						sessionId={sessionId}
						sessionType={sessionType}
						sessionStatus={sessionStatus}
						isFlashing={newNodesArrived}
						nodes={nodes}
					/>
				</div>

				{/* ═══ BOTTOM SECTION ═══ */}
				<div className="h-1 flex-shrink-0 bg-[#0F172A]" />

				<div className="flex flex-1 overflow-hidden bg-[#0F172A]">
					{/* Teleprompter */}
					<div className="w-[300px] flex-shrink-0 overflow-y-auto border-r border-[#1E293B]">
						<TeleprompterPanel
							currentQuestion={currentQuestion}
							questionQueue={questionQueue}
							aiSuggestion={null}
							sessionType={sessionType}
							isFlashing={newQuestionArrived}
							completenessScore={completenessScore}
							gapType={gapType}
						/>
					</div>

					{/* Transcript */}
					<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
						<TranscriptPanel
							entries={transcript}
							sessionId={sessionId}
							sessionStatus={sessionStatus}
						/>
					</div>

					{/* AI Suggestions */}
					<div className="w-[280px] flex-shrink-0 overflow-y-auto border-l border-[#1E293B]">
						<AiSuggestionsPanel
							suggestions={formingNodes}
							onAddNode={handleAddSuggestion}
							onRejectNode={handleRejectNode}
							sessionId={sessionId}
							processId={processId}
						/>
					</div>
				</div>

				{/* ═══ STATUS BAR (always visible) ═══ */}
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
