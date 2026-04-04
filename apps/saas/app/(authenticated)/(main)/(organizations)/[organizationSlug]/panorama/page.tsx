import { getActiveOrganization } from "@auth/lib/server";
import { PanoramaPage } from "@/modules/panorama";
import type { PanoramaData, PanoramaActionItem, PanoramaActivityItem } from "@/modules/panorama/types";
import { db } from "@repo/database";
import { fetchHumanRiskDashboardData } from "@evaluaciones/lib/dashboard-queries";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const org = await getActiveOrganization(organizationSlug);
	return { title: `Panorama — ${org?.name ?? ""}` };
}

export default async function PanoramaServerPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;
	const t = await getTranslations("dashboard.panorama");
	const basePath = `/${organizationSlug}`;

	const architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
		select: { id: true },
	});

	const [processes, evaluacionesData, recentSessions, recentEvaluations] =
		await Promise.all([
			architecture
				? db.processDefinition.findMany({
						where: { architectureId: architecture.id, level: "PROCESS" },
						select: {
							id: true,
							name: true,
							versions: { select: { id: true }, take: 1 },
						},
					})
				: Promise.resolve([]),
			fetchHumanRiskDashboardData(orgId).catch(() => null),
			db.meetingSession.findMany({
				where: { organizationId: orgId, status: "ENDED" },
				orderBy: { updatedAt: "desc" },
				take: 5,
				select: {
					id: true,
					updatedAt: true,
					processDefinition: { select: { name: true } },
					_count: { select: { diagramNodes: true } },
				},
			}),
			db.simulationRun.findMany({
				where: {
					status: "COMPLETED",
					scenario: { template: { organizationId: orgId } },
				},
				orderBy: { completedAt: "desc" },
				take: 5,
				select: {
					id: true,
					overallScore: true,
					completedAt: true,
					scenario: { select: { template: { select: { title: true } } } },
				},
			}),
		]);

	const totalProcesses = processes.length;
	const documentedCount = processes.filter((p) => p.versions.length > 0).length;
	const documentedPercent = totalProcesses > 0 ? Math.round((documentedCount / totalProcesses) * 100) : 0;

	const insufficientData = !evaluacionesData || evaluacionesData.insufficientData === true;

	const evaluatedPercent = insufficientData
		? 0
		: Math.round(evaluacionesData.completionRate);
	const alignmentPercent = insufficientData
		? 0
		: Math.round(evaluacionesData.orgAvgScore);
	const completionRate = insufficientData
		? 0
		: Math.round(evaluacionesData.completionRate);

	// Maturity score: 25% docs + 25% risk + 50% eval
	const maturityScore = insufficientData
		? Math.round(documentedPercent * 0.5)
		: Math.round(documentedPercent * 0.25 + alignmentPercent * 0.5 + completionRate * 0.25);

	const scoreTrend = insufficientData ? [] : evaluacionesData.scoreTrend;
	const processHeatmap = insufficientData ? [] : evaluacionesData.processHeatmap;

	// Vulnerable processes (avgAlignment < 60)
	const vulnerableProcesses = insufficientData
		? []
		: evaluacionesData.processHeatmap
				.filter((p) => p.avgAlignment < 60)
				.sort((a, b) => a.avgAlignment - b.avgAlignment)
				.slice(0, 5)
				.map((p) => ({ name: p.processName, avgScore: p.avgAlignment, simulationCount: p.simulationCount }));

	// Smart action recommendations
	const actions: PanoramaActionItem[] = [];
	const undocumented = processes.filter((p) => p.versions.length === 0);
	if (undocumented.length > 0) {
		actions.push({
			type: "document",
			processName: t("actionDocument", { name: undocumented[0]!.name }),
			href: `${basePath}/descubrir`,
		});
	}
	if (!insufficientData) {
		const weakest = evaluacionesData.processHeatmap
			.sort((a, b) => a.avgAlignment - b.avgAlignment)
			.find((p) => p.avgAlignment < 70);
		if (weakest) {
			actions.push({
				type: "re-evaluate",
				processName: t("actionReEvaluate", { name: weakest.processName }),
				href: `${basePath}/evaluaciones`,
			});
		}
	}
	if (evaluacionesData && !insufficientData && evaluacionesData.membersEvaluated < 5) {
		actions.push({
			type: "evaluate",
			processName: t("actionEvaluate", { name: "" }),
			href: `${basePath}/evaluaciones`,
		});
	}

	// Activity feed
	const sessionActivity: PanoramaActivityItem[] = recentSessions.map((s) => ({
		type: "session_ended",
		title: t("sessionCompleted"),
		subtitle: t("nodesExtracted", { count: s._count.diagramNodes }),
		date: formatRelative(s.updatedAt),
	}));
	const evalActivity: PanoramaActivityItem[] = recentEvaluations
		.filter((e) => e.completedAt)
		.map((e) => ({
			type: "evaluation_completed",
			title: t("evalCompleted"),
			subtitle: t("score", { score: e.overallScore ?? 0 }),
			date: formatRelative(e.completedAt!),
		}));
	const activity = [...sessionActivity, ...evalActivity]
		.sort((a, b) => 0) // already sorted by recency from DB
		.slice(0, 8);

	const data: PanoramaData = {
		organizationSlug,
		maturityScore,
		scoreTrend,
		documentedPercent,
		evaluatedPercent,
		alignmentPercent,
		completionRate,
		vulnerableProcesses,
		actions,
		activity,
		processHeatmap,
		insufficientData,
	};

	return <PanoramaPage data={data} />;
}

function formatRelative(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	if (diffDays === 0) return "Hoy";
	if (diffDays === 1) return "Ayer";
	if (diffDays < 7) return `Hace ${diffDays}d`;
	return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
