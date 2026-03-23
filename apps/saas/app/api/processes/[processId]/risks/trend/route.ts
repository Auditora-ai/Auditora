import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    // Get all risks for this process to join with audit logs
    const risks = await db.processRisk.findMany({
      where: { processDefinitionId: processId },
      select: { id: true },
    });

    if (risks.length === 0) {
      return NextResponse.json({ trend: [] });
    }

    const riskIds = risks.map((r) => r.id);

    const logs = await db.riskAuditLog.findMany({
      where: { riskId: { in: riskIds } },
      select: {
        createdAt: true,
        delta: true,
        risk: {
          select: { riskScore: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date (day granularity)
    const dateMap = new Map<
      string,
      { totalRiskScore: number; criticalCount: number; riskCount: number }
    >();

    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split("T")[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          totalRiskScore: 0,
          criticalCount: 0,
          riskCount: 0,
        });
      }
      const entry = dateMap.get(dateKey)!;
      const score = (log.delta as Record<string, unknown>)?.riskScore as number | undefined;
      if (score !== undefined) {
        entry.totalRiskScore += score;
        entry.riskCount++;
        if (score >= 20) entry.criticalCount++;
      }
    }

    // Also compute current snapshot per date from all risks
    const allRisks = await db.processRisk.findMany({
      where: { processDefinitionId: processId },
      select: { riskScore: true, createdAt: true },
    });

    // If no audit logs have score data, build trend from current risk state
    if (dateMap.size === 0 && allRisks.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      dateMap.set(today, {
        totalRiskScore: allRisks.reduce((sum, r) => sum + r.riskScore, 0),
        criticalCount: allRisks.filter((r) => r.riskScore >= 20).length,
        riskCount: allRisks.length,
      });
    }

    const trend = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ trend });
  } catch (error) {
    console.error("[RiskTrend] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
