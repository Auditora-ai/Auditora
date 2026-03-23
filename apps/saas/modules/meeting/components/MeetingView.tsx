"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TeleprompterPanel } from "./TeleprompterPanel";
import { DiagramPanel } from "./DiagramPanel";
import { StatusBar } from "./StatusBar";
import { WorkspacePanel } from "./WorkspacePanel";
import type {
	DiagramNode,
	BotActivity,
	ActivityLogEntry,
} from "../types";

/**
 * MeetingView — Core 3-panel layout for live process elicitation
 *
 * ┌─────────────┬──────────────────┬─────────────┐
 * │ TELEPROMPTER │   LIVE DIAGRAM   │ TRANSCRIPT  │
 * │  (card)      │   (card)         │  (card)     │
 * ├─────────────┴──────────────────┴─────────────┤
 * │              STATUS BAR                       │
 * └───────────────────────────────────────────────┘
 *
 * Uses supastarter design tokens (bg-card, bg-background, border-border, etc.)
 * Polls /api/sessions/[id]/live-data every 3 seconds for transcript updates.
 */

type LayoutPreset = "balanced" | "diagram-focus" | "transcript-focus" | "fullscreen";

const LAYOUT_PRESETS: Record<LayoutPreset, { left: string; center: string; right: string }> = {
	balanced: { left: "22%", center: "50%", right: "28%" },
	"diagram-focus": { left: "15%", center: "70%", right: "15%" },
	"transcript-focus": { left: "20%", center: "40%", right: "40%" },
	fullscreen: { left: "0%", center: "100%", right: "0%" },
};

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	timestamp: number;
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
}

