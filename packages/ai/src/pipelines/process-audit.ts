/**
 * Process Audit Pipeline
 *
 * Audits everything known about a process and identifies gaps,
 * contradictions, and missing information. Supports two modes:
 *   - initial: Full audit of all available data
 *   - incremental: Only processes new data + knowledge snapshot → delta
 *
 * Token efficiency:
 *   Initial: ~10K input, ~4K output (one-time)
 *   Incremental: ~6K input, ~1.5K output (65%+ savings vs re-analyzing)
 *
 * Pipeline:
 *   KNOWLEDGE SNAPSHOT + NEW DATA → LLM → DELTA → Apply to DB
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  PROCESS_AUDIT_SYSTEM,
  PROCESS_AUDIT_INITIAL_ADDENDUM,
  PROCESS_AUDIT_INCREMENTAL_ADDENDUM,
  PROCESS_AUDIT_USER,
} from "../prompts/process-audit";
import { parseLlmJson } from "../utils/parse-llm-json";

// ============================================
// Zod Schemas
// ============================================

const KnowledgeRoleSchema = z.object({
  name: z.string(),
  responsibilities: z.array(z.string()).catch([]),
  department: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeTriggerSchema = z.object({
  description: z.string(),
  sourceProcess: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeStepSchema = z.object({
  label: z.string(),
  role: z.string().optional(),
  system: z.string().optional(),
  format: z.string().optional(),
  hasExceptionPath: z.boolean().catch(false),
  hasDecisionCriteria: z.boolean().catch(false),
  estimatedTime: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeDecisionSchema = z.object({
  label: z.string(),
  criteria: z.string().optional(),
  outcomes: z.array(z.string()).catch([]),
  confirmed: z.boolean().catch(false),
});

const KnowledgeExceptionSchema = z.object({
  step: z.string(),
  scenario: z.string(),
  handling: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeOutputSchema = z.object({
  description: z.string(),
  targetProcess: z.string().optional(),
  format: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeSystemSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  usedInSteps: z.array(z.string()).catch([]),
  vendor: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeFormatSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  usedInSteps: z.array(z.string()).catch([]),
  system: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeSlaSchema = z.object({
  step: z.string().optional(),
  metric: z.string(),
  target: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeVolumetricSchema = z.object({
  step: z.string().optional(),
  scope: z.string().optional(),
  transactionsPerPeriod: z.string().optional(),
  period: z.string().optional(),
  peakVolume: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeCostSchema = z.object({
  step: z.string().optional(),
  scope: z.string().optional(),
  costType: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  period: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeInterProcessLinkSchema = z.object({
  sourceProcess: z.string(),
  targetProcess: z.string(),
  linkType: z.string().optional(),
  description: z.string().optional(),
  confirmed: z.boolean().catch(false),
});

const KnowledgeContradictionSchema = z.object({
  topic: z.string(),
  claims: z
    .array(z.object({ source: z.string(), claim: z.string() }))
    .catch([]),
  resolved: z.boolean().catch(false),
});

export const KnowledgeSnapshotSchema = z.object({
  roles: z.array(KnowledgeRoleSchema).catch([]),
  triggers: z.array(KnowledgeTriggerSchema).catch([]),
  steps: z.array(KnowledgeStepSchema).catch([]),
  decisions: z.array(KnowledgeDecisionSchema).catch([]),
  exceptions: z.array(KnowledgeExceptionSchema).catch([]),
  outputs: z.array(KnowledgeOutputSchema).catch([]),
  systems: z.array(KnowledgeSystemSchema).catch([]),
  formats: z.array(KnowledgeFormatSchema).catch([]),
  slas: z.array(KnowledgeSlaSchema).catch([]),
  volumetrics: z.array(KnowledgeVolumetricSchema).catch([]),
  costs: z.array(KnowledgeCostSchema).catch([]),
  interProcessLinks: z.array(KnowledgeInterProcessLinkSchema).catch([]),
  contradictions: z.array(KnowledgeContradictionSchema).catch([]),
});

export type KnowledgeSnapshot = z.infer<typeof KnowledgeSnapshotSchema>;

const NewGapSchema = z.object({
  category: z.string(),
  question: z.string(),
  context: z.string().catch(""),
  priority: z.number().min(0).max(100).catch(50),
  dependsOn: z.array(z.string()).catch([]),
  elementRef: z.string().nullable().catch(null),
  insightType: z.string().nullable().catch(null),
});

const CrossProcessGapSchema = z.object({
  pattern: z.string(),
  affectedProcesses: z.array(z.string()).catch([]),
  suggestedAction: z.string().catch(""),
});

const ContradictionSchema = z.object({
  topic: z.string(),
  existingClaim: z.string(),
  newClaim: z.string(),
  source: z.string().catch("unknown"),
});

const InitialDesignSchema = z.object({
  templateName: z.string().catch(""),
  suggestedSteps: z
    .array(
      z.object({
        label: z.string(),
        type: z.string().catch("task"),
        lane: z.string().optional(),
      }),
    )
    .catch([]),
  starterQuestions: z
    .array(
      z.object({
        question: z.string(),
        category: z.string().catch("GENERAL_GAP"),
        priority: z.number().catch(50),
      }),
    )
    .catch([]),
});

const FollowUpSuggestionSchema = z.object({
  shouldSchedule: z.boolean().catch(false),
  focusAreas: z.array(z.string()).catch([]),
  estimatedDuration: z.string().catch("30 min"),
  unresolved: z.number().catch(0),
});

const AuditResultSchema = z.object({
  snapshotPatch: KnowledgeSnapshotSchema.partial().catch({}),
  updatedScores: z.record(z.string(), z.number()).catch({}),
  completenessScore: z.number().min(0).max(100).catch(0),
  newGaps: z.array(NewGapSchema).catch([]),
  resolvedGapIds: z.array(z.string()).catch([]),
  crossProcessGaps: z.array(CrossProcessGapSchema).catch([]),
  contradictions: z.array(ContradictionSchema).catch([]),
  initialDesign: InitialDesignSchema.optional(),
  followUpSuggestion: FollowUpSuggestionSchema.optional(),
});

// ============================================
// Types
// ============================================

export interface AuditInput {
  mode: "initial" | "incremental";
  knowledgeSnapshot: KnowledgeSnapshot;
  confidenceScores: Record<string, number>;
  processDefinition: {
    name: string;
    description?: string;
    level: string;
    goals: string[];
    triggers: string[];
    outputs: string[];
    owner?: string;
    bpmnNodeCount: number;
    confirmedNodeCount: number;
    bpmnXml?: string;
  };
  newData: {
    sessionSummaries?: Array<{
      sessionId: string;
      summary: string;
      actionItems: string[];
    }>;
    transcriptExcerpts?: Array<{ sessionId: string; text: string }>;
    chatMessages?: Array<{ threadId: string; content: string }>;
    documentExcerpts?: Array<{ documentId: string; text: string }>;
    diagramNodes?: Array<{
      label: string;
      type: string;
      lane?: string;
      state: string;
    }>;
    raciEntries?: Array<{
      activityName: string;
      role: string;
      assignment: string;
    }>;
    conflicts?: Array<{ nodeLabel: string; conflictType: string }>;
    clientAnswers?: Array<{
      itemId: string;
      question: string;
      answer: string;
    }>;
  };
  organizationContext?: {
    industry?: string;
    siblingProcessNames: string[];
    siblingGapSummary?: Array<{
      processName: string;
      topGaps: string[];
    }>;
  };
  existingOpenItems?: Array<{
    id: string;
    question: string;
    category: string;
  }>;
}

export interface AuditResult {
  snapshotPatch: Partial<KnowledgeSnapshot>;
  updatedScores: Record<string, number>;
  completenessScore: number;
  newGaps: Array<{
    category: string;
    question: string;
    context: string;
    priority: number;
    dependsOn: string[];
  }>;
  resolvedGapIds: string[];
  crossProcessGaps: Array<{
    pattern: string;
    affectedProcesses: string[];
    suggestedAction: string;
  }>;
  contradictions: Array<{
    topic: string;
    existingClaim: string;
    newClaim: string;
    source: string;
  }>;
  initialDesign?: {
    templateName: string;
    suggestedSteps: Array<{
      label: string;
      type: string;
      lane?: string;
    }>;
    starterQuestions: Array<{
      question: string;
      category: string;
      priority: number;
    }>;
  };
  followUpSuggestion?: {
    shouldSchedule: boolean;
    focusAreas: string[];
    estimatedDuration: string;
    unresolved: number;
  };
}

// ============================================
// BPMN Summarizer
// ============================================

const BPMN_ELEMENT_TYPES = new Set([
  "task",
  "userTask",
  "serviceTask",
  "sendTask",
  "receiveTask",
  "manualTask",
  "businessRuleTask",
  "scriptTask",
  "startEvent",
  "endEvent",
  "exclusiveGateway",
  "parallelGateway",
  "inclusiveGateway",
  "intermediateCatchEvent",
  "intermediateThrowEvent",
  "subProcess",
]);

interface BpmnSummary {
  nodeCount: number;
  summary: string;
  elementMap: Array<{
    elementRef: string;
    label: string;
    type: string;
    lane?: string;
  }>;
}

function summarizeBpmnXml(bpmnXml: string): BpmnSummary {
  const elementMatches = [
    ...bpmnXml.matchAll(/<bpmn:(\w+)\s[^>]*name="([^"]*)"[^>]*>/g),
  ];
  const laneMatches = [
    ...bpmnXml.matchAll(/<bpmn:lane\s[^>]*name="([^"]*)"[^>]*>/g),
  ];

  const elements: Array<{ label: string; type: string }> = [];
  for (const match of elementMatches) {
    const type = match[1];
    const label = match[2];
    if (label && BPMN_ELEMENT_TYPES.has(type)) {
      elements.push({ label, type: `bpmn:${type}` });
    }
  }

  // Cap at 80 elements to keep token count reasonable
  const capped = elements.slice(0, 80);
  const lanes = laneMatches.map((m) => m[1]).filter(Boolean);

  const lines: string[] = [];
  if (lanes.length > 0) lines.push(`Lanes: ${lanes.join(", ")}`);
  for (const el of capped) {
    lines.push(`- ${el.label} (${el.type})`);
  }

  return {
    nodeCount: elements.length,
    summary:
      lines.join("\n") || "(diagrama vacío o sin elementos nombrados)",
    elementMap: capped.map((el) => ({
      elementRef: `${el.label}|${el.type}|`,
      label: el.label,
      type: el.type,
    })),
  };
}

// ============================================
// Pipeline
// ============================================

/**
 * Audit a process's knowledge state and identify gaps.
 *
 * @param input - Audit input with mode, snapshot, new data, and context
 * @returns Delta to apply to the process intelligence
 */
