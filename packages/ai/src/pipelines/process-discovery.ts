/**
 * Process Discovery Pipeline
 *
 * Chat-based process identification for the session wizard.
 * Helps consultants identify which process to work on from
 * a natural language description.
 *
 * Pipeline:
 *   CHAT MESSAGES + PROCESS LIST → [This Pipeline] → RESPONSE + SUGGESTION → [Wizard UI]
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  PROCESS_DISCOVERY_SYSTEM,
  PROCESS_DISCOVERY_USER,
} from "../prompts/process-discovery";
import { parseLlmJson } from "../utils/parse-llm-json";

const ProcessSuggestionSchema = z.object({
  suggestedProcess: z.string().min(1),
  area: z.string().min(1),
  sessionType: z.enum(["DISCOVERY", "DEEP_DIVE", "CONTINUATION"]),
  confidence: z.number().min(0).max(1),
  isExisting: z.boolean().catch(false),
});

export type ProcessSuggestion = z.infer<typeof ProcessSuggestionSchema>;

export interface ProcessDiscoveryResult {
  response: string;
  suggestion: ProcessSuggestion | null;
}

export interface ProcessDiscoveryInput {
  organizationId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  existingProcesses: string[];
  organizationContext?: string;
}

/**
 * Run one turn of the process discovery chat.
 * Returns the AI response text and optionally a process suggestion (when confident enough).
 */
export async function discoverProcess(
  input: ProcessDiscoveryInput,
): Promise<ProcessDiscoveryResult> {
  const { organizationId, messages, existingProcesses, organizationContext } =
    input;

  if (messages.length === 0) {
    return {
      response:
        "¡Hola! Cuéntame qué proceso necesitas documentar. Puede ser el nombre exacto o una descripción general — yo te ayudo a identificarlo.",
      suggestion: null,
    };
  }

  const { text } = await instrumentedGenerateText({
    organizationId,
    pipeline: "process-discovery",
    system: PROCESS_DISCOVERY_SYSTEM,
    prompt: PROCESS_DISCOVERY_USER(
      messages,
      existingProcesses,
      organizationContext,
    ),
    maxOutputTokens: 1024,
    temperature: 0.4,
  });

  // Try to extract JSON suggestion from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  let suggestion: ProcessSuggestion | null = null;

  if (jsonMatch?.[1]) {
    suggestion = parseLlmJson(
      jsonMatch[1],
      ProcessSuggestionSchema,
      "ProcessDiscovery",
    );
  }

  // Clean the response text (remove JSON block if present)
  const response = text.replace(/```json[\s\S]*?```/, "").trim();

  return { response, suggestion };
}
