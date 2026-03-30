/**
 * Simulation Evaluation Pipeline
 *
 * Evaluates a completed simulation run using AI to score
 * alignment, risk level, and judgment quality.
 *
 * Pipeline flow:
 *   SIMULATION RUN + DECISIONS + RESPONSES → LLM → SCORES + FEEDBACK
 *   → Update SimulationRun + Upsert HumanRiskProfile
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import { buildEvaluationPrompt } from "../prompts/simulation-evaluator";
import { parseLlmJson } from "../utils/parse-llm-json";
import { db } from "@repo/database";

// ============================================
// Zod Schema
// ============================================

const EvaluationResultSchema = z.object({
  alignment: z.number().min(0).max(100).catch(50),
  riskLevel: z.number().min(0).max(100).catch(50),
  criterio: z.number().min(0).max(100).catch(50),
  errorPatterns: z.array(z.string()).catch([]),
  feedback: z.string().catch(""),
});

// ============================================
// Types
// ============================================

export interface EvaluationResult {
  alignment: number;
  riskLevel: number;
  criterio: number;
  overallScore: number;
  errorPatterns: string[];
  feedback: string;
}

// ============================================
// Pipeline
// ============================================

/**
 * Evaluate a simulation run and update scores in the database.
 *
 * @param runId - The SimulationRun ID to evaluate
 * @returns Evaluation scores and feedback
 */
