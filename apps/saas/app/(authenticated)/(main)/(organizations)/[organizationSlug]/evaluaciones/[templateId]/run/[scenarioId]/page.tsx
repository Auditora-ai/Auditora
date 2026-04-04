import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound, redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { EvaluacionRunPage } from "@evaluaciones/components/EvaluacionRunPage";

export async function generateMetadata() {
  return { title: "Evaluación en curso" };
}

export default async function RunScenarioPage({
  params,
}: {
  params: Promise<{
    organizationSlug: string;
    templateId: string;
    scenarioId: string;
  }>;
}) {
  const { organizationSlug, templateId, scenarioId } = await params;

  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session?.user) return redirect("/sign-in");

  // Fetch scenario with decisions
  const scenario = await db.simulationScenario.findUnique({
    where: { id: scenarioId },
    include: {
      template: {
        select: {
          id: true,
          title: true,
          narrative: true,
          organizationId: true,
          status: true,
        },
      },
      decisions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          prompt: true,
          options: true,
          consequences: true,
          proceduralReference: true,
        },
      },
    },
  });

  if (
    !scenario ||
    scenario.template.id !== templateId ||
    scenario.template.organizationId !== activeOrganization.id
  ) {
    return notFound();
  }

  if (scenario.template.status !== "PUBLISHED") {
    return notFound();
  }

  // Create a new run
  const run = await db.simulationRun.create({
    data: {
      scenarioId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
  });

  // Parse JSON fields for decisions
  const decisions = scenario.decisions.map((d) => ({
    id: d.id,
    order: d.order,
    prompt: d.prompt,
    options: d.options as Array<{ label: string; description: string }>,
    consequences: d.consequences as string[],
    proceduralReference: d.proceduralReference,
  }));

  const respondEndpoint = `/api/evaluaciones/${templateId}/run/${run.id}`;
  const backHref = `/${organizationSlug}/evaluaciones/${templateId}`;

  return (
    <EvaluacionRunPage
      decisions={decisions}
      respondEndpoint={respondEndpoint}
      backHref={backHref}
      templateTitle={scenario.template.title}
      narrative={scenario.template.narrative}
    />
  );
}
