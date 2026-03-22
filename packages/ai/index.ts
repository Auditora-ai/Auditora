import { anthropic } from "@ai-sdk/anthropic";

// Prozea AI models
export const processExtractionModel = anthropic("claude-sonnet-4-5-20250514");
export const teleprompterModel = anthropic("claude-sonnet-4-5-20250514");

// Re-export AI SDK
export * from "ai";
export * from "./lib";

// Prozea pipelines
export { extractProcessUpdates } from "./src/pipelines/process-extraction";
export type { BpmnNode, ExtractionResult } from "./src/pipelines/process-extraction";
export { generateNextQuestion } from "./src/pipelines/teleprompter";
export type { TeleprompterResult } from "./src/pipelines/teleprompter";

// Prozea prompts (for testing/eval)
export { PROCESS_EXTRACTION_SYSTEM } from "./src/prompts/process-extraction";
export { TELEPROMPTER_SYSTEM } from "./src/prompts/teleprompter";
