import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { OrgRisksDashboard } from "@/modules/process-library/components/risks/OrgRisksDashboard";
import type { OrgRiskData, ProcessSummary, RiskStats } from "@/modules/process-library/components/risks/OrgRisksDashboard";

export const metadata = { title: "Riesgos Operativos — Auditora.ai" };

export default async function OrgRisksPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const orgId = activeOrganization.id;

  const [risks, processDefinitions] = await Promise.all([
    db.processRisk.findMany({
      where: {
        processDefinition: { architecture: { organizationId: orgId } },
      },
      include: {
        processDefinition: { select: { id: true, name: true } },
        affectedNode: { select: { id: true, label: true, nodeType: true } },
        controls: {
          select: {
            id: true,
            name: true,
            controlType: true,
            effectiveness: true,
            automated: true,
          },
        },
        mitigations: {
          select: {
            id: true,
            action: true,
            owner: true,
            deadline: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { riskScore: "desc" },
    }),
    db.processDefinition.findMany({
      where: { architecture: { organizationId: orgId } },
      select: {
        id: true,
        name: true,
        _count: { select: { risks: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize risks for client component
  const serializedRisks: OrgRiskData[] = risks.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    riskType: r.riskType,
    severity: r.severity,
    probability: r.probability,
    riskScore: r.riskScore,
    affectedStep: r.affectedStep,
    affectedNode: r.affectedNode,
    status: r.status,
    isOpportunity: r.isOpportunity,
    failureMode: r.failureMode,
    failureEffect: r.failureEffect,
    detectionDifficulty: r.detectionDifficulty,
    rpn: r.rpn,
    opportunityValue: r.opportunityValue ? Number(r.opportunityValue) : null,
    residualSeverity: r.residualSeverity,
    residualProbability: r.residualProbability,
    residualScore: r.residualScore,
    mitigations: r.mitigations.map((m) => ({
      ...m,
      deadline: m.deadline?.toISOString() ?? null,
    })),
    controls: r.controls,
    processId: r.processDefinitionId,
    processName: r.processDefinition.name,
  }));

  const processes: ProcessSummary[] = processDefinitions.map((p) => ({
    id: p.id,
    name: p.name,
    riskCount: p._count.risks,
  }));

  // Compute stats
  const activeRisks = serializedRisks.filter((r) => r.status !== "CLOSED");
  const stats: RiskStats = {
    total: activeRisks.length,
    critical: activeRisks.filter((r) => r.riskScore >= 20).length,
    high: activeRisks.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length,
    avgScore:
      activeRisks.length > 0
        ? Math.round(
            (activeRisks.reduce((s, r) => s + r.riskScore, 0) / activeRisks.length) * 10,
          ) / 10
        : 0,
    opportunities: serializedRisks.filter((r) => r.isOpportunity).length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <OrgRisksDashboard
        risks={serializedRisks}
        processes={processes}
        stats={stats}
        organizationSlug={organizationSlug}
      />
    </div>
  );
}
