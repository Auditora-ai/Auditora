/**
 * Risk Audit Pipeline (Unified)
 *
 * Analyzes process knowledge to identify risks, opportunities,
 * and failure modes. Supports three modes:
 *   - risk: ISO 31000 risk identification + mitigation proposals
 *   - fmea: Failure Mode and Effects Analysis per BPMN activity
 *   - full: Both risk + FMEA in one LLM call
 *
 * Pipeline flow:
 *   KNOWLEDGE SNAPSHOT + INTELLIGENCE ITEMS → LLM → RISKS + MITIGATIONS + CONTROLS
 *
 * Reuses KnowledgeSnapshot from process-audit.ts (same data source).
 * Token usage: ~8K input, ~4K output (risk), ~10K input, ~6K output (full)
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import {
  RISK_AUDIT_SYSTEM,
  FMEA_ADDENDUM,
  RISK_AUDIT_USER,
} from "../prompts/risk-audit";
import type { KnowledgeSnapshot } from "./process-audit";
import { parseLlmJson } from "../utils/parse-llm-json";

// ============================================
// Zod Schemas
// ============================================

const SuggestedControlSchema = z.object({
  name: z.string(),
  controlType: z.enum(["PREVENTIVE", "DETECTIVE", "CORRECTIVE"]),
  automated: z.boolean().catch(false),
});

const NewRiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  riskType: z.enum([
    "OPERATIONAL",
    "COMPLIANCE",
    "STRATEGIC",
    "FINANCIAL",
    "TECHNOLOGY",
    "HUMAN_RESOURCE",
    "REPUTATIONAL",
  ]),
  severity: z.number().min(1).max(5).catch(3),
  probability: z.number().min(1).max(5).catch(3),
  affectedStep: z.string().optional(),
  affectedRole: z.string().optional(),
  isOpportunity: z.boolean().catch(false),
  opportunityValue: z.string().optional(),
  source: z.enum(["AI_AUDIT", "AI_FMEA", "INTELLIGENCE_GAP", "CONVERSATION"]),
  relatedItemId: z.string().nullable().catch(null),
  suggestedMitigations: z.array(z.string()).catch([]),
  suggestedControls: z.array(SuggestedControlSchema).catch([]),
  // FMEA fields (only present in fmea/full mode)
  failureMode: z.string().optional(),
  failureEffect: z.string().optional(),
  detectionDifficulty: z.number().min(1).max(5).optional(),
  rpn: z.number().optional(),
});

const UpdatedRiskSchema = z.object({
  id: z.string(),
  severity: z.number().min(1).max(5).optional(),
  probability: z.number().min(1).max(5).optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

const RiskSummarySchema = z.object({
  totalRiskScore: z.number().catch(0),
  criticalCount: z.number().catch(0),
  highCount: z.number().catch(0),
  topRiskArea: z.string().catch("OPERATIONAL"),
});

const RiskAuditResultSchema = z.object({
  newRisks: z.array(NewRiskSchema).catch([]),
  updatedRisks: z.array(UpdatedRiskSchema).catch([]),
  riskSummary: RiskSummarySchema.catch({
    totalRiskScore: 0,
    criticalCount: 0,
    highCount: 0,
    topRiskArea: "OPERATIONAL",
  }),
});

// ============================================
// Types
// ============================================

export interface RiskAuditInput {
  organizationId: string;
  mode: "risk" | "fmea" | "full";
  processDefinition: {
    name: string;
    description?: string;
    level: string;
    goals: string[];
  };
  knowledgeSnapshot: KnowledgeSnapshot;
  intelligenceItems: Array<{
    id: string;
    category: string;
    question: string;
    priority: number;
    status: string;
  }>;
  existingRisks: Array<{
    id: string;
    title: string;
    riskType: string;
    severity: number;
    probability: number;
    status: string;
    affectedStep?: string;
  }>;
  organizationContext?: {
    industry?: string;
    siblingProcessNames: string[];
  };
  transcriptExcerpts?: Array<{ text: string }>;
}

export interface RiskAuditResult {
  newRisks: Array<{
    title: string;
    description: string;
    riskType: string;
    severity: number;
    probability: number;
    affectedStep?: string;
    affectedRole?: string;
    isOpportunity: boolean;
    opportunityValue?: string;
    source: string;
    relatedItemId: string | null;
    suggestedMitigations: string[];
    suggestedControls: Array<{
      name: string;
      controlType: string;
      automated: boolean;
    }>;
    failureMode?: string;
    failureEffect?: string;
    detectionDifficulty?: number;
    rpn?: number;
  }>;
  updatedRisks: Array<{
    id: string;
    severity?: number;
    probability?: number;
    status?: string;
    notes?: string;
  }>;
  riskSummary: {
    totalRiskScore: number;
    criticalCount: number;
    highCount: number;
    topRiskArea: string;
  };
}

// ============================================
// Pipeline
// ============================================

/**
 * Audit a process for risks, opportunities, and failure modes.
 *
 * @param input - Risk audit input with mode, snapshot, items, and context
 * @returns New risks with mitigations + controls, updated risks, summary
 */
