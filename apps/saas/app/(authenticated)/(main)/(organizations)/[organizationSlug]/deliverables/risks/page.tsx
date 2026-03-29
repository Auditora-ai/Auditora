import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Registro de Riesgos — Auditora.ai" };

export default async function RiskRegisterPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const risks = await db.processRisk.findMany({
    where: { processDefinition: { architecture: { organizationId: activeOrganization.id } } },
    include: {
      processDefinition: { select: { name: true } },
      controls: { select: { id: true, controlType: true, description: true, effectiveness: true } },
      mitigations: { select: { id: true, action: true, owner: true, status: true } },
    },
    orderBy: { riskScore: "desc" },
  });

  // Heat map data: count risks per severity x probability cell
  const heatMap: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  for (const r of risks) {
    const si = Math.min(Math.max(r.severity - 1, 0), 4);
    const pi = Math.min(Math.max(r.probability - 1, 0), 4);
    heatMap[si][pi]++;
  }

  // Summary stats
  const criticalCount = risks.filter((r) => r.severity >= 4 && r.probability >= 4).length;
  const highCount = risks.filter((r) => r.riskScore >= 12 && !(r.severity >= 4 && r.probability >= 4)).length;
  const avgScore = risks.length > 0 ? Math.round((risks.reduce((s, r) => s + r.riskScore, 0) / risks.length) * 10) / 10 : 0;

  const sevLabel = (s: number) =>
    s >= 4 ? { text: "Critico", cls: "text-red-700 bg-red-50" }
    : s >= 3 ? { text: "Alto", cls: "text-amber-700 bg-amber-50" }
    : s >= 2 ? { text: "Medio", cls: "text-yellow-700 bg-yellow-50" }
    : { text: "Bajo", cls: "text-green-700 bg-green-50" };

  const heatColor = (count: number, si: number, pi: number) => {
    const score = (si + 1) * (pi + 1);
    if (count === 0) return "bg-muted text-muted-foreground";
    if (score >= 16) return "bg-red-500 text-white font-semibold";
    if (score >= 12) return "bg-red-300 text-red-900";
    if (score >= 8) return "bg-amber-300 text-amber-900";
    if (score >= 4) return "bg-yellow-200 text-yellow-800";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <Link
          href={`/${organizationSlug}/deliverables`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground mb-2"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver a Documentacion
        </Link>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "'Geist Sans', system-ui, sans-serif" }}
        >
          Registro de Riesgos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{risks.length} riesgos identificados</p>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">No hay riesgos registrados. Se identifican automaticamente durante las sesiones.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">{risks.length}</p>
              <p className="text-xs text-muted-foreground">Total Riesgos</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-2xl font-semibold text-red-700">{criticalCount}</p>
              <p className="text-xs text-red-600">Criticos</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-2xl font-semibold text-amber-700">{highCount}</p>
              <p className="text-xs text-amber-600">Altos</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center">
              <p className="text-2xl font-semibold text-foreground">{avgScore}</p>
              <p className="text-xs text-muted-foreground">RPN Promedio</p>
            </div>
          </div>

          {/* Heat map */}
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Mapa de Calor — Severidad × Probabilidad</h2>
            <div className="flex items-end gap-2">
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground pr-2">
                {["5-Catastrofico", "4-Mayor", "3-Moderado", "2-Menor", "1-Insignificante"].map((label, i) => (
                  <div key={i} className="h-12 flex items-center">{label}</div>
                ))}
              </div>
              <div>
                <div className="grid grid-cols-5 gap-1">
                  {[4, 3, 2, 1, 0].map((si) =>
                    [0, 1, 2, 3, 4].map((pi) => (
                      <div
                        key={`${si}-${pi}`}
                        className={`h-12 w-16 rounded flex items-center justify-center text-sm ${heatColor(heatMap[si][pi], si, pi)}`}
                      >
                        {heatMap[si][pi] || ""}
                      </div>
                    )),
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground px-1">
                  {["1-Raro", "2-Poco prob.", "3-Posible", "4-Probable", "5-Casi seguro"].map((l) => (
                    <span key={l} className="w-16 text-center">{l}</span>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">Probabilidad →</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 -rotate-0">↑ Severidad</p>
          </div>

          {/* Risk table */}
          <div className="rounded-lg border border-border bg-background overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Riesgo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proceso</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Sev.</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Prob.</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">RPN</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Controles</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Mitigaciones</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((risk) => {
                  const sev = sevLabel(risk.severity);
                  return (
                    <tr key={risk.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{risk.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{risk.description}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{risk.processDefinition.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-muted-foreground">{risk.riskType.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${sev.cls}`}>
                          {risk.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{risk.probability}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded text-xs font-semibold ${
                          risk.riskScore >= 16 ? "bg-red-100 text-red-800"
                          : risk.riskScore >= 12 ? "bg-amber-100 text-amber-800"
                          : risk.riskScore >= 8 ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                        }`}>
                          {risk.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-muted-foreground">{risk.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{risk.controls.length}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{risk.mitigations.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
