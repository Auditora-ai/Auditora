import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Documentacion — aiprocess.me",
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
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
          {activeOrganization.name}
        </p>
        <h1
          className="mt-1 text-3xl font-semibold text-[#0F172A]"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Documentacion de Procesos
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Fuente de verdad de tu organizacion. Todos los datos provienen de sesiones reales.
        </p>
      </div>

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
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Cobertura de Documentacion</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {documentedCount} de {processCount} procesos documentados
            </p>
          </div>
          <span className="text-2xl font-semibold text-[#0F172A]">{coveragePct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-[#F1F5F9]">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              coveragePct >= 80 ? "bg-green-500" : coveragePct >= 50 ? "bg-blue-500" : "bg-amber-500"
            }`}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        {/* Category breakdown */}
        <div className="mt-3 flex gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
            {strategicCount} estrategicos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            {coreCount} core
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {supportCount} soporte
          </span>
          {uncategorizedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E2E8F0]" />
              {uncategorizedCount} sin clasificar
            </span>
          )}
        </div>
      </div>

      {/* Deliverable cards */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Entregables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliverables.map((d) => (
            <Link
              key={d.href}
              href={d.ready ? d.href : "#"}
              className={`group rounded-xl border bg-white p-5 flex flex-col gap-3 transition-all ${
                d.ready
                  ? "border-[#E2E8F0] hover:border-blue-300 hover:shadow-sm cursor-pointer"
                  : "border-[#F1F5F9] opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{d.icon}</span>
                  <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-blue-700 transition-colors">
                    {d.title}
                  </h3>
                </div>
                {d.ready ? (
                  <svg className="h-4 w-4 text-[#CBD5E1] group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                ) : (
                  <span className="text-xs text-[#94A3B8]">Sin datos</span>
                )}
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">{d.description}</p>
              <div className="mt-auto pt-1">
                <span className="text-xs font-medium text-[#64748B]">{d.stat}</span>
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
                ? "border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:shadow-sm cursor-pointer"
                : "border-[#E2E8F0] bg-[#F8FAFC] opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📕</span>
                <h3 className="text-sm font-semibold text-[#0F172A]">Manual de Procesos</h3>
              </div>
              {processCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                  Generar PDF
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              ) : (
                <span className="text-xs text-[#94A3B8]">Sin datos</span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Documento compilado profesional con todo lo documentado: panorama de procesos, fichas, RACI, riesgos, roles y sistemas.
              Un click → documento listo para imprimir como PDF.
            </p>
          </a>
        </div>
      </div>

      {/* Recent processes quick view */}
      {processes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Procesos Registrados</h2>
          <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                  <th className="px-4 py-2.5 text-left font-medium text-[#64748B]">Proceso</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#64748B]">Categoria</th>
                  <th className="px-4 py-2.5 text-left font-medium text-[#64748B]">Owner</th>
                  <th className="px-4 py-2.5 text-center font-medium text-[#64748B]">Estado</th>
                  <th className="px-4 py-2.5 text-center font-medium text-[#64748B]">Sesiones</th>
                  <th className="px-4 py-2.5 text-center font-medium text-[#64748B]">RACI</th>
                  <th className="px-4 py-2.5 text-center font-medium text-[#64748B]">Riesgos</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => (
                  <tr key={p.id} className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#F8FAFC]/50">
                    <td className="px-4 py-2.5 font-medium text-[#0F172A]">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <CategoryBadge category={p.category} />
                    </td>
                    <td className="px-4 py-2.5 text-[#64748B]">{p.owner ?? "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={p.processStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-center text-[#64748B]">{p._count.sessions}</td>
                    <td className="px-4 py-2.5 text-center text-[#64748B]">{p._count.raciEntries}</td>
                    <td className="px-4 py-2.5 text-center text-[#64748B]">{p._count.risks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
      ? "text-green-700"
      : accent === "amber"
        ? "text-amber-700"
        : "text-red-700"
    : "text-[#0F172A]";

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-xs text-[#CBD5E1]">—</span>;
  const styles: Record<string, string> = {
    strategic: "bg-purple-100 text-purple-700",
    core: "bg-blue-100 text-blue-700",
    support: "bg-[#F1F5F9] text-[#64748B]",
  };
  const labels: Record<string, string> = {
    strategic: "Estrategico",
    core: "Core",
    support: "Soporte",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[category] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
      {labels[category] ?? category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-[#F1F5F9] text-[#64748B]",
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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
      {labels[status] ?? status}
    </span>
  );
}
