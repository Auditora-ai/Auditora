/**
 * Horizontal View Generation Pipeline
 *
 * Generates end-to-end cross-departmental process flows showing
 * how work moves across the organization with handoffs and pain points.
 *
 * Pipeline:
 *   COMPANY BRAIN + PROCESS LINKS + DEFINITIONS → [This Pipeline] → HORIZONTAL FLOW
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import {
  HorizontalViewResultSchema,
  type HorizontalViewResult,
} from "../schemas/horizontal-view";
import {
  HORIZONTAL_VIEW_SYSTEM,
  HORIZONTAL_VIEW_USER,
} from "../prompts/horizontal-view";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface HorizontalViewInput {
  organizationId: string;
  orgName: string;
  targetFlow?: string;
  processLinks: Array<{
    fromProcess: string;
    toProcess: string;
    linkType: string;
    description?: string;
  }>;
  processDefinitions: Array<{
    name: string;
    description?: string;
    owner?: string;
    triggers: string[];
    outputs: string[];
  }>;
  roles?: Array<{ name: string; department?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  transcriptExcerpts?: string[];
}

export async function generateHorizontalView(
  input: HorizontalViewInput,
): Promise<HorizontalViewResult> {
  const { text, usage } = await instrumentedGenerateText({
    organizationId: input.organizationId,
    pipeline: "horizontal-view",
    system: HORIZONTAL_VIEW_SYSTEM,
    prompt: HORIZONTAL_VIEW_USER(input),
    maxOutputTokens: 8192,
    temperature: 0.2,
  });

  const result = parseLlmJson(
    text,
    HorizontalViewResultSchema,
    "HorizontalView",
  );

  if (!result) {
    throw new Error("Failed to parse horizontal view output from LLM");
  }

  console.log(
    `[HorizontalView] Generated for ${input.orgName}: steps=${result.steps.length}, departments=${result.totalDepartments}, handoffs=${result.totalHandoffs}, painPoints=${result.painPoints.length}, tokens=${usage?.totalTokens ?? 0}`,
  );

  return result;
}
