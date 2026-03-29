import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HorizontalFlowVisual } from "@deliverables/components/HorizontalFlowVisual";

export const metadata = { title: "Vista Horizontal — Auditora.ai" };

export default async function HorizontalViewPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) notFound();

  const orgId = activeOrganization.id;

  // Get processes with owner (departments)
  const processes = await db.processDefinition.findMany({
    where: { architecture: { organizationId: orgId } },
    select: { id: true, name: true, owner: true, category: true, description: true },
    orderBy: { name: "asc" },
  });

  // Get process links from Company Brain
  const brain = await db.companyBrain.findUnique({
    where: { organizationId: orgId },
    select: {
      processLinks: {
        select: {
          id: true,
          fromProcessId: true,
          toProcessId: true,
          linkType: true,
          description: true,
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
          Vista Horizontal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Flujo cross-departamental: como fluye el trabajo entre areas. Basado en {links.length} conexiones reales.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay conexiones entre procesos. Se descubren automaticamente al documentar procesos en sesiones.
          </p>
        </div>
      ) : (
        <HorizontalFlowVisual
          processes={processes.map((p) => ({
            id: p.id,
            name: p.name,
            owner: p.owner,
            category: p.category,
            description: p.description,
          }))}
          links={links.map((l) => ({
            id: l.id,
            from: l.fromProcessId,
            to: l.toProcessId,
            type: l.linkType,
            description: l.description,
          }))}
          organizationSlug={organizationSlug}
        />
      )}
    </div>
  );
}
