/**
 * SIPOC Extraction Pipeline
 *
 * Generates a SIPOC diagram (Suppliers, Inputs, Process, Outputs, Customers)
 * from a plain-text process description. Free tool pipeline.
 *
 * Pipeline:
 *   TEXT DESCRIPTION -> [This Pipeline] -> SIPOC TABLE
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { parseLlmJson } from "../utils/parse-llm-json";

const SipocResultSchema = z.object({
  processName: z.string().catch("Unnamed Process"),
  suppliers: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .catch([]),
  inputs: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .catch([]),
  processSteps: z
    .array(
      z.object({
        name: z.string(),
        order: z.number().catch(0),
      }),
    )
    .catch([]),
  outputs: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .catch([]),
  customers: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .catch([]),
});

export interface SipocItem {
  name: string;
  description?: string;
}

export interface SipocStep {
  name: string;
  order: number;
}

export interface SipocResult {
  processName: string;
  suppliers: SipocItem[];
  inputs: SipocItem[];
  processSteps: SipocStep[];
  outputs: SipocItem[];
  customers: SipocItem[];
}

export async function extractSipoc(
  processDescription: string,
): Promise<SipocResult> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are a BPM consultant specializing in SIPOC analysis.
Given a process description, extract the SIPOC components:

- **Suppliers**: Who provides inputs to this process? (internal departments, external vendors, systems)
- **Inputs**: What materials, information, or resources enter the process?
- **Process**: What are the 5-8 high-level steps of this process? (use verb + noun format)
- **Outputs**: What does this process produce? (deliverables, documents, decisions, data)
- **Customers**: Who receives the outputs? (internal stakeholders, external clients, next process)

Be specific and actionable. Infer reasonable items from context even if not explicitly stated.
If the description is vague, make reasonable assumptions for a typical business process.

Respond ONLY with valid JSON matching this structure:
{
  "processName": "string",
  "suppliers": [{ "name": "string", "description": "string" }],
  "inputs": [{ "name": "string", "description": "string" }],
  "processSteps": [{ "name": "string", "order": 1 }],
  "outputs": [{ "name": "string", "description": "string" }],
  "customers": [{ "name": "string", "description": "string" }]
}`,
    prompt: `Analyze this process and generate a complete SIPOC:\n\n${processDescription}`,
    maxOutputTokens: 1500,
  });

  const parsed = parseLlmJson(text, SipocResultSchema, "sipoc-extraction");
  if (!parsed) throw new Error("Failed to parse SIPOC extraction result");
  return parsed;
}
