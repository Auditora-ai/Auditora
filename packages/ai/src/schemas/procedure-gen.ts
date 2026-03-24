import { z } from "zod";

const ProcedureStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  action: z.string(),
  responsible: z.string(),
  description: z.string(),
  inputs: z.array(z.string()).catch([]),
  outputs: z.array(z.string()).catch([]),
  systems: z.array(z.string()).catch([]),
  controls: z.array(z.string()).catch([]),
  exceptions: z.array(
    z.object({
      condition: z.string(),
      action: z.string(),
    }),
  ).catch([]),
  estimatedTime: z.string().optional(),
  notes: z.string().optional(),
});

export const ProcedureResultSchema = z.object({
  processName: z.string(),
  activityName: z.string(),
  procedureCode: z.string().optional(),
  objective: z.string(),
  scope: z.string(),
  responsible: z.string(),
  frequency: z.string().optional(),
  prerequisites: z.array(z.string()).catch([]),
  steps: z.array(ProcedureStepSchema),
  definitions: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    }),
  ).catch([]),
  relatedDocuments: z.array(z.string()).catch([]),
  indicators: z.array(
    z.object({
      name: z.string(),
      formula: z.string().optional(),
      target: z.string().optional(),
    }),
  ).catch([]),
  revisionHistory: z.array(
    z.object({
      version: z.string(),
      date: z.string(),
      description: z.string(),
    }),
  ).catch([]),
  gaps: z.array(z.string()).catch([]),
  overallConfidence: z.number().min(0).max(1),
});

export type ProcedureResult = z.infer<typeof ProcedureResultSchema>;
export type ProcedureStep = z.infer<typeof ProcedureStepSchema>;
