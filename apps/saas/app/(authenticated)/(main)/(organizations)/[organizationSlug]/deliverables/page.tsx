import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { DeliverablesGrid } from "@deliverables/components/DeliverablesGrid";

export const metadata = {
  title: "Entregables — Prozea",
};

export default async function DeliverablesPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  // Fetch existing deliverables
  const existingDeliverables = await db.orgDeliverable.findMany({
    where: { organizationId: activeOrganization.id },
    orderBy: { updatedAt: "desc" },
    select: {
      type: true,
      status: true,
      data: true,
      confidence: true,
      error: true,
    },
  });

  // Deduplicate by type (keep latest)
  const deliverableMap = new Map<
    string,
    (typeof existingDeliverables)[number]
  >();
  for (const d of existingDeliverables) {
    if (!deliverableMap.has(d.type)) {
      deliverableMap.set(d.type, d);
    }
  }

  // Get Company Brain status
  const brain = await db.companyBrain.findUnique({
    where: { organizationId: activeOrganization.id },
    select: {
      lastEnrichedAt: true,
      _count: {
        select: {
          valueChainActivities: true,
          processLinks: true,
          globalRoles: true,
          globalSystems: true,
          enrichmentHistory: true,
        },
      },
    },
  });

  const processCount = await db.processDefinition.count({
    where: { architecture: { organizationId: activeOrganization.id } },
  });

  const sessionCount = await db.meetingSession.count({
    where: { organizationId: activeOrganization.id, status: "ENDED" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Entregables de Consultoria
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Genera automaticamente todos los documentos de un proyecto BPM
          profesional.
        </p>
      </div>

      {/* Company Brain status */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Company Brain — {activeOrganization.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {brain
                ? `Ultima actualizacion: ${brain.lastEnrichedAt ? new Date(brain.lastEnrichedAt).toLocaleDateString("es") : "nunca"}`
                : "No inicializado — se creara automaticamente al generar entregables"}
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>{processCount} procesos</span>
            <span>{sessionCount} sesiones</span>
            {brain && (
              <>
                <span>
                  {brain._count.valueChainActivities} actividades cadena de
                  valor
                </span>
                <span>{brain._count.processLinks} links</span>
                <span>{brain._count.globalRoles} roles</span>
                <span>{brain._count.globalSystems} sistemas</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deliverables grid */}
      <DeliverablesGrid
        organizationId={activeOrganization.id}
        existingDeliverables={Array.from(deliverableMap.values()).map(
          (d) => ({
            type: d.type,
            status: d.status,
            data: d.data,
            confidence: d.confidence,
            error: d.error,
          }),
        )}
      />
    </div>
  );
}
