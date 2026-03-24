import { z } from "zod";

export const MissionVisionResultSchema = z.object({
  mission: z.object({
    statement: z.string(),
    rationale: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  vision: z.object({
    statement: z.string(),
    timeHorizon: z.string().optional(),
    rationale: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  values: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      behavioralIndicators: z.array(z.string()).catch([]),
    }),
  ).catch([]),
  strategicObjectives: z.array(
    z.object({
      objective: z.string(),
      perspective: z.string().optional(), // BSC: financial, customer, internal, learning
    }),
  ).catch([]),
  overallConfidence: z.number().min(0).max(1),
  gaps: z.array(z.string()).catch([]),
});

export type MissionVisionResult = z.infer<typeof MissionVisionResultSchema>;
