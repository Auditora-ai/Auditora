/**
 * Teleprompter Pipeline — SIPOC Gap-Driven Methodology
 *
 * Generates contextual guided questions for the consultant using
 * SIPOC framework analysis and gap-driven prioritization.
 * Runs PARALLEL to process extraction — independent pipeline.
 *
 * Latency tolerance: 15-20s (relaxed vs extraction's 8s).
 * If this pipeline is slow or fails, the last question stays visible.
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  buildTeleprompterSystemPrompt,
  TELEPROMPTER_USER,
  QUESTION_MODE_INSTRUCTION,
} from "../prompts/teleprompter";
import type { SessionContext } from "../context/session-context";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface SipocCoverage {
  suppliers: number;  // 0-100
  inputs: number;     // 0-100
  process: number;    // 0-100
  outputs: number;    // 0-100
  customers: number;  // 0-100
}

export type TeleprompterGapType =
  | "missing_role"
  | "missing_exception"
  | "missing_decision"
  | "missing_trigger"
  | "missing_sla"
  | "missing_system"
  | "missing_output"
  | "missing_input"
  | "missing_supplier"
  | "missing_customer"
  | "general_exploration";

export interface TeleprompterResult {
  nextQuestion: string;
  reasoning: string;
  gapType: TeleprompterGapType;
  completenessScore: number; // 0-100
  sipocCoverage: SipocCoverage;
  /** @deprecated Use completenessScore instead. Kept for backward compatibility. */
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

const DEFAULT_SIPOC_COVERAGE: SipocCoverage = {
  suppliers: 0,
  inputs: 0,
  process: 0,
  outputs: 0,
  customers: 0,
};

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
 * Compute completeness score from SIPOC coverage using weighted average.
 * S(15%) + I(20%) + P(30%) + O(20%) + C(15%)
 */
function computeCompletenessScore(sipoc: SipocCoverage): number {
  return Math.round(
    sipoc.suppliers * 0.15 +
    sipoc.inputs * 0.20 +
    sipoc.process * 0.30 +
    sipoc.outputs * 0.20 +
    sipoc.customers * 0.15,
  );
}

/**
 * Generate the next question for the teleprompter.
 *
 * Called less frequently than extraction (~every 20-30 seconds)
 * and on a lower priority in the BullMQ queue.
 *
 * @param sessionType - Type of session (DISCOVERY, DEEP_DIVE, CONTINUATION)
 * @param currentNodes - Current BPMN diagram nodes
 * @param recentTranscript - Recent transcript entries
 * @param processName - Optional name of target process
 * @param context - Optional session context for business-aware question generation
 */
export async function generateNextQuestion(
  organizationId: string,
  sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
  currentNodes: BpmnNodeSummary[],
  recentTranscript: TranscriptEntry[],
  processName?: string,
  context?: SessionContext,
  questionMode?: string,
): Promise<TeleprompterResult> {
  const transcriptText = formatTranscriptWindow(recentTranscript);

  if (transcriptText === "(no transcript yet)") {
    // Return default opening question based on session type
    if (sessionType === "CONTINUATION" && context?.targetProcess) {
      return {
        nextQuestion: `Let's continue mapping the "${context.targetProcess.name}" process. Last session we covered some steps — are there any corrections or additions before we continue?`,
        reasoning:
          "Continuation session — start by validating previous SIPOC mapping before extending.",
        gapType: "general_exploration",
        completenessScore: 0,
        sipocCoverage: { ...DEFAULT_SIPOC_COVERAGE },
        confidence: 1.0,
      };
    }

    return {
      nextQuestion:
        sessionType === "DISCOVERY"
          ? "Can you walk me through your company's main business areas and who the key customers are for your core operations?"
          : `Let's start mapping the "${processName}" process. Who are the customers that receive the output of this process, and what triggers it?`,
      reasoning: "No conversation yet — opening with Customers and Inputs dimensions of SIPOC to frame the process boundaries.",
      gapType: sessionType === "DISCOVERY" ? "missing_customer" : "missing_trigger",
      completenessScore: 0,
      sipocCoverage: { ...DEFAULT_SIPOC_COVERAGE },
      confidence: 1.0,
    };
  }

  const basePrompt = TELEPROMPTER_USER(
    sessionType,
    currentNodes,
    transcriptText,
    processName,
    context,
  );
  const modeInstruction = questionMode && QUESTION_MODE_INSTRUCTION[questionMode]
    ? `\n${QUESTION_MODE_INSTRUCTION[questionMode]}`
    : "";

  const { text } = await instrumentedGenerateText({
    organizationId,
    pipeline: "teleprompter",
    system: buildTeleprompterSystemPrompt(context),
    prompt: basePrompt + modeInstruction,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });

  const SipocCoverageSchema = z.object({
    suppliers: z.number().min(0).max(100).catch(0),
    inputs: z.number().min(0).max(100).catch(0),
    process: z.number().min(0).max(100).catch(0),
    outputs: z.number().min(0).max(100).catch(0),
    customers: z.number().min(0).max(100).catch(0),
  });

  const TeleprompterSchema = z.object({
    nextQuestion: z.string().min(1),
    reasoning: z.string().catch(""),
    gapType: z.enum([
      "missing_role",
      "missing_exception",
      "missing_decision",
      "missing_trigger",
      "missing_sla",
      "missing_system",
      "missing_output",
      "missing_input",
      "missing_supplier",
      "missing_customer",
      "general_exploration",
    ]).catch("general_exploration"),
    completenessScore: z.number().min(0).max(100).catch(0),
    sipocCoverage: SipocCoverageSchema.catch({
      suppliers: 0,
      inputs: 0,
      process: 0,
      outputs: 0,
      customers: 0,
    }),
  });

  const parsed = parseLlmJson(text, TeleprompterSchema, "Teleprompter");
  if (!parsed) {
    return {
      nextQuestion:
        "Can you tell me more about what happens next in this process?",
      reasoning: "LLM response was invalid — using generic follow-up.",
      gapType: "general_exploration",
      completenessScore: 0,
      sipocCoverage: { ...DEFAULT_SIPOC_COVERAGE },
      confidence: 0.3,
    };
  }

  // Recompute completeness from SIPOC to ensure consistency
  const computedScore = computeCompletenessScore(parsed.sipocCoverage);
  const completenessScore = parsed.completenessScore > 0
    ? parsed.completenessScore
    : computedScore;

  return {
    nextQuestion: parsed.nextQuestion,
    reasoning: parsed.reasoning,
    gapType: parsed.gapType,
    completenessScore,
    sipocCoverage: parsed.sipocCoverage,
    // Backward compat: map completeness to 0-1 confidence
    confidence: completenessScore / 100,
  };
}
