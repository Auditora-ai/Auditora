/**
 * Company Brain Enrichment Schemas
 *
 * Zod schemas for the output of the company-brain-enrichment pipeline.
 * These define the structured data the LLM extracts from transcripts
 * and documents to populate the Company Brain.
 */

import { z } from "zod";

// Source reference for traceability
const SourceRefSchema = z.object({
  sessionId: z.string().optional(),
  documentId: z.string().optional(),
  timestamp: z.number().optional(),
  quote: z.string().optional(),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;

// Org Context extraction
const OrgContextExtractionSchema = z.object({
  mission: z
    .object({
      text: z.string().nullable().optional(),
      confidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
  vision: z
    .object({
      text: z.string().nullable().optional(),
      confidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
  values: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  valuesConfidence: z.number().min(0).max(1).optional(),
  industry: z
    .object({
      sector: z.string(),
      subsector: z.string().optional(),
    })
    .optional(),
  companySize: z
    .enum(["small", "medium", "large", "enterprise"])
    .optional(),
  geography: z.string().nullable().optional(),
  departments: z
    .array(
      z.object({
        name: z.string(),
        head: z.string().nullable().optional(),
        parentDept: z.string().nullable().optional(),
      }),
    )
    .optional(),
  businessModel: z.string().optional(),
});

export type OrgContextExtraction = z.infer<typeof OrgContextExtractionSchema>;

// Value Chain extraction
const ValueChainActivityExtractionSchema = z.object({
  name: z.string(),
  type: z.enum(["PRIMARY", "SUPPORT"]),
  description: z.string().optional(),
});

export type ValueChainActivityExtraction = z.infer<
  typeof ValueChainActivityExtractionSchema
>;

// Process Link extraction
const ProcessLinkExtractionSchema = z.object({
  fromProcess: z.string(), // Process name (will be matched to ID)
  toProcess: z.string(),
  linkType: z.enum(["FEEDS", "TRIGGERS", "DEPENDS", "HANDOFF"]),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1).catch(0.5),
});

export type ProcessLinkExtraction = z.infer<
  typeof ProcessLinkExtractionSchema
>;

// Role extraction
const GlobalRoleExtractionSchema = z.object({
  name: z.string(),
  department: z.string().optional(),
  title: z.string().optional(),
});

export type GlobalRoleExtraction = z.infer<typeof GlobalRoleExtractionSchema>;

// System extraction
const GlobalSystemExtractionSchema = z.object({
  name: z.string(),
  vendor: z.string().optional(),
  description: z.string().optional(),
});

export type GlobalSystemExtraction = z.infer<
  typeof GlobalSystemExtractionSchema
>;

// Process categorization
const ProcessCategorizationSchema = z.object({
  processName: z.string(),
  category: z.enum(["strategic", "core", "support"]),
  valueChainActivity: z.string().optional(), // Which value chain activity this maps to
});

export type ProcessCategorization = z.infer<
  typeof ProcessCategorizationSchema
>;

// Complete enrichment result from a single LLM call
export const CompanyBrainEnrichmentSchema = z.object({
  orgContext: OrgContextExtractionSchema.optional(),
  valueChainActivities: z
    .array(ValueChainActivityExtractionSchema)
    .catch([]),
  processLinks: z.array(ProcessLinkExtractionSchema).catch([]),
  roles: z.array(GlobalRoleExtractionSchema).catch([]),
  systems: z.array(GlobalSystemExtractionSchema).catch([]),
  processCategories: z.array(ProcessCategorizationSchema).catch([]),
});

export type CompanyBrainEnrichment = z.infer<
  typeof CompanyBrainEnrichmentSchema
>;
