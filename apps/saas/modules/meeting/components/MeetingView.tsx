"use client";

import { useState } from "react";
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
}

export function MeetingView({ sessionId, sessionType, processName }: MeetingViewProps) {
  const [layout, setLayout] = useState<LayoutPreset>("balanced");
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    sessionType === "DISCOVERY"
      ? "Walk me through your company's main business areas and core operations."
      : `Let's map the "${processName}" process. Where does it start?`
  );
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "degraded" | "disconnected">("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentLayout = LAYOUT_PRESETS[layout];

  const handleConfirmNode = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, state: "confirmed" as const } : n))
    );
  };

  const handleRejectNode = (nodeId: string) => {
    // Cascade rejection: children of rejected node go to forming
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
        if (n.id === nodeId) return { ...n, state: "rejected" as const };
        if (childIds.has(n.id)) return { ...n, state: "forming" as const };
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
        confirmedCount={nodes.filter((n) => n.state === "confirmed").length}
        formingCount={nodes.filter((n) => n.state === "forming").length}
        elapsedTime={elapsedTime}
        layout={layout}
        onLayoutChange={setLayout}
        sessionId={sessionId}
      />
    </div>
  );
}
