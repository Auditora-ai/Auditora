import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Fichas de Proceso — Auditora.ai",
};

export default async function ProcessCardsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const t = await getTranslations("emptyStates.deliverables");
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const processes = await db.processDefinition.findMany({
    where: { architecture: { organizationId: activeOrganization.id } },
    include: {
      raciEntries: true,
      risks: {
        select: { id: true, title: true, riskType: true, severity: true, probability: true, riskScore: true, status: true },
        orderBy: { riskScore: "desc" },
        take: 5,
      },
      intelligence: {
        select: { completenessScore: true, knowledgeSnapshot: true },
      },
      _count: { select: { sessions: true, risks: true, raciEntries: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            Fichas de Proceso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{processes.length} procesos registrados</p>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </div>
          <h3 className="font-medium text-foreground">{t("noProcessCards")}</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{t("noProcessCardsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {processes.map((process) => {
            const snapshot = process.intelligence?.knowledgeSnapshot as Record<string, unknown> | null;
            const completeness = process.intelligence?.completenessScore ?? 0;

            // Build mini RACI summary
            const raciRoles = new Map<string, Set<string>>();
            for (const entry of process.raciEntries) {
              if (!raciRoles.has(entry.role)) raciRoles.set(entry.role, new Set());
              raciRoles.get(entry.role)!.add(entry.assignment);
            }

            // Extract systems from intelligence snapshot
            const systems = (snapshot?.systems as Array<{ name?: string }>) ?? [];

            return (
              <div key={process.id} className="rounded-lg border border-border bg-background overflow-hidden">
                {/* Card header */}
                <div className="flex items-start justify-between border-b border-border px-6 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">{process.name}</h2>
                      <CategoryBadge category={process.category} />
                      <StatusBadge status={process.processStatus} />
                    </div>
                    {process.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{process.description}</p>
                    )}
                  </div>
                  {/* Completeness ring */}
                  <div className="flex flex-col items-center ml-4">
                    <div className="relative h-12 w-12">
                      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="16" fill="none"
                          stroke={completeness >= 80 ? "#16a34a" : completeness >= 50 ? "#2563eb" : "#d97706"}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${completeness} ${100 - completeness}`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                        {completeness}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Completitud</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {/* Owner */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Responsable</span>
                      <p className="text-foreground mt-0.5">{process.owner ?? "Sin asignar"}</p>
                    </div>

                    {/* Sessions */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Sesiones</span>
                      <p className="text-foreground mt-0.5">{process._count.sessions}</p>
                    </div>

                    {/* RACI entries */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Asignaciones RACI</span>
                      <p className="text-foreground mt-0.5">{process._count.raciEntries}</p>
                    </div>

                    {/* Risks */}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Riesgos</span>
                      <p className="text-foreground mt-0.5">{process._count.risks}</p>
                    </div>
                  </div>

                  {/* Triggers & Outputs */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {process.triggers.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Triggers</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {process.triggers.map((t, i) => (
                            <span key={i} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {process.outputs.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Outputs</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {process.outputs.map((o, i) => (
                            <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{o}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Systems */}
                  {systems.length > 0 && (
                    <div className="mt-4">
                      <span className="text-xs font-medium text-muted-foreground">Sistemas</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {systems.map((s, i) => (
                          <span key={i} className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                            {s.name ?? "Sistema"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top risks */}
                  {process.risks.length > 0 && (
                    <div className="mt-4">
                      <span className="text-xs font-medium text-muted-foreground">Top Riesgos</span>
                      <div className="mt-1 space-y-1">
                        {process.risks.slice(0, 3).map((risk) => (
                          <div key={risk.id} className="flex items-center gap-2 text-xs">
                            <span className={`h-2 w-2 rounded-full ${
                              risk.severity >= 4 ? "bg-red-500" : risk.severity >= 3 ? "bg-amber-500" : "bg-yellow-400"
                            }`} />
                            <span className="text-foreground">{risk.title}</span>
                            <span className="text-muted-foreground">RPN: {risk.riskScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mini RACI */}
                  {raciRoles.size > 0 && (
                    <div className="mt-4">
                      <span className="text-xs font-medium text-muted-foreground">Roles RACI</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Array.from(raciRoles.entries()).map(([role, assignments]) => (
                          <span key={role} className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs">
                            <span className="text-foreground">{role}</span>
                            <span className="text-muted-foreground">({Array.from(assignments).join(",")})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="flex items-center gap-3 border-t border-border px-6 py-3 bg-muted/50">
                  {process.goals.length > 0 && (
                    <span className="text-xs text-muted-foreground">{process.goals.length} objetivos</span>
                  )}
                  <div className="flex-1" />
                  <Link
                    href={`/${organizationSlug}/processes/${process.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver proceso completo →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const styles: Record<string, string> = {
    strategic: "bg-purple-100 text-purple-700",
    core: "bg-blue-100 text-blue-700",
    support: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    strategic: "Estrategico",
    core: "Core",
    support: "Soporte",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[category] ?? "bg-muted text-muted-foreground"}`}>
      {labels[category] ?? category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    MAPPED: "bg-blue-100 text-blue-700",
    VALIDATED: "bg-green-100 text-green-700",
    APPROVED: "bg-green-100 text-green-800",
  };
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    MAPPED: "Mapeado",
    VALIDATED: "Validado",
    APPROVED: "Aprobado",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {labels[status] ?? status}
    </span>
  );
}