export async function auditProcess(input: AuditInput): Promise<AuditResult> {
  const isInitial = input.mode === "initial";

  // Summarize actual BPMN XML if available
  const bpmnSummary = input.processDefinition.bpmnXml
    ? summarizeBpmnXml(input.processDefinition.bpmnXml)
    : null;

  const actualNodeCount = Math.max(
    input.processDefinition.bpmnNodeCount,
    bpmnSummary?.nodeCount ?? 0,
  );

  const snapshotIsEmpty = Object.values(input.knowledgeSnapshot).every(
    (arr) => !Array.isArray(arr) || arr.length === 0,
  );

  const isEmptyProcess = isInitial && snapshotIsEmpty && actualNodeCount === 0;

  // Sparse = has some data but very incomplete (foundational questions needed)
  const isSparseProcess =
    isInitial && !isEmptyProcess && actualNodeCount <= 5 && snapshotIsEmpty;

  // Build system prompt with mode-specific addendum
  let systemPrompt = PROCESS_AUDIT_SYSTEM;
  if (isInitial) {
    systemPrompt += PROCESS_AUDIT_INITIAL_ADDENDUM;
  } else {
    systemPrompt += PROCESS_AUDIT_INCREMENTAL_ADDENDUM;
  }

  // Build user prompt
  const userPrompt = PROCESS_AUDIT_USER(
    { ...input.processDefinition, bpmnNodeCount: actualNodeCount },
    input.knowledgeSnapshot as Record<string, unknown>,
    input.newData as Record<string, unknown>,
    input.organizationContext,
    input.existingOpenItems,
    bpmnSummary?.elementMap,
    bpmnSummary?.summary,
    isSparseProcess,
  );

  const { text, usage } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: isInitial ? 8192 : 4096,
    temperature: 0.1,
  });

  const result = parseLlmJson(text, AuditResultSchema, "ProcessAudit");
  if (!result) {
    return {
      snapshotPatch: {},
      updatedScores: input.confidenceScores,
      completenessScore: input.mode === "initial" ? 0 : (input as AuditInput & { completenessScore?: number }).completenessScore ?? 0,
      newGaps: [],
      resolvedGapIds: [],
      crossProcessGaps: [],
      contradictions: [],
    };
  }

  return {
    snapshotPatch: result.snapshotPatch,
    updatedScores: result.updatedScores,
    completenessScore: result.completenessScore,
    newGaps: result.newGaps,
    resolvedGapIds: result.resolvedGapIds,
    crossProcessGaps:
      result.crossProcessGaps.length > 0
        ? result.crossProcessGaps
        : [],
    contradictions:
      result.contradictions.length > 0 ? result.contradictions : [],
    initialDesign:
      isEmptyProcess || isSparseProcess ? result.initialDesign : undefined,
    followUpSuggestion: result.followUpSuggestion,
  };
}

