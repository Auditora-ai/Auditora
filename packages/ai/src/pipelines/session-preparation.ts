/**
 * Session Preparation Pipeline
 *
 * Generates intelligent meeting invitations with role-specific
 * preparation instructions. Single-shot generation.
 *
 * Pipeline:
 *   PROCESS CONTEXT + PARTICIPANTS + SESSION TYPE → [This Pipeline] → INVITATION → [Wizard UI]
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  SESSION_PREPARATION_SYSTEM,
  SESSION_PREPARATION_USER,
  type SessionPrepInput,
} from "../prompts/session-preparation";
import { parseLlmJson } from "../utils/parse-llm-json";

const SessionPreparationResultSchema = z.object({
  title: z.string().min(1),
  intro: z.string().min(1),
  roleInstructions: z.record(z.string(), z.string()),
  intakeQuestions: z.array(z.string()).min(1).catch([]),
  contextSummary: z.string().catch(""),
  suggestedDuration: z.number().min(15).max(180).catch(60),
});

export type SessionPreparationResult = z.infer<
  typeof SessionPreparationResultSchema
>;

/**
 * Generate an intelligent meeting invitation with role-specific preparation materials.
 */
export async function prepareSessionInvitation(
  organizationId: string,
  input: SessionPrepInput,
): Promise<SessionPreparationResult> {
  const { text } = await instrumentedGenerateText({
    organizationId,
    pipeline: "session-preparation",
    system: SESSION_PREPARATION_SYSTEM,
    prompt: SESSION_PREPARATION_USER(input),
    maxOutputTokens: 2048,
    temperature: 0.3,
  });

  const result = parseLlmJson(
    text,
    SessionPreparationResultSchema,
    "SessionPreparation",
  );

  if (!result) {
    return {
      title: `Sesión de ${input.sessionType === "DISCOVERY" ? "Descubrimiento" : input.sessionType === "DEEP_DIVE" ? "Profundización" : "Continuación"}: ${input.processName}`,
      intro: `Sesión de elicitación del proceso "${input.processName}".`,
      roleInstructions: {},
      intakeQuestions: [
        "¿Cuáles son los pasos principales del proceso?",
        "¿Quiénes participan en cada etapa?",
        "¿Cuáles son los principales problemas o cuellos de botella?",
      ],
      contextSummary: input.context || "",
      suggestedDuration: 60,
    };
  }

  return result;
}
