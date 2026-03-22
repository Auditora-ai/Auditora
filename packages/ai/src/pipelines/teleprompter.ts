/**
 * Teleprompter Pipeline
 *
 * Generates contextual guided questions for the consultant.
 * Runs PARALLEL to process extraction — independent pipeline.
 *
 * Latency tolerance: 15-20s (relaxed vs extraction's 8s).
 * If this pipeline is slow or fails, the last question stays visible.
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  TELEPROMPTER_SYSTEM,
  TELEPROMPTER_USER,
} from "../prompts/teleprompter";

export interface TeleprompterResult {
  nextQuestion: string;
  reasoning: string;
  gapType:
    | "missing_path"
    | "missing_role"
    | "missing_exception"
    | "missing_decision"
    | "missing_trigger"
    | "missing_output"
    | "general_exploration";
  confidence: number;
}

interface BpmnNodeSummary {
  id: string;
  type: string;
  label: string;
  lane?: string;
  connections: string[];
}

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

function formatTranscriptWindow(
  entries: TranscriptEntry[],
  windowMinutes: number = 5,
): string {
  if (entries.length === 0) return "(no transcript yet)";

  const latestTimestamp = entries[entries.length - 1].timestamp;
  const windowStart = latestTimestamp - windowMinutes * 60;

  return entries
    .filter((e) => e.timestamp >= windowStart)
    .map((e) => {
      const mins = Math.floor(e.timestamp / 60);
      const secs = Math.floor(e.timestamp % 60);
      return `[${mins}:${secs.toString().padStart(2, "0")}] ${e.speaker}: ${e.text}`;
    })
    .join("\n");
}

/**
 * Generate the next question for the teleprompter.
 *
 * Called less frequently than extraction (~every 20-30 seconds)
 * and on a lower priority in the BullMQ queue.
 */
export async function generateNextQuestion(
  sessionType: "DISCOVERY" | "DEEP_DIVE",
  currentNodes: BpmnNodeSummary[],
  recentTranscript: TranscriptEntry[],
  processName?: string,
): Promise<TeleprompterResult> {
  const transcriptText = formatTranscriptWindow(recentTranscript);

  if (transcriptText === "(no transcript yet)") {
    // Return default opening question
    return {
      nextQuestion:
        sessionType === "DISCOVERY"
          ? "Can you walk me through your company's main business areas and core operations?"
          : `Let's start mapping the "${processName}" process. Where does it begin — what triggers it?`,
      reasoning: "No conversation yet — start with the opening question.",
      gapType: "general_exploration",
      confidence: 1.0,
    };
  }

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: TELEPROMPTER_SYSTEM,
    prompt: TELEPROMPTER_USER(
      sessionType,
      currentNodes,
      transcriptText,
      processName,
    ),
    maxTokens: 512,
    temperature: 0.3, // Slightly more creative than extraction
  });

  try {
    const result = JSON.parse(text) as TeleprompterResult;

    if (!result.nextQuestion) {
      throw new Error("Missing nextQuestion");
    }

    return result;
  } catch {
    console.error("[Teleprompter] Invalid JSON from LLM:", text.substring(0, 200));

    // Fallback: generic follow-up
    return {
      nextQuestion: "Can you tell me more about what happens next in this process?",
      reasoning: "LLM response was invalid — using generic follow-up.",
      gapType: "general_exploration",
      confidence: 0.3,
    };
  }
}
