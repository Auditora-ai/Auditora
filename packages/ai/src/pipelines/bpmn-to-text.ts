/**
 * BPMN to Plain Language Pipeline
 *
 * Converts BPMN 2.0 XML into a human-readable narrative.
 * Useful for non-technical stakeholders who receive BPMN diagrams
 * but can't read them.
 *
 * Pipeline:
 *   BPMN XML -> [This Pipeline] -> NARRATIVE + ACTORS + KEY DECISIONS
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { parseLlmJson } from "../utils/parse-llm-json";

const BpmnToTextResultSchema = z.object({
  processName: z.string().catch("Unnamed Process"),
  narrative: z.string().catch(""),
  actors: z.array(z.string()).catch([]),
  keyDecisions: z
    .array(
      z.object({
        question: z.string(),
        outcomes: z.array(z.string()).catch([]),
      }),
    )
    .catch([]),
  summary: z.string().catch(""),
});

export interface BpmnDecision {
  question: string;
  outcomes: string[];
}

export interface BpmnToTextResult {
  processName: string;
  narrative: string;
  actors: string[];
  keyDecisions: BpmnDecision[];
  summary: string;
}

export async function convertBpmnToText(
  bpmnXml: string,
): Promise<BpmnToTextResult> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a business analyst who translates BPMN diagrams into clear, plain-language narratives.

Given BPMN 2.0 XML, produce:
1. A process name
2. A narrative description written as if explaining the process to a non-technical stakeholder. Use natural paragraphs, not bullet points. Reference roles/actors by name. Describe the flow step by step, including decision points and their outcomes.
3. A list of all actors/roles involved
4. Key decisions (gateways) with their possible outcomes
5. A one-sentence executive summary

Write in the same language as the task/element names in the BPMN.
If element names are in Spanish, write the narrative in Spanish.

Respond ONLY with valid JSON:
{
  "processName": "string",
  "narrative": "The process begins when... (2-4 paragraphs)",
  "actors": ["Role 1", "Role 2"],
  "keyDecisions": [{ "question": "Is the request approved?", "outcomes": ["Yes: proceed to...", "No: return to..."] }],
  "summary": "One sentence summary"
}`,
    prompt: `Convert this BPMN diagram to a plain-language narrative:\n\n${bpmnXml}`,
    maxOutputTokens: 2000,
  });

  const parsed = parseLlmJson(text, BpmnToTextResultSchema, "bpmn-to-text");
  if (!parsed) throw new Error("Failed to parse BPMN-to-text result");
  return parsed;
}
