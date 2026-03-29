import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@shared/components/PageHeader";

export const metadata = {
  title: "Documentacion — Auditora.ai",
};

export default async function DeliverablesDashboardPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const orgId = activeOrganization.id;

  // Parallel queries for dashboard stats
  const [
    processes,
    sessionCount,
    raciCount,
    riskCount,
    brain,
  ] = await Promise.all([
    db.processDefinition.findMany({
      where: { architecture: { organizationId: orgId } },
      select: {
        id: true,
        name: true,
        category: true,
        processStatus: true,
        owner: true,
        _count: { select: { raciEntries: true, risks: true, sessions: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.meetingSession.count({
      where: { organizationId: orgId, status: "ENDED" },
    }),
    db.raciEntry.count({
      where: { process: { architecture: { organizationId: orgId } } },
    }),
    db.processRisk.count({
      where: { processDefinition: { architecture: { organizationId: orgId } } },
    }),
    db.companyBrain.findUnique({
      where: { organizationId: orgId },
      select: {
        _count: {
          select: {
            globalRoles: true,
            globalSystems: true,
            processLinks: true,
          },
        },
      },
    }),
  ]);

  const processCount = processes.length;
  const documentedCount = processes.filter(
    (p) => p.processStatus === "MAPPED" || p.processStatus === "VALIDATED" || p.processStatus === "APPROVED",
  ).length;
  const coveragePct = processCount > 0 ? Math.round((documentedCount / processCount) * 100) : 0;

  // Count unique departments from process owners
  const departments = new Set(
    processes.map((p) => p.owner).filter(Boolean),
  );

  // Processes by category
  const strategicCount = processes.filter((p) => p.category === "strategic").length;
  const coreCount = processes.filter((p) => p.category === "core").length;
  const supportCount = processes.filter((p) => p.category === "support").length;
  const uncategorizedCount = processCount - strategicCount - coreCount - supportCount;

  const deliverables = [
    {
      href: `/${organizationSlug}/deliverables/process-cards`,
      icon: "📋",
      title: "Fichas de Proceso",
      description: "Ficha tecnica de cada proceso: owner, triggers, outputs, RACI, riesgos.",
      stat: `${processCount} procesos`,
      ready: processCount > 0,
    },
    {
      href: `/${organizationSlug}/deliverables/process-map`,
      icon: "🗺️",
      title: "Mapa de Procesos",
      description: "Mapa visual de 3 bandas: estrategicos, core y soporte.",
      stat: `${strategicCount}S / ${coreCount}C / ${supportCount}So`,
      ready: processCount > 0,
    },
    {
      href: `/${organizationSlug}/deliverables/raci`,
      icon: "👥",
      title: "RACI Consolidado",
      description: "Matriz de responsabilidades de toda la organizacion.",
      stat: `${raciCount} asignaciones`,
      ready: raciCount > 0,
    },
    {
      href: `/${organizationSlug}/deliverables/risks`,
      icon: "⚠️",
      title: "Registro de Riesgos",
      description: "Matriz consolidada de riesgos con heat map y mitigaciones.",
      stat: `${riskCount} riesgos`,
      ready: riskCount > 0,
    },
    {
      href: `/${organizationSlug}/deliverables/horizontal-view`,
      icon: "↔️",
      title: "Vista Horizontal",
      description: "Flujo cross-departamental con handoffs y dependencias.",
      stat: `${brain?._count.processLinks ?? 0} conexiones`,
      ready: (brain?._count.processLinks ?? 0) > 0,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <PageHeader
        title="Documentacion de Procesos"
        subtitle={`${activeOrganization.name} — Fuente de verdad. Todos los datos provienen de sesiones reales.`}
        className="mb-0 border-b border-border px-6 py-4"
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Procesos" value={processCount} />
        <StatCard label="Documentados" value={documentedCount} accent="green" />
        <StatCard label="Sesiones" value={sessionCount} />
        <StatCard label="Riesgos" value={riskCount} accent={riskCount > 0 ? "amber" : undefined} />
        <StatCard label="Roles" value={brain?._count.globalRoles ?? 0} />
        <StatCard label="Sistemas" value={brain?._count.globalSystems ?? 0} />
      </div>

      {/* Coverage bar */}
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Cobertura de Documentacion</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {documentedCount} de {processCount} procesos documentados
            </p>
          </div>
          <span className="text-2xl font-semibold text-foreground">{coveragePct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              coveragePct >= 80 ? "bg-success" : coveragePct >= 50 ? "bg-primary" : "bg-orientation"
            }`}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        {/* Category breakdown */}
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-600" />
            {strategicCount} estrategicos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {coreCount} core
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            {supportCount} soporte
          </span>
          {uncategorizedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-border" />
              {uncategorizedCount} sin clasificar
            </span>
          )}
        </div>
      </div>

      {/* Deliverable cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Entregables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliverables.map((d) => (
            <Link
              key={d.href}
              href={d.ready ? d.href : "#"}
              className={`group rounded-xl border bg-background p-5 flex flex-col gap-3 transition-all ${
                d.ready
                  ? "border-border hover:border-primary/30 hover:shadow-sm cursor-pointer"
                  : "border-muted opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{d.icon}</span>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {d.title}
                  </h3>
                </div>
                {d.ready ? (
                  <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin datos</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
              <div className="mt-auto pt-1">
                <span className="text-xs font-medium text-muted-foreground">{d.stat}</span>
              </div>
            </Link>
          ))}

          {/* Manual de Procesos — special card */}
          <a
            href={processCount > 0 ? `/api/deliverables/manual?organizationId=${orgId}` : "#"}
            target={processCount > 0 ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`rounded-xl border-2 p-5 flex flex-col gap-3 md:col-span-2 lg:col-span-3 transition-all ${
              processCount > 0
                ? "border-primary/30 bg-accent hover:border-primary/50 hover:shadow-sm cursor-pointer"
                : "border-border bg-secondary opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📕</span>
                <h3 className="text-sm font-semibold text-foreground">Manual de Procesos</h3>
              </div>
              {processCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  Generar PDF
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Sin datos</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Documento compilado profesional con todo lo documentado: panorama de procesos, fichas, RACI, riesgos, roles y sistemas.
              Un click → documento listo para imprimir como PDF.
            </p>
          </a>
        </div>
      </div>

      {/* Recent processes quick view */}
      {processes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Procesos Registrados</h2>
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted bg-secondary">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Proceso</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Sesiones</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">RACI</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Riesgos</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => (
                  <tr key={p.id} className="border-b border-secondary last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <CategoryBadge category={p.category} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.owner ?? "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={p.processStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{p._count.sessions}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{p._count.raciEntries}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{p._count.risks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// -- Helper components --

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "amber" | "red";
}) {
  const valueColor = accent
    ? accent === "green"
      ? "text-success"
      : accent === "amber"
        ? "text-orientation"
        : "text-destructive"
    : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-xs text-muted-foreground">—</span>;
  const styles: Record<string, string> = {
    strategic: "bg-purple-100 text-purple-700",
    core: "bg-blue-100 text-blue-700",
    support: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    strategic: "Estratégico",
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
