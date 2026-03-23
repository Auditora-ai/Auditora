import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getOrgId() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session?.user) return null;

  const orgs = await auth.api.listOrganizations({
    headers: await headers(),
  });
  return orgs?.[0]?.id ?? null;
}

export async function GET() {
  try {
    const orgId = await getOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all architectures for the org, then all process definitions with risks
    const architectures = await db.processArchitecture.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });

    const archIds = architectures.map((a) => a.id);

    const processes = await db.processDefinition.findMany({
      where: { architectureId: { in: archIds } },
      select: {
        id: true,
        name: true,
        risks: {
          select: {
            id: true,
            title: true,
            riskType: true,
            severity: true,
            probability: true,
            riskScore: true,
            status: true,
            isOpportunity: true,
          },
        },
      },
    });

    // Build per-process summaries
    const processSummaries = processes.map((p) => {
      const activeRisks = p.risks.filter((r) => r.status !== "CLOSED");
      const criticalCount = activeRisks.filter((r) => r.riskScore >= 20).length;
      const highCount = activeRisks.filter(
        (r) => r.riskScore >= 12 && r.riskScore < 20,
      ).length;
      const avgRiskScore =
        activeRisks.length > 0
          ? Math.round(
              activeRisks.reduce((sum, r) => sum + r.riskScore, 0) /
                activeRisks.length,
            )
          : 0;

      // Top risk by score
      const topRisk = activeRisks.sort((a, b) => b.riskScore - a.riskScore)[0] || null;

      return {
        id: p.id,
        name: p.name,
        totalRisks: activeRisks.length,
        criticalCount,
        highCount,
        avgRiskScore,
        topRisk: topRisk
          ? { title: topRisk.title, riskScore: topRisk.riskScore, riskType: topRisk.riskType }
          : null,
      };
    });

    // Build org-level summary
    const allRisks = processes.flatMap((p) =>
      p.risks.filter((r) => r.status !== "CLOSED"),
    );

    const totalRisks = allRisks.length;
    const avgScore =
      totalRisks > 0
        ? Math.round(
            allRisks.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks,
          )
        : 0;

    // Build 5x5 heat matrix (severity x probability)
    const heatMatrix: number[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 0),
    );
    for (const risk of allRisks) {
      const sIdx = Math.min(4, Math.max(0, risk.severity - 1));
      const pIdx = Math.min(4, Math.max(0, risk.probability - 1));
      heatMatrix[sIdx][pIdx]++;
    }

    // Top risk types
    const typeCounts = new Map<string, number>();
    for (const risk of allRisks) {
      typeCounts.set(risk.riskType, (typeCounts.get(risk.riskType) || 0) + 1);
    }
    const topRiskTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      processes: processSummaries,
      orgSummary: {
        totalRisks,
        avgScore,
        heatMatrix,
        topRiskTypes,
      },
    });
  } catch (error) {
    console.error("[OrgRisks] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
