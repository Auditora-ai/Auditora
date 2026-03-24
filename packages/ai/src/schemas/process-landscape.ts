import { z } from "zod";

const LandscapeProcessSchema = z.object({
  name: z.string(),
  category: z.enum(["strategic", "core", "support"]),
  owner: z.string().optional(),
  maturityLevel: z.number().int().min(0).max(5).optional(), // CMMI 0-5
  status: z.enum(["documented", "identified", "gap"]),
  valueChainActivity: z.string().optional(),
  description: z.string().optional(),
});

const LandscapeBandSchema = z.object({
  label: z.string(),
  description: z.string(),
  processes: z.array(LandscapeProcessSchema),
});

export const ProcessLandscapeResultSchema = z.object({
  companyName: z.string(),
  strategicBand: LandscapeBandSchema,
  coreBand: LandscapeBandSchema,
  supportBand: LandscapeBandSchema,
  totalProcesses: z.number().int(),
  documentedCount: z.number().int(),
  gapCount: z.number().int(),
  coveragePercentage: z.number().min(0).max(100),
  recommendations: z.array(z.string()).catch([]),
  overallConfidence: z.number().min(0).max(1),
});

export type ProcessLandscapeResult = z.infer<typeof ProcessLandscapeResultSchema>;
export type LandscapeProcess = z.infer<typeof LandscapeProcessSchema>;
