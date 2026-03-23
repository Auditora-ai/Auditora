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
export { extractDiscoveryUpdates } from "./src/pipelines/discovery-extraction";
export type { DiscoveryResult, DiscoveryProcess, BusinessInsights } from "./src/pipelines/discovery-extraction";
export { extractFromChat } from "./src/pipelines/chat-extraction";
export type { ChatExtractionResult, ExtractedProcess, ProcessChatContext } from "./src/pipelines/chat-extraction";

// Prozea context
export { buildSessionContext, clearSessionContextCache } from "./src/context/session-context";
export type { SessionContext } from "./src/context/session-context";

// Prozea providers
export { createCallBotProvider } from "./src/providers/call-bot";
export type { CallBotProvider, BotStatus } from "./src/providers/call-bot";
export { createSTTProvider } from "./src/providers/stt";
export type { TranscriptionEvent } from "./src/providers/stt";

export { generateSessionSummary } from "./src/pipelines/session-summary";
export type { SummaryResult } from "./src/pipelines/session-summary";

// Prozea new pipelines (Caballo de Troya)
export { extractFromDocument } from "./src/pipelines/document-extraction";
export type { DocumentExtractionResult } from "./src/pipelines/document-extraction";
export { generateRaci } from "./src/pipelines/raci-generator";
export type { RaciAssignment, RaciGeneratorResult } from "./src/pipelines/raci-generator";
export { consolidateStakeholders } from "./src/pipelines/stakeholder-consolidation";
export type { StakeholderConflict, ConsolidationResult } from "./src/pipelines/stakeholder-consolidation";

// Process Intelligence
export { auditProcess, mergeSnapshotPatch, KnowledgeSnapshotSchema } from "./src/pipelines/process-audit";
export type { AuditInput, AuditResult, KnowledgeSnapshot } from "./src/pipelines/process-audit";

// Risk & Quality Layer
export { auditRisks, calculateResidualRisk } from "./src/pipelines/risk-audit";
export type { RiskAuditInput, RiskAuditResult } from "./src/pipelines/risk-audit";

// Prozea prompts (for testing/eval)
export { PROCESS_EXTRACTION_SYSTEM, buildExtractionSystemPrompt } from "./src/prompts/process-extraction";
export { TELEPROMPTER_SYSTEM, buildTeleprompterSystemPrompt } from "./src/prompts/teleprompter";
export { DISCOVERY_EXTRACTION_SYSTEM } from "./src/prompts/discovery-extraction";
