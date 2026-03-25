/**
 * Process Extraction Pipeline
 *
 * Converts conversation transcripts into BPMN diagram updates.
 * Uses sliding window context (last 5 min) + current BPMN state.
 *
 * Pipeline:
 *   AUDIO -> [Deepgram STT] -> TRANSCRIPT -> [This Pipeline] -> BPMN DIFF -> [Broadcast]
 *
 * Latency budget: 4-5s for LLM call (within 8s total pipeline budget)
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  buildExtractionSystemPrompt,
  PROCESS_EXTRACTION_USER,
} from "../prompts/process-extraction";
import type { SessionContext } from "../context/session-context";
import { parseLlmJson } from "../utils/parse-llm-json";

const VALID_NODE_TYPES = [
  "startEvent",
  "endEvent",
  "task",
  "userTask",
  "serviceTask",
  "manualTask",
  "businessRuleTask",
  "subProcess",
  "exclusiveGateway",
  "parallelGateway",
  "timerEvent",
  "messageEvent",
  "signalEvent",
  "conditionalEvent",
  "textAnnotation",
  "dataObject",
] as const;

const NodePropertiesSchema = z.object({
  description: z.string().optional(),
  responsable: z.string().optional(),
  slaValue: z.number().nullable().optional(),
  slaUnit: z.enum(["minutes", "hours", "days"]).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "per_event"]).optional(),
  systems: z.array(z.string()).optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  estimatedDuration: z.number().nullable().optional(),
  costPerExecution: z.number().nullable().optional(),
  costCurrency: z.string().optional(),
}).optional();

const NewNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(VALID_NODE_TYPES).catch("task"),
  label: z.string().min(1),
  lane: z.string().optional(),
  connectFrom: z.string().nullable().optional(),
  connectTo: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).catch(0.5),
  properties: NodePropertiesSchema,
});

const OutOfScopeSchema = z.object({
  topic: z.string().min(1),
  likelyProcess: z.string().min(1),
});

const SuggestedPatternSchema = z.object({
  patternId: z.string(),
  confidence: z.number().min(0).max(1),
  message: z.string(),
});

const ExtractionResultSchema = z.object({
  newNodes: z.array(NewNodeSchema).catch([]),
  updatedNodes: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        lane: z.string().optional(),
        type: z.string().optional(),
        properties: NodePropertiesSchema,
      }),
    )
    .catch([]),
  outOfScope: z.array(OutOfScopeSchema).catch([]),
  suggestedPattern: SuggestedPatternSchema.nullable().catch(null),
});

export interface BpmnNode {
  id: string;
  type: string;
  label: string;
  state: "forming" | "confirmed" | "rejected";
  lane?: string;
  connections: string[];
  positionX?: number;
  positionY?: number;
}

export interface SuggestedPattern {
  patternId: string;
  confidence: number;
  message: string;
}

export interface ExtractionResult {
  newNodes: Array<{
    id: string;
    type: string;
    label: string;
    lane?: string;
    connectFrom?: string | null;
    connectTo?: string | null;
    confidence: number;
    properties?: Record<string, any>;
  }>;
  updatedNodes: Array<{
    id: string;
    label?: string;
    properties?: Record<string, any>;
  }>;
  outOfScope?: Array<{
    topic: string;
    likelyProcess: string;
  }>;
  suggestedPattern?: SuggestedPattern | null;
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
 *
 * @param currentNodes - Current BPMN diagram nodes
 * @param recentTranscript - Recent transcript entries
 * @param context - Optional session context for business-aware extraction
 */
export async function extractProcessUpdates(
  currentNodes: BpmnNode[],
  recentTranscript: TranscriptEntry[],
  context?: SessionContext,
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
    model: anthropic("claude-sonnet-4-6"),
    system: buildExtractionSystemPrompt(context),
    prompt: PROCESS_EXTRACTION_USER(nodesForPrompt, transcriptText, context),
    maxOutputTokens: 2048,
    temperature: 0.1, // Low temperature for structured output
  });

  const result = parseLlmJson(text, ExtractionResultSchema, "ProcessExtraction");
  if (!result) {
    return { newNodes: [], updatedNodes: [] };
  }

  return {
    newNodes: result.newNodes,
    updatedNodes: result.updatedNodes,
    outOfScope:
      result.outOfScope.length > 0 ? result.outOfScope : undefined,
    suggestedPattern: result.suggestedPattern ?? undefined,
  };
}
