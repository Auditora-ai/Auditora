import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// Supastarter original exports (DO NOT REMOVE — used by packages/api)
export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

// Prozea AI models
export const processExtractionModel = anthropic("claude-sonnet-4-6");
export const teleprompterModel = anthropic("claude-sonnet-4-6");

// Re-export AI SDK
export * from "ai";
export * from "./lib";

// Prozea pipelines
export { extractProcessUpdates } from "./src/pipelines/process-extraction";
export type { BpmnNode, ExtractionResult } from "./src/pipelines/process-extraction";
export { generateNextQuestion } from "./src/pipelines/teleprompter";
export type { TeleprompterResult } from "./src/pipelines/teleprompter";

// Prozea providers
export { createCallBotProvider } from "./src/providers/call-bot";
export type { CallBotProvider, BotStatus } from "./src/providers/call-bot";
export { createSTTProvider } from "./src/providers/stt";
export type { TranscriptionEvent } from "./src/providers/stt";

// Prozea prompts (for testing/eval)
export { PROCESS_EXTRACTION_SYSTEM } from "./src/prompts/process-extraction";
export { TELEPROMPTER_SYSTEM } from "./src/prompts/teleprompter";
