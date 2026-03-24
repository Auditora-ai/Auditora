/**
 * Process Complexity Score Pipeline
 *
 * Generates a complexity score (1-10) from a plain-text process description.
 * Lightweight pipeline — minimal tokens, fast response.
 *
 * Pipeline:
 *   TEXT DESCRIPTION -> [This Pipeline] -> SCORE + BREAKDOWN
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { parseLlmJson } from "../utils/parse-llm-json";

const ComplexityResultSchema = z.object({
  score: z.number().min(1).max(10),
  breakdown: z.object({
    roles: z.number().min(0).catch(0),
    decisions: z.number().min(0).catch(0),
    exceptions: z.number().min(0).catch(0),
    integrations: z.number().min(0).catch(0),
    steps: z.number().min(0).catch(0),
  }),
  explanation: z.string().catch(""),
  recommendation: z.string().catch(""),
});

export interface ComplexityBreakdown {
  roles: number;
  decisions: number;
  exceptions: number;
  integrations: number;
  steps: number;
}

export interface ComplexityResult {
  score: number;
  breakdown: ComplexityBreakdown;
  explanation: string;
  recommendation: string;
}

export async function scoreComplexity(
  processDescription: string,
): Promise<ComplexityResult> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a BPM analyst assessing process complexity.
Given a process description, analyze its complexity on a scale of 1-10.

Score guide:
- 1-3: Simple (linear flow, 1-2 roles, no exceptions)
- 4-6: Moderate (some decisions/exceptions, 3-5 roles, some system integrations)
- 7-9: Complex (multiple decision points, many exceptions, 5+ roles, multiple systems)
- 10: Extremely complex (enterprise-scale, dozens of roles, heavy regulatory/compliance)

Count these dimensions:
- roles: number of distinct roles/actors involved
- decisions: number of decision points (gateways)
- exceptions: number of exception/error paths
- integrations: number of system integrations mentioned
- steps: number of process steps/activities

Respond ONLY with valid JSON:
{
  "score": 7,
  "breakdown": { "roles": 5, "decisions": 3, "exceptions": 2, "integrations": 4, "steps": 12 },
  "explanation": "One sentence explaining the score",
  "recommendation": "One sentence suggesting how to simplify or manage this complexity"
}`,
    prompt: `Assess the complexity of this process:\n\n${processDescription}`,
    maxOutputTokens: 500,
  });

  const parsed = parseLlmJson(text, ComplexityResultSchema, "complexity-score");
  if (!parsed) throw new Error("Failed to parse complexity score result");
  return parsed;
}
