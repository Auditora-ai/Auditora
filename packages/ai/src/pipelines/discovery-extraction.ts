/**
 * Discovery Extraction Pipeline
 *
 * Extracts L1 process definitions and business insights from
 * DISCOVERY session transcripts. Unlike the process extraction
 * pipeline (which produces BPMN nodes), this produces high-level
 * process definitions for the architecture.
 *
 * Pipeline:
 *   AUDIO -> [Deepgram STT] -> TRANSCRIPT -> [This Pipeline] -> PROCESS DEFINITIONS
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  DISCOVERY_EXTRACTION_SYSTEM,
  DISCOVERY_EXTRACTION_USER,
} from "../prompts/discovery-extraction";
import type { SessionContext } from "../context/session-context";
import { parseLlmJson } from "../utils/parse-llm-json";

const DiscoveryProcessSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
  triggers: z.array(z.string()).catch([]),
  outputs: z.array(z.string()).catch([]),
});

const BusinessInsightsSchema = z.object({
  industry: z.string().optional(),
  businessModel: z.string().optional(),
  keyRoles: z.array(z.string()).catch([]),
});

const DiscoveryResultSchema = z.object({
  processes: z.array(DiscoveryProcessSchema).catch([]),
  businessInsights: BusinessInsightsSchema.catch({
    keyRoles: [],
  }),
});

export interface DiscoveryProcess {
  name: string;
  description?: string;
  owner?: string;
  triggers: string[];
  outputs: string[];
}

export interface BusinessInsights {
  industry?: string;
  businessModel?: string;
  keyRoles: string[];
}

export interface DiscoveryResult {
  processes: DiscoveryProcess[];
  businessInsights: BusinessInsights;
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
 * Extract L1 process definitions from a discovery session transcript.
 *
 * @param recentTranscript - Recent transcript entries
 * @param existingProcesses - Already identified processes (to avoid duplicates)
 * @param context - Optional session context for business-aware extraction
 */
export async function extractDiscoveryUpdates(
  organizationId: string,
  recentTranscript: TranscriptEntry[],
  existingProcesses: Array<{ name: string; description?: string }>,
  context?: SessionContext,
): Promise<DiscoveryResult> {
  const transcriptText = formatTranscriptWindow(recentTranscript);

  if (transcriptText === "(no transcript yet)") {
    return { processes: [], businessInsights: { keyRoles: [] } };
  }

  const { text } = await instrumentedGenerateText({
    organizationId,
    pipeline: "discovery-extraction",
    system: DISCOVERY_EXTRACTION_SYSTEM,
    prompt: DISCOVERY_EXTRACTION_USER(
      transcriptText,
      existingProcesses,
      context,
    ),
    maxOutputTokens: 2048,
    temperature: 0.1,
  });

  const result = parseLlmJson(text, DiscoveryResultSchema, "DiscoveryExtraction");
  if (!result) {
    return { processes: [], businessInsights: { keyRoles: [] } };
  }
  return result;
}
