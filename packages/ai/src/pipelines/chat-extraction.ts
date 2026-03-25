/**
 * Chat Extraction Pipeline
 *
 * Extracts process definitions from conversational discovery chat.
 * Unlike discovery-extraction (which processes real-time transcript
 * streams), this works with user-initiated chat messages.
 *
 * Pipeline:
 *   CHAT MESSAGE -> [This Pipeline] -> PROCESS DEFINITIONS + FOLLOW-UP
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  CHAT_EXTRACTION_SYSTEM,
  CHAT_EXTRACTION_USER,
} from "../prompts/chat-extraction";
import { parseLlmJson } from "../utils/parse-llm-json";

const ExtractedProcessSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  suggestedLevel: z
    .enum(["MACRO_PROCESS", "PROCESS", "SUBPROCESS", "TASK", "PROCEDURE"])
    .catch("PROCESS"),
  suggestedCategory: z
    .enum(["strategic", "core", "support"])
    .catch("core"),
  owner: z.string().optional(),
  triggers: z.array(z.string()).catch([]),
  outputs: z.array(z.string()).catch([]),
});

const ChatExtractionResultSchema = z.object({
  extractedProcesses: z.array(ExtractedProcessSchema).catch([]),
  followUpQuestion: z.string().optional(),
  conversationalResponse: z.string().catch(""),
});

export interface ExtractedProcess {
  name: string;
  description?: string;
  suggestedLevel: "MACRO_PROCESS" | "PROCESS" | "SUBPROCESS" | "TASK" | "PROCEDURE";
  suggestedCategory: "strategic" | "core" | "support";
  owner?: string;
  triggers: string[];
  outputs: string[];
}

export interface ChatExtractionResult {
  extractedProcesses: ExtractedProcess[];
  followUpQuestion?: string;
  conversationalResponse: string;
}

export interface ProcessChatContext {
  targetProcess: {
    name: string;
    level: string;
    description?: string;
    triggers: string[];
    outputs: string[];
    goals: string[];
    owner?: string;
    siblings: string[];
  };
  intelligenceGaps?: Array<{
    question: string;
    category: string;
    priority: number;
  }>;
  completenessScore?: number;
  rejectedNames?: string[];
}

/**
 * Extract process definitions from a chat conversation.
 *
 * @param messages - Chat messages (user + assistant)
 * @param existingProcesses - Already known processes (to avoid duplicates)
 * @param projectContext - Optional project context for business-aware extraction
 */
export async function extractFromChat(
  organizationId: string,
  messages: Array<{ role: string; content: string }>,
  existingProcesses: Array<{
    name: string;
    level: string;
    category?: string;
  }>,
  projectContext?: {
    clientName?: string;
    clientIndustry?: string;
    projectGoals?: string;
    liveTranscript?: string;
  },
  processContext?: ProcessChatContext,
  currentDiagramNodes?: Array<{
    id: string;
    type: string;
    label: string;
    state: string;
    lane?: string | null;
  }>,
): Promise<ChatExtractionResult> {
  if (messages.length === 0) {
    return {
      extractedProcesses: [],
      conversationalResponse:
        "Hola! Cuéntame sobre los procesos de la empresa.",
    };
  }

  const { text } = await instrumentedGenerateText({
    organizationId,
    pipeline: "chat-extraction",
    system: CHAT_EXTRACTION_SYSTEM,
    prompt: CHAT_EXTRACTION_USER(messages, existingProcesses, projectContext, processContext, currentDiagramNodes),
    maxOutputTokens: 2048,
    temperature: 0.2,
  });

  const result = parseLlmJson(text, ChatExtractionResultSchema, "ChatExtraction");
  if (!result) {
    return {
      extractedProcesses: [],
      conversationalResponse:
        "Entendido. ¿Puedes darme más detalle sobre los procesos?",
    };
  }
  return result;
}
