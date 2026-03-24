import { z } from "zod";

const HorizontalStepSchema = z.object({
  processName: z.string(),
  department: z.string(),
  action: z.string(),
  inputs: z.array(z.string()).catch([]),
  outputs: z.array(z.string()).catch([]),
  systems: z.array(z.string()).catch([]),
  orderIndex: z.number().int().min(0),
});

const HandoffSchema = z.object({
  fromStep: z.number().int(), // orderIndex of source step
  toStep: z.number().int(),   // orderIndex of target step
  description: z.string(),
  handoffType: z.enum(["document", "system", "verbal", "approval"]),
  painPoint: z.string().optional(),
});

const DepartmentLaneSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  stepsInLane: z.array(z.number().int()), // orderIndex references
});

export const HorizontalViewResultSchema = z.object({
  flowName: z.string(),
  flowDescription: z.string(),
  triggerEvent: z.string(),
  endEvent: z.string(),
  departments: z.array(DepartmentLaneSchema),
  steps: z.array(HorizontalStepSchema),
  handoffs: z.array(HandoffSchema),
  totalDepartments: z.number().int(),
  totalHandoffs: z.number().int(),
  criticalPath: z.array(z.number().int()).catch([]), // orderIndex sequence
  painPoints: z.array(z.string()).catch([]),
  recommendations: z.array(z.string()).catch([]),
  overallConfidence: z.number().min(0).max(1),
});

export type HorizontalViewResult = z.infer<typeof HorizontalViewResultSchema>;
export type HorizontalStep = z.infer<typeof HorizontalStepSchema>;
export type Handoff = z.infer<typeof HandoffSchema>;
