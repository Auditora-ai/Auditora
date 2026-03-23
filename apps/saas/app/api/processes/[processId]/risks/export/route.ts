import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { generateRiskReportHtml } from "../../../../../../lib/export/risk-report-generator";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { processId } = await params;

    const processDef = await db.processDefinition.findUnique({
      where: { id: processId },
      include: {
        architecture: {
          include: { organization: { select: { name: true } } },
        },
        risks: {
          include: { mitigations: true, controls: true },
          orderBy: { riskScore: "desc" },
        },
      },
    });

    if (!processDef) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allRisks = processDef.risks;
    const summary = {
      totalRisks: allRisks.length,
      criticalCount: allRisks.filter((r) => r.riskScore >= 20).length,
      highCount: allRisks.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length,
      mediumCount: allRisks.filter((r) => r.riskScore >= 6 && r.riskScore < 12).length,
      lowCount: allRisks.filter((r) => r.riskScore < 6).length,
      opportunities: allRisks.filter((r) => r.isOpportunity).length,
      avgRiskScore:
        allRisks.length > 0
          ? Math.round(allRisks.reduce((s, r) => s + r.riskScore, 0) / allRisks.length)
          : 0,
    };

    const html = generateRiskReportHtml({
      organizationName: processDef.architecture?.organization?.name || "—",
      processName: processDef.name,
      processDescription: processDef.description || undefined,
      date: new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      risks: allRisks.map((r) => ({
        title: r.title,
        description: r.description,
        riskType: r.riskType,
        severity: r.severity,
        probability: r.probability,
        riskScore: r.riskScore,
        status: r.status,
        isOpportunity: r.isOpportunity,
        affectedStep: r.affectedStep,
        residualScore: r.residualScore,
        failureMode: r.failureMode,
        failureEffect: r.failureEffect,
        rpn: r.rpn,
        mitigations: r.mitigations.map((m) => ({
          action: m.action,
          owner: m.owner,
          status: m.status,
        })),
        controls: r.controls.map((c) => ({
          name: c.name,
          controlType: c.controlType,
          effectiveness: c.effectiveness,
        })),
      })),
      summary,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="risk-report-${processDef.name.replace(/\s+/g, "-")}.html"`,
      },
    });
  } catch (error) {
    console.error("[RiskExport] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
