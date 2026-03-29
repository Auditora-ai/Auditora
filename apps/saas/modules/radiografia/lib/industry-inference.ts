/**
 * Industry Inference Prompt
 *
 * Takes a business context (from web crawl or manual description)
 * and infers: industry, critical processes, and selects the
 * highest-risk process for the instant radiografia.
 *
 * ~500 input tokens, ~500 output tokens. Temperature 0.3.
 */

import { z } from "zod";
import { instrumentedGenerateText } from "@repo/ai";
import { parseLlmJson } from "@repo/ai";

const IndustryInferenceResultSchema = z.object({
	industry: z.string(),
	criticalProcesses: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
				riskLevel: z.enum(["high", "medium"]),
			}),
		)
		.min(1)
		.max(5),
	selectedProcess: z.object({
		name: z.string(),
		description: z.string(),
	}),
});

export type IndustryInferenceResult = z.infer<
	typeof IndustryInferenceResultSchema
>;

const SYSTEM_PROMPT = `You are a senior BPM consultant specializing in process risk analysis.
Given a business description (from a company website or manual input), you must:
1. Identify the industry/sector
2. List the 3 most critical business processes for this type of company
3. Select the ONE process with the highest operational risk (the one most likely to have hidden vulnerabilities)

Respond in JSON format. ALL text content must be in Spanish.

Output schema:
{
  "industry": "sector name in Spanish",
  "criticalProcesses": [
    { "name": "process name", "description": "1-2 sentence description", "riskLevel": "high" | "medium" }
  ],
  "selectedProcess": {
    "name": "the highest-risk process name",
    "description": "2-3 sentence description of this process, what it involves, typical steps, and why it matters"
  }
}

Rules:
- Process names should be specific and actionable (e.g., "Gestión de pedidos y despacho" not "Operaciones")
- The selectedProcess.description must be rich enough to generate SIPOC analysis from it
- Focus on processes where failures have real business impact (revenue, compliance, customer satisfaction)
- If the business context is thin, infer based on industry standards`;

export async function inferIndustry(
	businessContext: string,
): Promise<IndustryInferenceResult | null> {
	const userPrompt = `Business context:\n\n${businessContext}`;

	const result = await instrumentedGenerateText({
		organizationId: "public",
		pipeline: "industry-inference",
		model: "claude-sonnet-4-6",
		system: SYSTEM_PROMPT,
		prompt: userPrompt,
		maxOutputTokens: 1024,
		temperature: 0.3,
	});

	if (!result.text) return null;

	return parseLlmJson(
		result.text,
		IndustryInferenceResultSchema,
		"industry-inference",
	);
}