/**
 * Merge a snapshot patch into an existing knowledge snapshot.
 * Arrays are merged (union by key field), not replaced.
 */
export function mergeSnapshotPatch(
  existing: KnowledgeSnapshot,
  patch: Partial<KnowledgeSnapshot>,
): KnowledgeSnapshot {
  const result = { ...existing };

  for (const key of Object.keys(patch) as Array<keyof KnowledgeSnapshot>) {
    const patchValue = patch[key];
    if (!patchValue || !Array.isArray(patchValue)) continue;

    const existingArray = result[key] as Array<Record<string, unknown>>;
    const patchArray = patchValue as Array<Record<string, unknown>>;

    // Determine the key field for dedup
    const keyField = getKeyField(key);

    // Merge: update existing items by key, add new ones
    const merged = [...existingArray];
    for (const patchItem of patchArray) {
      const existingIndex = merged.findIndex(
        (e) => e[keyField] === patchItem[keyField],
      );
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...patchItem };
      } else {
        merged.push(patchItem);
      }
    }

    (result as Record<string, unknown>)[key] = merged;
  }

  return KnowledgeSnapshotSchema.parse(result);
}

function getKeyField(dimension: keyof KnowledgeSnapshot): string {
  switch (dimension) {
    case "roles":
      return "name";
    case "triggers":
      return "description";
    case "steps":
      return "label";
    case "decisions":
      return "label";
    case "exceptions":
      return "scenario";
    case "outputs":
      return "description";
    case "systems":
      return "name";
    case "formats":
      return "name";
    case "slas":
      return "metric";
    case "volumetrics":
      return "step";
    case "costs":
      return "step";
    case "interProcessLinks":
      return "targetProcess";
    case "contradictions":
      return "topic";
    default:
      return "name";
  }
}
