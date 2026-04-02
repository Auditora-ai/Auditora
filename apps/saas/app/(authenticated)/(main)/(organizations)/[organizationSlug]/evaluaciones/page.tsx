import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EvaluacionHub } from "@evaluaciones/components/EvaluacionHub";

export async function generateMetadata() {
	return { title: "Evaluaciones" };
}

export default async function EvaluacionesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const templates = await db.simulationTemplate.findMany({
		where: {
			organizationId: activeOrganization.id,
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
				template: { organizationId: activeOrganization.id },
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
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					{t("app.menu.evaluaciones")}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Evaluaciones tipo caso Harvard generadas a partir de tus procesos y riesgos reales.
				</p>
			</div>
			<EvaluacionHub
				templates={templates}
				recentRuns={recentRuns}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
