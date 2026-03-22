"use client";

import { useCallback, useEffect, useState } from "react";
import { TeleprompterPanel } from "./TeleprompterPanel";
import { DiagramPanel } from "./DiagramPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { StatusBar } from "./StatusBar";

/**
 * MeetingView — Core 3-panel layout for live process elicitation
 *
 * ┌─────────────┬──────────────────┬─────────────┐
 * │ TELEPROMPTER │   LIVE DIAGRAM   │ TRANSCRIPT  │
 * │ (dark, 22%) │   (light, 50%)   │ (dark, 28%) │
 * ├─────────────┴──────────────────┴─────────────┤
 * │              STATUS BAR (dark)                │
 * └───────────────────────────────────────────────┘
 *
 * Polls /api/sessions/[id]/live-data every 3 seconds for transcript updates.
 * Will be replaced with Supabase Realtime in Phase 2.
 */

type LayoutPreset = "balanced" | "diagram-focus" | "transcript-focus";

const LAYOUT_PRESETS: Record<LayoutPreset, { left: string; center: string; right: string }> = {
	balanced: { left: "22%", center: "50%", right: "28%" },
	"diagram-focus": { left: "15%", center: "70%", right: "15%" },
	"transcript-focus": { left: "20%", center: "40%", right: "40%" },
};

interface DiagramNode {
	id: string;
	type: "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway";
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

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
}

export function MeetingView({
	sessionId,
	sessionType,
	processName,
	clientName,
	botId,
}: MeetingViewProps) {
	const [layout, setLayout] = useState<LayoutPreset>("balanced");
	const [nodes, setNodes] = useState<DiagramNode[]>([]);
	const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
	const [currentQuestion, setCurrentQuestion] = useState<string>(
		sessionType === "DISCOVERY"
			? "Walk me through your company's main business areas and core operations."
			: `Let's map the "${processName}" process. Where does it start?`,
	);
	const [questionQueue] = useState<string[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "degraded" | "disconnected"
	>(botId ? "connected" : "disconnected");
	const [isRecording, setIsRecording] = useState(!!botId);
	const [aiSuggestion] = useState<string | null>(null);
	const [elapsedTime, setElapsedTime] = useState(0);

	const currentLayout = LAYOUT_PRESETS[layout];

	// Poll for live data every 3 seconds
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

			if (data.teleprompterQuestion) {
				setCurrentQuestion(data.teleprompterQuestion);
			}

			if (data.status === "ENDED") {
				setConnectionStatus("disconnected");
				setIsRecording(false);
			}
		} catch {
			// Silent fail — next poll will try again
		}
	}, [sessionId]);

	useEffect(() => {
		// Poll every 3 seconds
		const interval = setInterval(fetchLiveData, 3000);
		// Also fetch immediately
		fetchLiveData();

		return () => clearInterval(interval);
	}, [fetchLiveData]);

	// Elapsed time counter
	useEffect(() => {
		const timer = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const handleConfirmNode = (nodeId: string) => {
		setNodes((prev) =>
			prev.map((n) =>
				n.id === nodeId ? { ...n, state: "confirmed" as const } : n,
			),
		);
	};

	const handleRejectNode = (nodeId: string) => {
		setNodes((prev) => {
			const rejectedNode = prev.find((n) => n.id === nodeId);
			if (!rejectedNode) return prev;

			const childIds = new Set<string>();
			const findChildren = (parentId: string) => {
				const parent = prev.find((n) => n.id === parentId);
				if (parent) {
					for (const connId of parent.connections) {
						childIds.add(connId);
						findChildren(connId);
					}
				}
			};
			findChildren(nodeId);

			return prev.map((n) => {
				if (n.id === nodeId)
					return { ...n, state: "rejected" as const };
				if (childIds.has(n.id))
					return { ...n, state: "forming" as const };
				return n;
			});
		});
	};

	return (
		<div className="flex h-screen flex-col bg-slate-950">
			{/* Main 3-panel layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left: Teleprompter (dark) */}
				<div
					className="flex-shrink-0 border-r border-slate-800 bg-slate-900"
					style={{ width: currentLayout.left }}
				>
					<TeleprompterPanel
						currentQuestion={currentQuestion}
						questionQueue={questionQueue}
						aiSuggestion={aiSuggestion}
						sessionType={sessionType}
					/>
				</div>

				{/* Center: Live Diagram (light) */}
				<div
					className="flex-1 bg-white"
					style={{ width: currentLayout.center }}
				>
					<DiagramPanel
						nodes={nodes}
						onConfirmNode={handleConfirmNode}
						onRejectNode={handleRejectNode}
						sessionType={sessionType}
					/>
				</div>

				{/* Right: Transcript (dark) */}
				<div
					className="flex-shrink-0 border-l border-slate-800 bg-slate-900"
					style={{ width: currentLayout.right }}
				>
					<TranscriptPanel entries={transcript} />
				</div>
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
			/>
		</div>
	);
}
