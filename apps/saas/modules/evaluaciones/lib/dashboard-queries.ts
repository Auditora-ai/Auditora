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

/* ─────────────────── Progress Data (Before / After) ─────────────────── */

export interface PeriodScores {
  overall: number;
  alignment: number;
  riskLevel: number;
  criterio: number;
  count: number;
}

export interface ProcessProgress {
  processName: string;
  processId: string;
  first: PeriodScores;
  latest: PeriodScores;
  delta: number; // overall score improvement (latest - first)
  runCount: number;
}

export interface MemberProgress {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  firstScore: number;
  latestScore: number;
  delta: number;
  totalRuns: number;
}

export interface DimensionTrend {
  month: string;
  alignment: number;
  riskLevel: number;
  criterio: number;
}

export interface ProgressData {
  insufficientData: boolean;
  overallFirst: PeriodScores;
  overallLatest: PeriodScores;
  overallDelta: number;
  processProgress: ProcessProgress[];
  memberProgress: MemberProgress[];
  dimensionTrends: DimensionTrend[];
  totalMonths: number;
}

export async function fetchProgressData(
  organizationId: string,
): Promise<ProgressData> {
  const completedRuns = await db.simulationRun.findMany({
    where: {
      status: "COMPLETED",
      scenario: { template: { organizationId } },
    },
    select: {
      userId: true,
      overallScore: true,
      alignment: true,
      riskLevel: true,
      criterio: true,
      completedAt: true,
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
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  // Need at least 2 runs to show progress
  if (completedRuns.length < 2) {
    return {
      insufficientData: true,
      overallFirst: { overall: 0, alignment: 0, riskLevel: 0, criterio: 0, count: 0 },
      overallLatest: { overall: 0, alignment: 0, riskLevel: 0, criterio: 0, count: 0 },
      overallDelta: 0,
      processProgress: [],
      memberProgress: [],
      dimensionTrends: [],
      totalMonths: 0,
    };
  }

  // Split runs into first half and second half for overall comparison
  const midpoint = Math.floor(completedRuns.length / 2);
  const firstHalf = completedRuns.slice(0, midpoint);
  const secondHalf = completedRuns.slice(midpoint);

  const toPeriodScores = (runs: typeof completedRuns): PeriodScores => {
    const scored = runs.filter(
      (r) => r.overallScore !== null && r.alignment !== null && r.riskLevel !== null && r.criterio !== null,
    );
    if (scored.length === 0) return { overall: 0, alignment: 0, riskLevel: 0, criterio: 0, count: 0 };
    return {
      overall: Math.round(avg(scored.map((r) => r.overallScore!))),
      alignment: Math.round(avg(scored.map((r) => r.alignment!))),
      riskLevel: Math.round(avg(scored.map((r) => r.riskLevel!))),
      criterio: Math.round(avg(scored.map((r) => r.criterio!))),
      count: scored.length,
    };
  };

  const overallFirst = toPeriodScores(firstHalf);
  const overallLatest = toPeriodScores(secondHalf);
  const overallDelta = overallLatest.overall - overallFirst.overall;

  // ── Per-process progress ──
  const processRunMap = new Map<
    string,
    { name: string; runs: typeof completedRuns }
  >();
  for (const run of completedRuns) {
    const procId = run.scenario.template.processDefinitionId;
    if (!procId) continue;
    const entry = processRunMap.get(procId) ?? {
      name: run.scenario.template.title,
      runs: [],
    };
    entry.runs.push(run);
    processRunMap.set(procId, entry);
  }

  const processProgress: ProcessProgress[] = [];
  processRunMap.forEach(({ name, runs }, procId) => {
    if (runs.length < 2) return;
    const mid = Math.floor(runs.length / 2);
    const first = toPeriodScores(runs.slice(0, mid));
    const latest = toPeriodScores(runs.slice(mid));
    processProgress.push({
      processName: name,
      processId: procId,
      first,
      latest,
      delta: latest.overall - first.overall,
      runCount: runs.length,
    });
  });
  processProgress.sort((a, b) => b.delta - a.delta);

  // ── Per-member progress ──
  const memberRunMap = new Map<
    string,
    { user: { name: string | null; email: string; image: string | null }; runs: typeof completedRuns }
  >();
  for (const run of completedRuns) {
    const entry = memberRunMap.get(run.userId) ?? {
      user: run.user,
      runs: [],
    };
    entry.runs.push(run);
    memberRunMap.set(run.userId, entry);
  }

  const memberProgress: MemberProgress[] = [];
  memberRunMap.forEach(({ user, runs }, userId) => {
    if (runs.length < 2) return;
    const firstRuns = runs.slice(0, Math.max(1, Math.floor(runs.length / 3)));
    const latestRuns = runs.slice(-Math.max(1, Math.floor(runs.length / 3)));
    const firstScore = Math.round(avg(firstRuns.filter((r) => r.overallScore !== null).map((r) => r.overallScore!)));
    const latestScore = Math.round(avg(latestRuns.filter((r) => r.overallScore !== null).map((r) => r.overallScore!)));
    memberProgress.push({
      userId,
      userName: user.name ?? user.email.split("@")[0]!,
      userEmail: user.email,
      userImage: user.image,
      firstScore,
      latestScore,
      delta: latestScore - firstScore,
      totalRuns: runs.length,
    });
  });
  memberProgress.sort((a, b) => b.delta - a.delta);

  // ── Dimension trends by month ──
  const dimMonthMap = new Map<
    string,
    { alignment: number[]; riskLevel: number[]; criterio: number[] }
  >();
  for (const run of completedRuns) {
    if (
      run.completedAt &&
      run.alignment !== null &&
      run.riskLevel !== null &&
      run.criterio !== null
    ) {
      const key = run.completedAt.toISOString().slice(0, 7);
      const entry = dimMonthMap.get(key) ?? {
        alignment: [],
        riskLevel: [],
        criterio: [],
      };
      entry.alignment.push(run.alignment);
      entry.riskLevel.push(run.riskLevel);
      entry.criterio.push(run.criterio);
      dimMonthMap.set(key, entry);
    }
  }

  const dimensionTrends: DimensionTrend[] = Array.from(dimMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { alignment, riskLevel, criterio }]) => ({
      month: formatMonth(month),
      alignment: Math.round(avg(alignment)),
      riskLevel: Math.round(avg(riskLevel)),
      criterio: Math.round(avg(criterio)),
    }));

  // Total months of data
  const months = new Set<string>();
  for (const run of completedRuns) {
    if (run.completedAt) {
      months.add(run.completedAt.toISOString().slice(0, 7));
    }
  }

  return {
    insufficientData: false,
    overallFirst,
    overallLatest,
    overallDelta,
    processProgress,
    memberProgress,
    dimensionTrends,
    totalMonths: months.size,
  };
}
