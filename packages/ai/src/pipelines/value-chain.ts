/**
 * Value Chain (Porter) Generation Pipeline
 *
 * Generates a Porter value chain analysis from Company Brain data.
 *
 * Pipeline:
 *   COMPANY BRAIN + PROCESSES + ROLES + SYSTEMS → [This Pipeline] → VALUE CHAIN DOC
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import {
  ValueChainResultSchema,
  type ValueChainResult,
} from "../schemas/value-chain";
import { VALUE_CHAIN_SYSTEM, VALUE_CHAIN_USER } from "../prompts/value-chain";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface ValueChainInput {
  organizationId: string;
  orgName: string;
  industry?: string;
  businessModel?: string;
  processNames: Array<{ name: string; category?: string; description?: string }>;
  valueChainActivities?: Array<{ name: string; type: string; description?: string }>;
  roles?: Array<{ name: string; department?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  transcriptExcerpts?: string[];
  documentExcerpts?: string[];
}

export async function generateValueChain(
  input: ValueChainInput,
): Promise<ValueChainResult> {
  const { text, usage } = await instrumentedGenerateText({
    organizationId: input.organizationId,
    pipeline: "value-chain",
    system: VALUE_CHAIN_SYSTEM,
    prompt: VALUE_CHAIN_USER(input),
    maxOutputTokens: 8192,
    temperature: 0.2,
  });

  const result = parseLlmJson(text, ValueChainResultSchema, "ValueChain");

  if (!result) {
    throw new Error("Failed to parse value chain output from LLM");
  }

  console.log(
    `[ValueChain] Generated for ${input.orgName}: primary=${result.primaryActivities.length}, support=${result.supportActivities.length}, confidence=${result.overallConfidence}, tokens=${usage?.totalTokens ?? 0}`,
  );

  return result;
}
