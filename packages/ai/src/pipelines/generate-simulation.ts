/**
 * Simulation Template Generation Pipeline
 *
 * Generates Harvard-style case simulations from process definitions,
 * BPMN diagrams, and identified risks.
 *
 * Pipeline flow:
 *   PROCESS DEF + BPMN XML + RISKS → LLM → SIMULATION TEMPLATE + SCENARIO + DECISIONS
 *
 * Token usage: ~4K input, ~8K output
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import { buildSimulationPrompt } from "../prompts/simulation-generator";
import { parseLlmJson } from "../utils/parse-llm-json";
import { db } from "@repo/database";

// ============================================
// Zod Schemas
// ============================================

const RiskLevelSchema = z.object({
  level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  reason: z.string(),
});

const OptionSchema = z.object({
  label: z.string(),
  description: z.string(),
});

const DecisionSchema = z.object({
  order: z.number().min(1).max(10),
  prompt: z.string(),
  options: z.array(OptionSchema).min(2).max(5),
  consequences: z.array(z.string()),
  proceduralReference: z.string().nullable().catch(null),
  riskLevelByOption: z.array(RiskLevelSchema),
});

const SimulationResultSchema = z.object({
  title: z.string(),
  narrative: z.string(),
  decisions: z.array(DecisionSchema).min(1).max(10),
});

// ============================================
// Types
// ============================================

export interface GenerateSimulationInput {
  processDefinitionId: string;
  organizationId: string;
  targetRole: string;
  customRoleName?: string;
  riskIds: string[];
  userId: string;
  /** If provided, use this existing template instead of creating a new one */
  existingTemplateId?: string;
}

// ============================================
// Pipeline
// ============================================

/**
 * Generate a simulation template from a process definition and its risks.
 *
 * 1. Creates SimulationTemplate with status GENERATING
 * 2. Fetches process definition + risks
 * 3. Extracts BPMN step labels from XML
 * 4. Calls Claude to generate simulation content
 * 5. Creates SimulationScenario + Decision records
 * 6. Updates template status to PUBLISHED
 *
 * @returns templateId of the created SimulationTemplate
 */
export async function generateSimulationTemplate(
  input: GenerateSimulationInput,
): Promise<string> {
  // 1. Create or reuse template with GENERATING status
  const template = input.existingTemplateId
    ? await db.simulationTemplate.update({
        where: { id: input.existingTemplateId },
        data: { status: "GENERATING" },
      })
    : await db.simulationTemplate.create({
        data: {
          organizationId: input.organizationId,
          processDefinitionId: input.processDefinitionId,
          title: "Generando...",
          narrative: "",
          targetRole: input.targetRole as never,
          customRoleName: input.customRoleName || null,
          status: "GENERATING",
          riskIds: input.riskIds,
          createdBy: input.userId,
        },
      });

  try {
    // 2. Fetch process definition and risks
    const [processDef, risks] = await Promise.all([
      db.processDefinition.findUniqueOrThrow({
        where: { id: input.processDefinitionId },
        select: {
          name: true,
          description: true,
          bpmnXml: true,
        },
      }),
      db.processRisk.findMany({
        where: { id: { in: input.riskIds } },
        select: {
          title: true,
          description: true,
          riskType: true,
          severity: true,
          probability: true,
          affectedStep: true,
        },
      }),
    ]);

    // 3. Extract BPMN step labels from XML
    const bpmnStepLabels = extractBpmnStepLabels(processDef.bpmnXml);

    // 4. Build prompt
    const roleLabel =
      input.customRoleName || input.targetRole.replace(/_/g, " ");

    const { system, user } = buildSimulationPrompt({
      processName: processDef.name,
      processDescription: processDef.description || undefined,
      bpmnStepLabels,
      risks: risks.map((r) => ({
        title: r.title,
        description: r.description,
        riskType: r.riskType,
        severity: r.severity,
        probability: r.probability,
        affectedStep: r.affectedStep || undefined,
      })),
      targetRole: roleLabel,
    });

    // Store generation prompt for debugging/regeneration
    await db.simulationTemplate.update({
      where: { id: template.id },
      data: { generationPrompt: user },
    });

    // 5. Call Claude
    const { text } = await instrumentedGenerateText({
      organizationId: input.organizationId,
      pipeline: "simulation-generator",
      system,
      prompt: user,
      maxOutputTokens: 8192,
      temperature: 0.7,
    });

    // 6. Parse response with Zod
    const result = parseLlmJson(text, SimulationResultSchema, "SimulationGenerator");
    if (!result) {
      throw new Error("Failed to parse simulation generation response");
    }

    // 7. Create SimulationScenario + Decision records
    const scenario = await db.simulationScenario.create({
      data: {
        templateId: template.id,
        context: {
          processName: processDef.name,
          targetRole: roleLabel,
          riskCount: risks.length,
        },
      },
    });

    for (const decision of result.decisions) {
      await db.decision.create({
        data: {
          scenarioId: scenario.id,
          order: decision.order,
          prompt: decision.prompt,
          options: decision.options,
          consequences: decision.consequences,
          proceduralReference: decision.proceduralReference,
          riskLevelByOption: decision.riskLevelByOption,
        },
      });
    }

    // 8. Update template status to PUBLISHED
    await db.simulationTemplate.update({
      where: { id: template.id },
      data: {
        title: result.title,
        narrative: result.narrative,
        status: "PUBLISHED",
      },
    });

    return template.id;
  } catch (error) {
    // 9. On error: set GENERATION_FAILED
    await db.simulationTemplate.update({
      where: { id: template.id },
      data: { status: "GENERATION_FAILED" },
    });

    throw error;
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Extract step labels from BPMN XML using regex.
 * Matches name="..." attributes in bpmn:task, bpmn:userTask,
 * bpmn:serviceTask, bpmn:sendTask, bpmn:receiveTask, bpmn:manualTask,
 * and bpmn:scriptTask elements.
 */
function extractBpmnStepLabels(bpmnXml: string | null): string[] {
  if (!bpmnXml) return [];

  const labels: string[] = [];
  // Match any bpmn task element with a name attribute
  const taskRegex =
    /<bpmn:(task|userTask|serviceTask|sendTask|receiveTask|manualTask|scriptTask|businessRuleTask|callActivity|subProcess)\s[^>]*name="([^"]+)"/g;

  let match;
  while ((match = taskRegex.exec(bpmnXml)) !== null) {
    const label = match[2];
    if (label && label.trim()) {
      labels.push(label.trim());
    }
  }

  return labels;
}