export function MeetingView({
	sessionId,
	sessionType,
	processName,
	clientName,
	botId,
	startedAt,
	processId,
	organizationId,
}: MeetingViewProps) {
	const router = useRouter();
	const [layout, setLayout] = useState<LayoutPreset>("balanced");
	const [nodes, setNodes] = useState<DiagramNode[]>([]);
	const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
	const [currentQuestion, setCurrentQuestion] = useState<string>(
		sessionType === "DISCOVERY"
			? "Walk me through your company's main business areas and core operations."
			: `Let's map the "${processName}" process. Where does it start?`,
	);
	const [questionQueue, setQuestionQueue] = useState<string[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "degraded" | "disconnected"
	>(botId ? "connected" : "disconnected");
	const [isRecording, setIsRecording] = useState(!!botId);
	const [aiSuggestion] = useState<string | null>(null);
	const [elapsedTime, setElapsedTime] = useState(() => {
		if (!startedAt) return 0;
		return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
	});
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [sessionStatus, setSessionStatus] = useState<"ACTIVE" | "ENDED">("ACTIVE");

	// Bot activity feedback state
	const [botActivity, setBotActivity] = useState<BotActivity>({
		type: "listening",
		detail: null,
		updatedAt: null,
		stale: true,
	});
	const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
	const prevNodeCountRef = useRef(0);
	const prevQuestionRef = useRef<string | null>(null);
	const [newNodesArrived, setNewNodesArrived] = useState(false);
	const [newQuestionArrived, setNewQuestionArrived] = useState(false);

	// Save previous layout when entering fullscreen, restore on exit
	const [prevLayout, setPrevLayout] = useState<LayoutPreset>("balanced");
	const currentLayout = LAYOUT_PRESETS[isFullscreen ? "fullscreen" : layout];

	const handleToggleFullscreen = useCallback(() => {
		setIsFullscreen((prev) => {
			if (!prev) setPrevLayout(layout);
			return !prev;
		});
	}, [layout]);

	// Exit fullscreen on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isFullscreen) {
				setIsFullscreen(false);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isFullscreen]);

	// Poll for live data every 3 seconds
	const fetchLiveData = useCallback(async () => {
		try {
			const res = await fetch(`/api/sessions/${sessionId}/live-data`);
			if (!res.ok) return;

			const data = await res.json();

			if (data.transcript?.length > 0) {
				if (transcript.length === 0) {
					console.log(`[DIAG-CLIENT] First transcript received at ${new Date().toISOString()}, entries=${data.transcript.length}`);
				}
				setTranscript(data.transcript);
				setConnectionStatus("connected");
				setIsRecording(true);
			}

			if (data.nodes?.length > 0) {
				setNodes(data.nodes);
			}

			// Detect new nodes for panel flash + sound
			const nodeCount = data.nodes?.length ?? 0;
			if (nodeCount > prevNodeCountRef.current && prevNodeCountRef.current > 0) {
				setNewNodesArrived(true);
				setTimeout(() => setNewNodesArrived(false), 100);
			}
			prevNodeCountRef.current = nodeCount;

			// Detect new teleprompter question for panel flash
			if (data.teleprompterQuestion) {
				if (
					prevQuestionRef.current &&
					data.teleprompterQuestion !== prevQuestionRef.current
				) {
					setNewQuestionArrived(true);
					setTimeout(() => setNewQuestionArrived(false), 100);
				}
				prevQuestionRef.current = data.teleprompterQuestion;
				setCurrentQuestion(data.teleprompterQuestion);
			}

			if (data.questionQueue?.length > 0) {
				setQuestionQueue(data.questionQueue);
			}

			// Bot activity state
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

	// Activity log — append on activity changes (deduplicated)
	useEffect(() => {
		if (botActivity.type === "listening" || !botActivity.detail) return;
		setActivityLog((prev) => {
			const last = prev.at(-1);
			if (
				last &&
				last.type === botActivity.type &&
				Date.now() - last.timestamp < 5000
			) {
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

	// Elapsed time counter
	useEffect(() => {
		const timer = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const handleConfirmNode = async (nodeId: string) => {
		// Optimistic update
		setNodes((prev) =>
			prev.map((n) =>
				n.id === nodeId ? { ...n, state: "confirmed" as const } : n,
			),
		);
		// Persist to DB
		await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "confirm" }),
		});
	};

	const handleEndSession = async () => {
		const confirmed = window.confirm(
			"¿Terminar esta sesión? Se detendrá la grabación y se finalizará el diagrama.",
		);
		if (!confirmed) return;
		await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
		router.back();
	};

	const handleRejectNode = async (nodeId: string) => {
		// Optimistic update
		setNodes((prev) =>
			prev.map((n) =>
				n.id === nodeId ? { ...n, state: "rejected" as const } : n,
			),
		);
		// Persist to DB
		await fetch(`/api/sessions/${sessionId}/nodes/${nodeId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "reject" }),
		});
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-lg border border-border bg-background">
			{/* Main 3-panel layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left: Teleprompter */}
				{!isFullscreen && (
					<div
						className="flex-shrink-0 border-r border-border bg-card"
						style={{ width: currentLayout.left }}
					>
						<TeleprompterPanel
							currentQuestion={currentQuestion}
							questionQueue={questionQueue}
							aiSuggestion={aiSuggestion}
							sessionType={sessionType}
							isFlashing={newQuestionArrived}
						/>
					</div>
				)}

				{/* Center: Live Diagram */}
				<div
					className="flex-1 bg-card"
					style={{ width: currentLayout.center }}
				>
					<DiagramPanel
						nodes={nodes}
						onConfirmNode={handleConfirmNode}
						onRejectNode={handleRejectNode}
						sessionType={sessionType}
						sessionStatus={sessionStatus}
						isFullscreen={isFullscreen}
						onToggleFullscreen={handleToggleFullscreen}
						isFlashing={newNodesArrived}
						processId={processId}
					/>
				</div>

				{/* Right: Workspace (tabbed panel) */}
				{!isFullscreen && (
					<div
						className="flex-shrink-0 overflow-hidden border-l border-border bg-card"
						style={{ width: currentLayout.right }}
					>
						<WorkspacePanel
							transcript={transcript}
							sessionId={sessionId}
							processId={processId}
							organizationId={organizationId}
							sessionStatus={sessionStatus}
							sessionType={sessionType}
							compact={layout === "diagram-focus"}
						/>
					</div>
				)}
			</div>

			{/* Status Bar */}
			<StatusBar
				connectionStatus={connectionStatus}
				isRecording={isRecording}
				nodeCount={nodes.length}
				confirmedCount={
					nodes.filter((n) => n.state === "confirmed").length
				}
				formingCount={
					nodes.filter((n) => n.state === "forming").length
				}
				elapsedTime={elapsedTime}
				layout={layout}
				onLayoutChange={setLayout}
				sessionId={sessionId}
				onEndSession={handleEndSession}
				botActivity={botActivity}
				activityLog={activityLog}
				onNewNodes={newNodesArrived}
			/>
		</div>
	);
}
