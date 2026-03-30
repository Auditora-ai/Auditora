import { db } from "@repo/database";

export interface ProfileItem {
  id: string;
  userId: string;
  overallScore: number | null;
  totalSimulations: number;
  strengthAreas: string[] | null;
  riskAreas: string[] | null;
  recommendedTraining: string[] | null;
  lastUpdatedAt: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ProcessHeatmapRow {
  processName: string;
  avgAlignment: number;
  avgRiskLevel: number;
  avgCriterio: number;
  simulationCount: number;
}

export interface DashboardData {
  insufficientData: boolean;
  orgAvgScore: number;
  totalSimulations: number;
  membersEvaluated: number;
  completionRate: number;
  avgDurationMinutes: number;
  dimensionAverages: { alignment: number; riskLevel: number; criterio: number };
  scoreTrend: Array<{ month: string; score: number }>;
  processHeatmap: ProcessHeatmapRow[];
  errorPatterns: Array<{ pattern: string; count: number }>;
  profiles: ProfileItem[];
}

export async function fetchHumanRiskDashboardData(
  organizationId: string,
): Promise<DashboardData> {
  const [profiles, completedRuns, totalRunCount] = await Promise.all([
    db.humanRiskProfile.findMany({
      where: { organizationId },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { overallScore: "desc" },
    }),
    db.simulationRun.findMany({
      where: {
        status: "COMPLETED",
        scenario: { template: { organizationId } },
      },
      select: {
        overallScore: true,
        alignment: true,
        riskLevel: true,
        criterio: true,
        duration: true,
        completedAt: true,
        errorPatterns: true,
        scenario: {
          select: {
            template: {
              select: {
                processDefinitionId: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: "asc" },
    }),
    db.simulationRun.count({
      where: { scenario: { template: { organizationId } } },
    }),
  ]);

  const insufficientData = completedRuns.length < 3;

  // Org average score
  const orgAvgScore =
    profiles.length > 0
      ? Math.round(
          profiles.reduce((sum, p) => sum + (p.overallScore ?? 0), 0) /
            profiles.length,
        )
      : 0;

  // Dimension averages
  const runsWithScores = completedRuns.filter(
    (r) => r.alignment !== null && r.riskLevel !== null && r.criterio !== null,
  );
  const dimensionAverages =
    runsWithScores.length > 0
      ? {
          alignment: Math.round(
            runsWithScores.reduce((s, r) => s + r.alignment!, 0) /
              runsWithScores.length,
          ),
          riskLevel: Math.round(
            runsWithScores.reduce((s, r) => s + r.riskLevel!, 0) /
              runsWithScores.length,
          ),
          criterio: Math.round(
            runsWithScores.reduce((s, r) => s + r.criterio!, 0) /
              runsWithScores.length,
          ),
        }
      : { alignment: 0, riskLevel: 0, criterio: 0 };

  // Completion rate
  const completionRate =
    totalRunCount > 0
      ? Math.round((completedRuns.length / totalRunCount) * 100)
      : 0;

  // Average duration
  const durations = completedRuns
    .map((r) => r.duration)
    .filter((d): d is number => d !== null);
  const avgDurationMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length / 60)
      : 0;

  // Score trend by month
  const monthMap = new Map<string, { sum: number; count: number }>();
  for (const run of completedRuns) {
    if (run.completedAt && run.overallScore !== null) {
      const key = run.completedAt.toISOString().slice(0, 7); // YYYY-MM
      const entry = monthMap.get(key) ?? { sum: 0, count: 0 };
      entry.sum += run.overallScore;
      entry.count += 1;
      monthMap.set(key, entry);
    }
  }
  const scoreTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      month: formatMonth(month),
      score: Math.round(sum / count),
    }));

  // Process heatmap from SimulationRuns
  const processMap = new Map<
    string,
    { name: string; alignment: number[]; riskLevel: number[]; criterio: number[] }
  >();
  for (const run of runsWithScores) {
    const procId = run.scenario.template.processDefinitionId;
    const procName = run.scenario.template.title;
    if (!procId) continue;
    const entry = processMap.get(procId) ?? {
      name: procName,
      alignment: [],
      riskLevel: [],
      criterio: [],
    };
    entry.alignment.push(run.alignment!);
    entry.riskLevel.push(run.riskLevel!);
    entry.criterio.push(run.criterio!);
    processMap.set(procId, entry);
  }
  const processHeatmap: ProcessHeatmapRow[] = Array.from(
    processMap.values(),
  ).map((p) => ({
    processName: p.name,
    avgAlignment: Math.round(avg(p.alignment)),
    avgRiskLevel: Math.round(avg(p.riskLevel)),
    avgCriterio: Math.round(avg(p.criterio)),
    simulationCount: p.alignment.length,
  }));

  // Error patterns frequency
  const patternCounts = new Map<string, number>();
  for (const run of completedRuns) {
    const patterns = run.errorPatterns as string[] | null;
    if (Array.isArray(patterns)) {
      for (const p of patterns) {
        patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
      }
    }
  }
  const errorPatterns = Array.from(patternCounts.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    insufficientData,
    orgAvgScore,
    totalSimulations: completedRuns.length,
    membersEvaluated: profiles.length,
    completionRate,
    avgDurationMinutes,
    dimensionAverages,
    scoreTrend,
    processHeatmap,
    errorPatterns,
    profiles: profiles as unknown as ProfileItem[],
  };
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  return `${MONTH_NAMES[parseInt(month!, 10) - 1]} ${year}`;
}
