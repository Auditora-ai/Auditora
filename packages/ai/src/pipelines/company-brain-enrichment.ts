/**
 * Company Brain Enrichment Pipeline
 *
 * Extracts organizational knowledge from transcripts and documents
 * to populate the Company Brain. Goes beyond L1 process extraction
 * to capture the full organizational context a BPM consultant needs.
 *
 * Pipeline:
 *   TRANSCRIPT/DOCUMENT → [This Pipeline] → ENRICHMENT DATA → [Caller persists to DB]
 *
 * Data Flow:
 *   INPUT ──▶ VALIDATION ──▶ LLM CALL ──▶ PARSE ──▶ OUTPUT
 *     │            │              │           │         │
 *     ▼            ▼              ▼           ▼         ▼
 *   [empty?]   [too short?]  [timeout?]  [malformed?] [low confidence?]
 *   return {}   return {}    retry 1x    retry strict  mark as draft
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  CompanyBrainEnrichmentSchema,
  type CompanyBrainEnrichment,
} from "../schemas/company-brain";
import {
  COMPANY_BRAIN_ENRICHMENT_SYSTEM,
  COMPANY_BRAIN_ENRICHMENT_USER,
} from "../prompts/company-brain-enrichment";
import { parseLlmJson } from "../utils/parse-llm-json";

const EMPTY_RESULT: CompanyBrainEnrichment = {
  orgContext: undefined,
  valueChainActivities: [],
  processLinks: [],
  roles: [],
  systems: [],
  processCategories: [],
};

const MIN_TEXT_LENGTH = 100; // Skip very short inputs

export interface EnrichmentInput {
  /** The text to analyze (transcript or document content) */
  text: string;
  /** Whether this is from a session transcript or an uploaded document */
  sourceType: "transcript" | "document";
  /** Existing knowledge to avoid duplicates */
  existingContext?: {
    orgName?: string;
    industry?: string;
    existingProcesses?: string[];
    existingRoles?: string[];
    existingSystems?: string[];
  };
}

export interface EnrichmentOutput {
  data: CompanyBrainEnrichment;
  /** Overall confidence of the extraction (0-1) */
  overallConfidence: number;
  /** Token usage for tracking */
  tokensUsed: number;
}

/**
 * Extract organizational knowledge from text to enrich the Company Brain.
 *
 * Returns structured data that the caller persists to the normalized
 * Company Brain tables. Does NOT write to DB directly.
 */
export async function enrichCompanyBrain(
  input: EnrichmentInput,
): Promise<EnrichmentOutput> {
  if (!input.text || input.text.trim().length < MIN_TEXT_LENGTH) {
    return {
      data: EMPTY_RESULT,
      overallConfidence: 0,
      tokensUsed: 0,
    };
  }

  // Truncate very long inputs to stay within token limits
  const maxChars = 30_000; // ~7500 tokens
  const text =
    input.text.length > maxChars
      ? input.text.substring(0, maxChars)
      : input.text;

  let result: CompanyBrainEnrichment | null = null;
  let tokensUsed = 0;

  // First attempt
  try {
    const response = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: COMPANY_BRAIN_ENRICHMENT_SYSTEM,
      prompt: COMPANY_BRAIN_ENRICHMENT_USER(
        text,
        input.sourceType,
        input.existingContext,
      ),
      maxOutputTokens: 4096,
      temperature: 0.1,
    });

    tokensUsed = response.usage?.totalTokens ?? 0;
    result = parseLlmJson(
      response.text,
      CompanyBrainEnrichmentSchema,
      "CompanyBrainEnrichment",
    );
  } catch (error) {
    console.error(
      "[CompanyBrainEnrichment] First attempt failed:",
      error instanceof Error ? error.message : error,
    );
  }

  // Retry with stricter prompt if first attempt failed
  if (!result) {
    try {
      const response = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        system:
          COMPANY_BRAIN_ENRICHMENT_SYSTEM +
          "\n\nIMPORTANT: Return ONLY valid JSON. No prose, no explanation, no markdown. Just the JSON object.",
        prompt: COMPANY_BRAIN_ENRICHMENT_USER(
          text,
          input.sourceType,
          input.existingContext,
        ),
        maxOutputTokens: 4096,
        temperature: 0,
      });

      tokensUsed += response.usage?.totalTokens ?? 0;
      result = parseLlmJson(
        response.text,
        CompanyBrainEnrichmentSchema,
        "CompanyBrainEnrichment-retry",
      );
    } catch (retryError) {
      console.error(
        "[CompanyBrainEnrichment] Retry also failed:",
        retryError instanceof Error ? retryError.message : retryError,
      );
    }
  }

  if (!result) {
    return {
      data: EMPTY_RESULT,
      overallConfidence: 0,
      tokensUsed,
    };
  }

  // Calculate overall confidence
  const confidences: number[] = [];
  if (result.orgContext?.mission?.confidence) {
    confidences.push(result.orgContext.mission.confidence);
  }
  if (result.orgContext?.vision?.confidence) {
    confidences.push(result.orgContext.vision.confidence);
  }
  if (result.orgContext?.valuesConfidence) {
    confidences.push(result.orgContext.valuesConfidence);
  }
  for (const link of result.processLinks) {
    confidences.push(link.confidence);
  }

  const overallConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : result.valueChainActivities.length > 0 ||
          result.roles.length > 0 ||
          result.systems.length > 0
        ? 0.5 // Some data extracted but no confidence scores
        : 0;

  return {
    data: result,
    overallConfidence,
    tokensUsed,
  };
}
