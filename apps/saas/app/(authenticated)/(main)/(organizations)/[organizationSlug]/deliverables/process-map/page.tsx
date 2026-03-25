import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProcessMapVisual } from "@deliverables/components/ProcessMapVisual";

export const metadata = { title: "Mapa de Procesos — aiprocess.me" };

export default async function ProcessMapPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const processes = await db.processDefinition.findMany({
    where: { architecture: { organizationId: activeOrganization.id } },
    select: {
      id: true,
      name: true,
      category: true,
      owner: true,
      processStatus: true,
      description: true,
      _count: { select: { sessions: true, risks: true, raciEntries: true } },
    },
    orderBy: { name: "asc" },
  });

  // Get process links from Company Brain
  const brain = await db.companyBrain.findUnique({
    where: { organizationId: activeOrganization.id },
    select: {
      processLinks: {
        select: {
          fromProcessId: true,
          toProcessId: true,
          linkType: true,
        },
      },
    },
  });

  const links = brain?.processLinks ?? [];

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
          Mapa de Procesos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vista de 3 bandas: estrategicos, core y soporte. Click en un proceso para ver detalle.
        </p>
      </div>

      {processes.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">No hay procesos registrados.</p>
        </div>
      ) : (
        <ProcessMapVisual
          processes={processes.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            owner: p.owner,
            status: p.processStatus,
            description: p.description,
            sessions: p._count.sessions,
            risks: p._count.risks,
            raciEntries: p._count.raciEntries,
          }))}
          links={links}
          organizationSlug={organizationSlug}
        />
      )}
    </div>
  );
}
