/**
 * Process Extraction Pipeline
 *
 * Converts conversation transcripts into BPMN diagram updates.
 * Uses sliding window context (last 5 min) + current BPMN state.
 *
 * Pipeline:
 *   AUDIO → [Deepgram STT] → TRANSCRIPT → [This Pipeline] → BPMN DIFF → [Broadcast]
 *
 * Latency budget: 4-5s for LLM call (within 8s total pipeline budget)
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  PROCESS_EXTRACTION_SYSTEM,
  PROCESS_EXTRACTION_USER,
} from "../prompts/process-extraction";

export interface BpmnNode {
  id: string;
  type: "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway";
  label: string;
  state: "forming" | "confirmed" | "rejected";
  lane?: string;
  connections: string[];
  positionX: number;
  positionY: number;
}

export interface ExtractionResult {
  newNodes: Array<{
    id: string;
    type: string;
    label: string;
    lane?: string;
    connectFrom?: string | null;
    connectTo?: string | null;
  }>;
  updatedNodes: Array<{
    id: string;
    label?: string;
  }>;
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

/**
 * Format transcript entries into a readable string for the LLM.
 * Uses sliding window — only last N minutes of transcript.
 */
function formatTranscriptWindow(
  entries: TranscriptEntry[],
  windowMinutes: number = 5,
): string {
  if (entries.length === 0) return "(no transcript yet)";

  const latestTimestamp = entries[entries.length - 1].timestamp;
  const windowStart = latestTimestamp - windowMinutes * 60;

  const windowEntries = entries.filter((e) => e.timestamp >= windowStart);

  return windowEntries
    .map((e) => {
      const mins = Math.floor(e.timestamp / 60);
      const secs = Math.floor(e.timestamp % 60);
      return `[${mins}:${secs.toString().padStart(2, "0")}] ${e.speaker}: ${e.text}`;
    })
    .join("\n");
}

/**
 * Extract new BPMN nodes from recent transcript.
 *
 * This is the core AI call — called every time we accumulate
 * enough new transcript (typically every 10-15 seconds).
 */
export async function extractProcessUpdates(
  currentNodes: BpmnNode[],
  recentTranscript: TranscriptEntry[],
): Promise<ExtractionResult> {
  const transcriptText = formatTranscriptWindow(recentTranscript);

  // Don't call LLM if transcript window is empty
  if (transcriptText === "(no transcript yet)") {
    return { newNodes: [], updatedNodes: [] };
  }

  const nodesForPrompt = currentNodes.map((n) => ({
    id: n.id,
    type: n.type,
    label: n.label,
    lane: n.lane,
  }));

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: PROCESS_EXTRACTION_SYSTEM,
    prompt: PROCESS_EXTRACTION_USER(nodesForPrompt, transcriptText),
    maxTokens: 1024,
    temperature: 0.1, // Low temperature for structured output
  });

  try {
    const result = JSON.parse(text) as ExtractionResult;

    // Validate structure
    if (!Array.isArray(result.newNodes)) result.newNodes = [];
    if (!Array.isArray(result.updatedNodes)) result.updatedNodes = [];

    // Ensure all new nodes have required fields
    result.newNodes = result.newNodes.filter(
      (n) => n.id && n.type && n.label,
    );

    return result;
  } catch {
    // LLM returned invalid JSON — log and return empty
    console.error("[ProcessExtraction] Invalid JSON from LLM:", text.substring(0, 200));
    return { newNodes: [], updatedNodes: [] };
  }
}
