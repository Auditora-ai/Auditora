import { db } from "@repo/database";

/**
 * Per-step evaluation feedback for a single process.
 * Aggregates simulation run results by decision (which maps to process steps),
 * computing failure rates and common error patterns for each BPMN step.
 */

export interface StepEvalFeedback {
  /** The decision prompt text (truncated) */
  decisionPrompt: string;
  /** Procedural reference text that maps to a BPMN step */
  proceduralReference: string | null;
  /** Total responses for this decision */
  totalResponses: number;
  /** Number of responses that chose high/critical risk options */
  highRiskChoices: number;
  /** Failure rate: percentage of responses choosing high/critical risk */
  failureRate: number;
  /** Average risk score (0-100) across all responses for this decision */
  avgRiskScore: number;
  /** Most commonly chosen option label */
  mostChosenOption: string;
  /** Decision order in the simulation */
  order: number;
}

export interface ProcessEvalFeedback {
  processId: string;
  processName: string;
  /** Whether there is enough data (at least 1 completed run) */
  hasData: boolean;
  /** Total completed simulation runs for this process */
  totalRuns: number;
  /** Average overall score across all runs */
  avgOverallScore: number;
  /** Per-step feedback */
  steps: StepEvalFeedback[];
  /** BPMN step labels matched with their failure rates */
  stepFailureMap: Record<string, number>;
}

/**
 * Fetch aggregated evaluation feedback for a specific process definition.
 * Used to show inline failure rate badges on BPMN nodes.
 */
export async function fetchProcessEvalFeedback(
  processDefinitionId: string,
): Promise<ProcessEvalFeedback> {
  const process = await db.processDefinition.findUnique({
    where: { id: processDefinitionId },
    select: { id: true, name: true },
  });

  if (!process) {
    return {
      processId: processDefinitionId,
      processName: "",
      hasData: false,
      totalRuns: 0,
      avgOverallScore: 0,
      steps: [],
      stepFailureMap: {},
    };
  }

  // Get all completed simulation runs for this process
  const completedRuns = await db.simulationRun.findMany({
    where: {
      status: "COMPLETED",
      scenario: {
        template: { processDefinitionId },
      },
    },
    select: {
      id: true,
      overallScore: true,
      responses: {
        select: {
          chosenOption: true,
          decision: {
            select: {
              order: true,
              prompt: true,
              options: true,
              proceduralReference: true,
              riskLevelByOption: true,
            },
          },
        },
      },
    },
  });

  if (completedRuns.length === 0) {
    return {
      processId: process.id,
      processName: process.name,
      hasData: false,
      totalRuns: 0,
      avgOverallScore: 0,
      steps: [],
      stepFailureMap: {},
    };
  }

  // Compute average overall score
  const scores = completedRuns
    .map((r) => r.overallScore)
    .filter((s): s is number => s !== null);
  const avgOverallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  // Aggregate per-decision data
  const decisionMap = new Map<
    number,
    {
      prompt: string;
      proceduralReference: string | null;
      options: Array<{ label: string; description: string }>;
      riskLevels: Array<{ level: string; score?: number; reason?: string }>;
      chosenOptions: number[];
    }
  >();

  for (const run of completedRuns) {
    for (const response of run.responses) {
      const d = response.decision;
      const existing = decisionMap.get(d.order);
      if (!existing) {
        decisionMap.set(d.order, {
          prompt: d.prompt,
          proceduralReference: d.proceduralReference,
          options: d.options as Array<{ label: string; description: string }>,
          riskLevels: d.riskLevelByOption as Array<{ level: string; score?: number; reason?: string }>,
          chosenOptions: [response.chosenOption],
        });
      } else {
        existing.chosenOptions.push(response.chosenOption);
      }
    }
  }

  // Build per-step feedback
  const steps: StepEvalFeedback[] = [];
  const HIGH_RISK_LEVELS = new Set(["HIGH", "CRITICAL"]);

  for (const [order, data] of Array.from(decisionMap.entries()).sort(
    ([a], [b]) => a - b,
  )) {
    const totalResponses = data.chosenOptions.length;

    // Count high-risk choices
    let highRiskChoices = 0;
    let totalRiskScore = 0;
    const optionCounts = new Map<number, number>();

    for (const chosenOption of data.chosenOptions) {
      optionCounts.set(
        chosenOption,
        (optionCounts.get(chosenOption) ?? 0) + 1,
      );

      const riskLevel = data.riskLevels[chosenOption];
      if (riskLevel) {
        if (HIGH_RISK_LEVELS.has(riskLevel.level)) {
          highRiskChoices++;
        }
        // Map risk level to score if not provided
        const score =
          riskLevel.score ??
          ({ LOW: 20, MEDIUM: 50, HIGH: 75, CRITICAL: 95 }[riskLevel.level] ??
            50);
        totalRiskScore += score;
      }
    }

    const failureRate =
      totalResponses > 0
        ? Math.round((highRiskChoices / totalResponses) * 100)
        : 0;
    const avgRiskScore =
      totalResponses > 0 ? Math.round(totalRiskScore / totalResponses) : 0;

    // Find most chosen option
    let mostChosenIdx = 0;
    let mostChosenCount = 0;
    for (const [idx, count] of optionCounts.entries()) {
      if (count > mostChosenCount) {
        mostChosenIdx = idx;
        mostChosenCount = count;
      }
    }
    const mostChosenOption =
      data.options[mostChosenIdx]?.label ?? `Option ${mostChosenIdx}`;

    steps.push({
      decisionPrompt: data.prompt.slice(0, 200),
      proceduralReference: data.proceduralReference,
      totalResponses,
      highRiskChoices,
      failureRate,
      avgRiskScore,
      mostChosenOption,
      order,
    });
  }

  // Build step-failure map: maps BPMN step labels to failure rates
  // We use fuzzy matching: extract keywords from proceduralReference and match against BPMN node names
  const stepFailureMap: Record<string, number> = {};
  for (const step of steps) {
    if (step.proceduralReference) {
      // Use the procedural reference text as the key (normalized)
      stepFailureMap[step.proceduralReference.toLowerCase().trim()] =
        step.failureRate;
    }
  }

  return {
    processId: process.id,
    processName: process.name,
    hasData: true,
    totalRuns: completedRuns.length,
    avgOverallScore,
    steps,
    stepFailureMap,
  };
}
