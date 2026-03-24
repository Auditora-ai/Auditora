import { z } from "zod";

const ValueChainActivitySchema = z.object({
  name: z.string(),
  type: z.enum(["PRIMARY", "SUPPORT"]),
  description: z.string(),
  subActivities: z.array(z.string()).catch([]),
  linkedProcesses: z.array(z.string()).catch([]),
  keyMetrics: z.array(z.string()).catch([]),
  orderIndex: z.number().int().min(0),
});

export const ValueChainResultSchema = z.object({
  companyName: z.string(),
  industryContext: z.string().optional(),
  primaryActivities: z.array(ValueChainActivitySchema),
  supportActivities: z.array(ValueChainActivitySchema),
  marginDescription: z.string().optional(),
  competitiveAdvantage: z.string().optional(),
  gaps: z.array(z.string()).catch([]),
  overallConfidence: z.number().min(0).max(1),
});

export type ValueChainResult = z.infer<typeof ValueChainResultSchema>;
export type ValueChainActivity = z.infer<typeof ValueChainActivitySchema>;
