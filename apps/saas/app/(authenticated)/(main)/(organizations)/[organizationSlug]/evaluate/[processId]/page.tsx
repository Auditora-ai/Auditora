import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EvaluacionHub } from "@evaluaciones/components/EvaluacionHub";
import { EvaluacionesTabs } from "@evaluaciones/components/EvaluacionesTabs";
import { fetchHumanRiskDashboardData, fetchProgressData } from "@evaluaciones/lib/dashboard-queries";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { processId } = await params;
	const t = await getTranslations();
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { name: true },
	});
	return { title: `${t("app.menu.evaluation")} — ${process?.name ?? ""}` };
}

export default async function EvaluateProcessPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { organizationSlug, processId } = await params;
	const { tab } = await searchParams;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { id: true, name: true, architecture: { select: { organizationId: true } } },
	});
	if (!process || process.architecture.organizationId !== activeOrganization.id) return notFound();

	// Get templates scoped to this process
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

	const [dashboardData, progressData] = await Promise.all([
		fetchHumanRiskDashboardData(activeOrganization.id),
		fetchProgressData(activeOrganization.id),
	]);

	const validTabs = ["dashboard", "progress"] as const;
	const activeTab = validTabs.includes(tab as typeof validTabs[number])
		? (tab as "dashboard" | "progress")
		: "catalog";

	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<div>
				<h1 className="text-xl md:text-2xl font-semibold text-foreground">
					{t("app.menu.evaluation")}: {process.name}
				</h1>
				<p className="mt-0.5 text-xs md:text-sm text-muted-foreground">
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
				progressData={progressData}
			/>
		</div>
	);
}
