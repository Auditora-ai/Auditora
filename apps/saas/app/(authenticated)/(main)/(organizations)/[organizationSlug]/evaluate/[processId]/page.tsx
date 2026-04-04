import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EvaluacionHub } from "@evaluaciones/components/EvaluacionHub";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { processId } = await params;
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { name: true },
	});
	return { title: `Evaluación — ${process?.name ?? ""}` };
}

export default async function EvaluateProcessPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { id: true, name: true, architecture: { select: { organizationId: true } } },
	});
	if (!process || process.architecture.organizationId !== activeOrganization.id) return notFound();

	// Get templates for this process
	const templates = await db.simulationTemplate.findMany({
		where: {
			organizationId: activeOrganization.id,
			processDefinitionId: processId,
			status: { in: ["PUBLISHED", "DRAFT"] },
		},
		include: {
			processDefinition: { select: { name: true } },
			scenarios: {
				include: {
					runs: {
						select: { status: true, overallScore: true },
					},
				},
			},
		},
		orderBy: { updatedAt: "desc" },
	});

	const recentRuns = await db.simulationRun.findMany({
		where: {
			scenario: {
				template: { organizationId: activeOrganization.id, processDefinitionId: processId },
			},
		},
		include: {
			user: { select: { name: true, image: true } },
			scenario: {
				include: {
					template: { select: { title: true, targetRole: true } },
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<div>
				<h1 className="text-xl md:text-2xl font-semibold text-foreground">
					Evaluación: {process.name}
				</h1>
			</div>
			<EvaluacionHub
				templates={templates}
				recentRuns={recentRuns}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
