import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EvaluacionHub } from "@evaluaciones/components/EvaluacionHub";
import { EvaluacionesTabs } from "@evaluaciones/components/EvaluacionesTabs";
import { fetchHumanRiskDashboardData } from "@evaluaciones/lib/dashboard-queries";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("app.menu.evaluaciones") };
}

export default async function EvaluacionesPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { organizationSlug } = await params;
	const { tab } = await searchParams;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	// Always fetch both datasets — tabs switch client-side
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

	const dashboardData = await fetchHumanRiskDashboardData(activeOrganization.id);

	const activeTab = tab === "dashboard" ? "dashboard" : "catalog";

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					{t("app.menu.evaluaciones")}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("evaluaciones.pageDescription")}
				</p>
			</div>

			<EvaluacionesTabs
				activeTab={activeTab}
				organizationSlug={organizationSlug}
				catalogContent={
					<EvaluacionHub
						templates={templates}
						recentRuns={recentRuns}
						organizationSlug={organizationSlug}
					/>
				}
				dashboardData={dashboardData}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