export async function auditRisks(
  input: RiskAuditInput,
): Promise<RiskAuditResult> {
  // Build system prompt with optional FMEA addendum
  let systemPrompt = RISK_AUDIT_SYSTEM;
  if (input.mode === "fmea" || input.mode === "full") {
    systemPrompt += FMEA_ADDENDUM;
  }

  // Build user prompt
  const userPrompt = RISK_AUDIT_USER({
    mode: input.mode,
    processName: input.processDefinition.name,
    processDescription: input.processDefinition.description,
    processLevel: input.processDefinition.level,
    knowledgeSnapshot: JSON.stringify(input.knowledgeSnapshot, null, 0),
    intelligenceItems: JSON.stringify(
      input.intelligenceItems.map((i) => ({
        id: i.id,
        category: i.category,
        question: i.question,
        priority: i.priority,
      })),
      null,
      0,
    ),
    existingRisks: JSON.stringify(
      input.existingRisks.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.riskType,
        severity: r.severity,
        probability: r.probability,
      })),
      null,
      0,
    ),
    organizationContext: input.organizationContext
      ? JSON.stringify(input.organizationContext, null, 0)
      : undefined,
    transcriptExcerpts: input.transcriptExcerpts
      ? input.transcriptExcerpts.map((t) => t.text).join("\n---\n")
      : undefined,
  });

  const maxTokens = input.mode === "full" ? 8192 : 4096;

  const { text } = await instrumentedGenerateText({
    organizationId: input.organizationId,
    pipeline: "risk-audit",
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: maxTokens,
    temperature: 0.1,
  });

  const result = parseLlmJson(text, RiskAuditResultSchema, "RiskAudit");
  if (!result) {
    return {
      newRisks: [],
      updatedRisks: [],
      riskSummary: {
        totalRiskScore: 0,
        criticalCount: 0,
        highCount: 0,
        topRiskArea: "OPERATIONAL",
      },
    };
  }

  return {
    newRisks: result.newRisks,
    updatedRisks: result.updatedRisks,
    riskSummary: result.riskSummary,
  };
}

/**
 * Calculate residual risk after applying controls.
 * Deterministic — not AI-generated.
 *
 * HIGH control: reduces dimension by 2
 * MEDIUM control: reduces dimension by 1
 * LOW/UNKNOWN: no reduction
 * Multiple controls stack. Floor: 1 per dimension.
 */
export function calculateResidualRisk(
  severity: number,
  probability: number,
  controls: Array<{ effectiveness: string }>,
): { residualSeverity: number; residualProbability: number; residualScore: number } | null {
  if (controls.length === 0) return null;

  let severityReduction = 0;
  let probabilityReduction = 0;

  for (const control of controls) {
    const reduction =
      control.effectiveness === "HIGH" ? 2 : control.effectiveness === "MEDIUM" ? 1 : 0;
    // Alternate reductions between severity and probability
    if (severityReduction <= probabilityReduction) {
      severityReduction += reduction;
    } else {
      probabilityReduction += reduction;
    }
  }

  const residualSeverity = Math.max(1, severity - severityReduction);
  const residualProbability = Math.max(1, probability - probabilityReduction);

  return {
    residualSeverity,
    residualProbability,
    residualScore: residualSeverity * residualProbability,
  };
}
