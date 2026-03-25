/**
 * Process Landscape Generation Pipeline
 *
 * Generates a 3-band process map (Strategic/Core/Support) from
 * Company Brain + ProcessDefinitions.
 *
 * Pipeline:
 *   COMPANY BRAIN + PROCESS DEFINITIONS → [This Pipeline] → LANDSCAPE MAP
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import {
  ProcessLandscapeResultSchema,
  type ProcessLandscapeResult,
} from "../schemas/process-landscape";
import {
  PROCESS_LANDSCAPE_SYSTEM,
  PROCESS_LANDSCAPE_USER,
} from "../prompts/process-landscape";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface ProcessLandscapeInput {
  organizationId: string;
  orgName: string;
  industry?: string;
  processDefinitions: Array<{
    name: string;
    category?: string;
    level: string;
    description?: string;
    hasBpmn: boolean;
    sessionsCount: number;
  }>;
  valueChainActivities?: Array<{ name: string; type: string }>;
  departments?: Array<{ name: string }>;
}

export async function generateProcessLandscape(
  input: ProcessLandscapeInput,
): Promise<ProcessLandscapeResult> {
  const { text, usage } = await instrumentedGenerateText({
    organizationId: input.organizationId,
    pipeline: "process-landscape",
    system: PROCESS_LANDSCAPE_SYSTEM,
    prompt: PROCESS_LANDSCAPE_USER(input),
    maxOutputTokens: 4096,
    temperature: 0.2,
  });

  const result = parseLlmJson(
    text,
    ProcessLandscapeResultSchema,
    "ProcessLandscape",
  );

  if (!result) {
    throw new Error("Failed to parse process landscape output from LLM");
  }

  console.log(
    `[ProcessLandscape] Generated for ${input.orgName}: total=${result.totalProcesses}, documented=${result.documentedCount}, gaps=${result.gapCount}, coverage=${result.coveragePercentage}%, tokens=${usage?.totalTokens ?? 0}`,
  );

  return result;
}
