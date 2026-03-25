import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "RACI Consolidado — aiprocess.me" };

export default async function RaciConsolidadoPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const entries = await db.raciEntry.findMany({
    where: { process: { architecture: { organizationId: activeOrganization.id } } },
    include: { process: { select: { id: true, name: true } } },
    orderBy: [{ process: { name: "asc" } }, { activityName: "asc" }],
  });

  // Build matrix: group by process, rows = activities, columns = roles
  const allRoles = [...new Set(entries.map((e) => e.role))].sort();
  const processeMap = new Map<string, { name: string; activities: Map<string, Map<string, string>> }>();

  for (const entry of entries) {
    if (!processeMap.has(entry.processId)) {
      processeMap.set(entry.processId, {
        name: entry.process.name,
        activities: new Map(),
      });
    }
    const proc = processeMap.get(entry.processId)!;
    if (!proc.activities.has(entry.activityName)) {
      proc.activities.set(entry.activityName, new Map());
    }
    proc.activities.get(entry.activityName)!.set(entry.role, entry.assignment);
  }

  const cellColor: Record<string, string> = {
    R: "bg-blue-100 text-blue-800 font-semibold",
    A: "bg-purple-100 text-purple-800 font-semibold",
    C: "bg-slate-100 text-slate-600",
    I: "bg-slate-50 text-slate-400",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <Link
          href={`/${organizationSlug}/deliverables`}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-2"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver a Documentacion
        </Link>
        <h1
          className="text-2xl font-semibold text-slate-900"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          RACI Consolidado
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {entries.length} asignaciones en {processeMap.size} procesos · {allRoles.length} roles
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">No hay asignaciones RACI. Se generan automaticamente al documentar procesos en sesiones.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left font-medium text-slate-600 min-w-[200px] z-10">
                  Actividad
                </th>
                {allRoles.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-medium text-slate-600 min-w-[100px]">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(processeMap.entries()).map(([procId, proc]) => (
                <>
                  {/* Process group header */}
                  <tr key={`header-${procId}`} className="bg-slate-50/80">
                    <td
                      colSpan={allRoles.length + 1}
                      className="sticky left-0 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-700 uppercase tracking-wide z-10"
                    >
                      {proc.name}
                    </td>
                  </tr>
                  {Array.from(proc.activities.entries()).map(([activity, roleMap]) => (
                    <tr key={`${procId}-${activity}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                      <td className="sticky left-0 bg-white px-4 py-2.5 text-slate-700 z-10">
                        {activity}
                      </td>
                      {allRoles.map((role) => {
                        const val = roleMap.get(role);
                        return (
                          <td key={role} className="px-3 py-2.5 text-center">
                            {val ? (
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs ${cellColor[val] ?? ""}`}>
                                {val}
                              </span>
                            ) : (
                              <span className="text-slate-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {entries.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-semibold text-blue-800">R</span>
            Responsible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-semibold text-purple-800">A</span>
            Accountable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs text-slate-600">C</span>
            Consulted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-50 text-xs text-slate-400">I</span>
            Informed
          </span>
        </div>
      )}
    </div>
  );
}
