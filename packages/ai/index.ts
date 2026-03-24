import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// Base exports (DO NOT REMOVE — used by packages/api)
export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

// aiprocess.me AI models
export const processExtractionModel = anthropic("claude-sonnet-4-6");
export const teleprompterModel = anthropic("claude-sonnet-4-6");

// Re-export AI SDK
export * from "ai";
export * from "./lib";

// aiprocess.me pipelines
export { extractProcessUpdates } from "./src/pipelines/process-extraction";
export type { BpmnNode, ExtractionResult, SuggestedPattern } from "./src/pipelines/process-extraction";
export { generateNextQuestion } from "./src/pipelines/teleprompter";
export type { TeleprompterResult, TeleprompterGapType, SipocCoverage } from "./src/pipelines/teleprompter";
export { extractDiscoveryUpdates } from "./src/pipelines/discovery-extraction";
export type { DiscoveryResult, DiscoveryProcess, BusinessInsights } from "./src/pipelines/discovery-extraction";
export { extractFromChat } from "./src/pipelines/chat-extraction";
export type { ChatExtractionResult, ExtractedProcess, ProcessChatContext } from "./src/pipelines/chat-extraction";

// aiprocess.me context
export { buildSessionContext, clearSessionContextCache } from "./src/context/session-context";
export type { SessionContext } from "./src/context/session-context";

// aiprocess.me providers
export { createCallBotProvider, RecallAiProvider } from "./src/providers/call-bot";
export type { CallBotProvider, BotStatus } from "./src/providers/call-bot";
export { createSTTProvider } from "./src/providers/stt";
export type { TranscriptionEvent } from "./src/providers/stt";

export { generateSessionSummary } from "./src/pipelines/session-summary";
export type { SummaryResult } from "./src/pipelines/session-summary";

// aiprocess.me new pipelines (Caballo de Troya)
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

// Company Brain Enrichment
export { enrichCompanyBrain } from "./src/pipelines/company-brain-enrichment";
export type { EnrichmentInput, EnrichmentOutput } from "./src/pipelines/company-brain-enrichment";
export { CompanyBrainEnrichmentSchema } from "./src/schemas/company-brain";
export type {
  CompanyBrainEnrichment,
  OrgContextExtraction,
  ValueChainActivityExtraction,
  ProcessLinkExtraction,
  GlobalRoleExtraction,
  GlobalSystemExtraction,
  ProcessCategorization,
} from "./src/schemas/company-brain";

// Consulting Deliverables Suite (Phase 2)
export { generateMissionVision } from "./src/pipelines/mission-vision";
export type { MissionVisionInput } from "./src/pipelines/mission-vision";
export { MissionVisionResultSchema } from "./src/schemas/mission-vision";
export type { MissionVisionResult } from "./src/schemas/mission-vision";

export { generateValueChain } from "./src/pipelines/value-chain";
export type { ValueChainInput } from "./src/pipelines/value-chain";
export { ValueChainResultSchema } from "./src/schemas/value-chain";
export type { ValueChainResult, ValueChainActivity } from "./src/schemas/value-chain";

export { generateProcessLandscape } from "./src/pipelines/process-landscape";
export type { ProcessLandscapeInput } from "./src/pipelines/process-landscape";
export { ProcessLandscapeResultSchema } from "./src/schemas/process-landscape";
export type { ProcessLandscapeResult, LandscapeProcess } from "./src/schemas/process-landscape";

export { generateHorizontalView } from "./src/pipelines/horizontal-view";
export type { HorizontalViewInput } from "./src/pipelines/horizontal-view";
export { HorizontalViewResultSchema } from "./src/schemas/horizontal-view";
export type { HorizontalViewResult, HorizontalStep, Handoff } from "./src/schemas/horizontal-view";

export { generateProcedure } from "./src/pipelines/procedure-gen";
export type { ProcedureGenInput } from "./src/pipelines/procedure-gen";
export { ProcedureResultSchema } from "./src/schemas/procedure-gen";
export type { ProcedureResult, ProcedureStep } from "./src/schemas/procedure-gen";

// Process Pattern Templates
export { PROCESS_PATTERNS, getPatternById, getPatternSummariesForPrompt } from "./src/templates/process-patterns";
export type { ProcessPattern, ProcessPatternNode } from "./src/templates/process-patterns";

// Free Tools pipelines (lead magnets)
export { extractSipoc } from "./src/pipelines/sipoc-extraction";
export type { SipocResult, SipocItem, SipocStep } from "./src/pipelines/sipoc-extraction";
export { scoreComplexity } from "./src/pipelines/complexity-score";
export type { ComplexityResult, ComplexityBreakdown } from "./src/pipelines/complexity-score";
export { convertBpmnToText } from "./src/pipelines/bpmn-to-text";
export type { BpmnToTextResult, BpmnDecision } from "./src/pipelines/bpmn-to-text";

// Diagram Repair
export { repairDiagram } from "./src/pipelines/diagram-repair";
export type { RepairInput, RepairResult, RepairChange } from "./src/pipelines/diagram-repair";

// Redis-backed activity state
export { setActivity, getActivity, deleteActivity } from "./src/utils/redis";
export type { ActivityState } from "./src/utils/redis";

// aiprocess.me prompts (for testing/eval)
export { PROCESS_EXTRACTION_SYSTEM, buildExtractionSystemPrompt } from "./src/prompts/process-extraction";
export { TELEPROMPTER_SYSTEM, buildTeleprompterSystemPrompt } from "./src/prompts/teleprompter";
export { DISCOVERY_EXTRACTION_SYSTEM } from "./src/prompts/discovery-extraction";
