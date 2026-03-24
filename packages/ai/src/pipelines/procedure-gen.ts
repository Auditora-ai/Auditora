/**
 * Procedure Generation Pipeline
 *
 * Generates detailed work instructions for a specific BPMN activity.
 * The most granular deliverable — what a person actually does at their desk.
 *
 * Pipeline:
 *   ACTIVITY + BPMN CONTEXT + TRANSCRIPT → [This Pipeline] → WORK PROCEDURE DOC
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  ProcedureResultSchema,
  type ProcedureResult,
} from "../schemas/procedure-gen";
import {
  PROCEDURE_GEN_SYSTEM,
  PROCEDURE_GEN_USER,
} from "../prompts/procedure-gen";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface ProcedureGenInput {
  processName: string;
  activityName: string;
  activityLane?: string;
  processDescription?: string;
  bpmnContext?: string;
  transcriptExcerpts?: string[];
  documentExcerpts?: string[];
  systems?: string[];
  roles?: string[];
}

export async function generateProcedure(
  input: ProcedureGenInput,
): Promise<ProcedureResult> {
  const { text, usage } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: PROCEDURE_GEN_SYSTEM,
    prompt: PROCEDURE_GEN_USER(input),
    maxOutputTokens: 4096,
    temperature: 0.2,
  });

  const result = parseLlmJson(text, ProcedureResultSchema, "ProcedureGen");

  if (!result) {
    throw new Error("Failed to parse procedure output from LLM");
  }

  console.log(
    `[ProcedureGen] Generated for ${input.activityName}: steps=${result.steps.length}, exceptions=${result.steps.reduce((acc, s) => acc + s.exceptions.length, 0)}, gaps=${result.gaps.length}, confidence=${result.overallConfidence}, tokens=${usage?.totalTokens ?? 0}`,
  );

  return result;
}