export async function evaluateSimulationRun(
  runId: string,
): Promise<EvaluationResult> {
  // 1. Fetch SimulationRun with responses → decisions, scenario → template
  const run = await db.simulationRun.findUniqueOrThrow({
    where: { id: runId },
    include: {
      responses: {
        include: {
          decision: true,
        },
        orderBy: { decision: { order: "asc" } },
      },
      scenario: {
        include: {
          template: {
            select: {
              title: true,
              narrative: true,
              targetRole: true,
              customRoleName: true,
              organizationId: true,
              processDefinitionId: true,
            },
          },
        },
      },
    },
  });

  const template = run.scenario.template;

  // 2. Fetch controlPointsSummary from the PUBLISHED procedure for this process
  const publishedProcedure = await db.procedure.findFirst({
    where: {
      processDefinitionId: template.processDefinitionId,
      status: "PUBLISHED",
    },
    select: { controlPointsSummary: true },
    orderBy: { updatedAt: "desc" },
  });

  const controlPointsSummary = publishedProcedure?.controlPointsSummary ?? null;

  // 3. Build context for prompt
  const decisions = run.responses.map((r) => {
    const d = r.decision;
    const options = (d.options as Array<{ label: string; description: string }>) || [];
    const riskLevelByOption = (d.riskLevelByOption as Array<{ level: string; score: number }>) || [];
    const consequences = (d.consequences as Array<string>) || [];

    return {
      order: d.order,
      prompt: d.prompt,
      options,
      chosenOption: r.chosenOption,
      riskLevelByOption,
      proceduralReference: d.proceduralReference,
      consequence: consequences[r.chosenOption] || "",
    };
  });

  const targetRole =
    template.targetRole === "CUSTOM"
      ? template.customRoleName || "Participante"
      : template.targetRole;

  const promptData = buildEvaluationPrompt({
    decisions,
    templateTitle: template.title,
    narrative: template.narrative,
    targetRole,
    controlPointsSummary,
  });

  // 4. Call Claude via instrumentedGenerateText
  const { text } = await instrumentedGenerateText({
    organizationId: template.organizationId,
    pipeline: "simulation-evaluation",
    system: promptData.system,
    prompt: promptData.user,
    maxOutputTokens: 2048,
    temperature: 0.1,
  });

  // 5. Parse with Zod
  const parsed = parseLlmJson(text, EvaluationResultSchema, "SimulationEvaluation");

  const alignment = parsed?.alignment ?? 50;
  const riskLevel = parsed?.riskLevel ?? 50;
  const criterio = parsed?.criterio ?? 50;
  const errorPatterns = parsed?.errorPatterns ?? [];
  const feedback = parsed?.feedback ?? "";

  // 6. Calculate overallScore
  const overallScore = Math.round(
    0.3 * alignment + 0.3 * (100 - riskLevel) + 0.4 * criterio,
  );

  // 7. Update SimulationRun with scores
  await db.simulationRun.update({
    where: { id: runId },
    data: {
      alignment,
      riskLevel,
      criterio,
      overallScore,
      errorPatterns: errorPatterns as any,
      aiFeedback: feedback,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // 8. Upsert HumanRiskProfile
  await upsertHumanRiskProfile(run.userId, template.organizationId);

  // 9. Return result
  return { alignment, riskLevel, criterio, overallScore, errorPatterns, feedback };
}

/**
 * Recalculate the HumanRiskProfile for a user+org based on all completed runs.
 */
async function upsertHumanRiskProfile(
  userId: string,
  organizationId: string,
): Promise<void> {
  // Query all completed runs for this user in this org
  const completedRuns = await db.simulationRun.findMany({
    where: {
      userId,
      status: "COMPLETED",
      scenario: {
        template: { organizationId },
      },
    },
    include: {
      scenario: {
        include: {
          template: {
            select: {
              processDefinitionId: true,
              processDefinition: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (completedRuns.length === 0) return;

  // Calculate averages
  const totalSimulations = completedRuns.length;
  const avgOverall = Math.round(
    completedRuns.reduce((sum, r) => sum + (r.overallScore ?? 0), 0) / totalSimulations,
  );

  // Group by process
  const byProcess = new Map<
    string,
    { processName: string; runs: typeof completedRuns }
  >();

  for (const run of completedRuns) {
    const pid = run.scenario.template.processDefinitionId;
    const pname = run.scenario.template.processDefinition.name;
    if (!byProcess.has(pid)) {
      byProcess.set(pid, { processName: pname, runs: [] });
    }
    byProcess.get(pid)!.runs.push(run);
  }

  const patternsByProcess = Array.from(byProcess.entries()).map(
    ([processId, { processName, runs }]) => {
      const avgAlignment = Math.round(
        runs.reduce((s, r) => s + (r.alignment ?? 0), 0) / runs.length,
      );
      const avgRiskLevel = Math.round(
        runs.reduce((s, r) => s + (r.riskLevel ?? 0), 0) / runs.length,
      );

      // Find the most common error pattern
      const patternCounts = new Map<string, number>();
      for (const r of runs) {
        const patterns = (r.errorPatterns as string[]) || [];
        for (const p of patterns) {
          patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
        }
      }
      let dominantErrorPattern = "";
      let maxCount = 0;
      for (const [pattern, count] of patternCounts) {
        if (count > maxCount) {
          maxCount = count;
          dominantErrorPattern = pattern;
        }
      }

      return {
        processId,
        processName,
        avgAlignment,
        avgRiskLevel,
        dominantErrorPattern: runs.length >= 3 ? dominantErrorPattern : "",
        simulationCount: runs.length,
      };
    },
  );

  // Derive strength and risk areas from patterns
  const strengthAreas = patternsByProcess
    .filter((p) => p.avgAlignment >= 75 && p.avgRiskLevel <= 30)
    .map((p) => p.processName);

  const riskAreas = patternsByProcess
    .filter((p) => p.avgAlignment < 60 || p.avgRiskLevel > 60)
    .map((p) => p.processName);

  // Collect all error patterns as recommended training labels
  const allPatterns = new Set<string>();
  for (const run of completedRuns) {
    const patterns = (run.errorPatterns as string[]) || [];
    for (const p of patterns) allPatterns.add(p);
  }
  const recommendedTraining = Array.from(allPatterns).slice(0, 10);

  await db.humanRiskProfile.upsert({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    create: {
      userId,
      organizationId,
      overallScore: avgOverall,
      totalSimulations,
      patternsByProcess: patternsByProcess as any,
      strengthAreas: strengthAreas as any,
      riskAreas: riskAreas as any,
      recommendedTraining: recommendedTraining as any,
    },
    update: {
      overallScore: avgOverall,
      totalSimulations,
      patternsByProcess: patternsByProcess as any,
      strengthAreas: strengthAreas as any,
      riskAreas: riskAreas as any,
      recommendedTraining: recommendedTraining as any,
    },
  });
}
