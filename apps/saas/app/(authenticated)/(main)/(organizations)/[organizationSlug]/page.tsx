import { getActiveOrganization } from "@auth/lib/server";
import {
	RiskDashboard,
	type TopRisk,
	type ActivityItem,
	type VulnerableProcess,
	type NextStepRecommendation,
} from "@command-center/components/RiskDashboard";
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
	const activeOrganization = await getActiveOrganization(organizationSlug);
	return { title: activeOrganization?.name };
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;

	const architecture = await db.processArchitecture.findUnique({
		where: { organizationId: orgId },
		select: { id: true },
	});

	// Parallel queries for dashboard data
	const [processes, topRisksRaw, nextSession, activeSession, recentSessions, evaluacionesData, recentEvaluations] =
		await Promise.all([
			// Process stats
			architecture
				? db.processDefinition.findMany({
						where: {
							architectureId: architecture.id,
							level: "PROCESS",
						},
						select: {
							id: true,
							name: true,
							versions: { select: { id: true }, take: 1 },
							risks: { select: { id: true }, take: 1 },
						},
					})
				: Promise.resolve([]),

			// Top risks by score
			architecture
				? db.processRisk.findMany({
						where: {
							processDefinition: { architectureId: architecture.id },
							status: { notIn: ["CLOSED", "ACCEPTED"] },
						},
						orderBy: { riskScore: "desc" },
						take: 5,
						select: {
							id: true,
							title: true,
							description: true,
							severity: true,
							probability: true,
							riskScore: true,
							processDefinition: { select: { name: true } },
						},
					})
				: Promise.resolve([]),

			// Next scheduled session
			db.meetingSession.findFirst({
				where: {
					organizationId: orgId,
					status: "SCHEDULED",
					scheduledFor: { gte: new Date() },
				},
				orderBy: { scheduledFor: "asc" },
				select: {
					id: true,
					scheduledFor: true,
					processDefinition: { select: { name: true } },
					status: true,
				},
			}),

			// Active session check
			db.meetingSession.findFirst({
				where: {
					organizationId: orgId,
					status: { in: ["ACTIVE", "CONNECTING"] },
				},
				select: { id: true },
			}),

			// Recent ended sessions for activity feed
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

			// Evaluaciones / human risk data
			fetchHumanRiskDashboardData(orgId).catch(() => null),

			// Recent completed evaluations for activity feed
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
					scenario: {
						select: {
							template: { select: { title: true } },
						},
					},
				},
			}),
		]);

	const totalProcesses = processes.length;
	const documentedProcesses = processes.filter(
		(p) => p.versions.length > 0,
	).length;
	const riskCount = architecture
		? await db.processRisk.count({
				where: {
					processDefinition: { architectureId: architecture.id },
				},
			})
		: 0;

	// Maturity score: 25% documentation + 25% risk coverage + 50% evaluations
	const processesWithRisks = processes.filter(
		(p) => p.risks.length > 0,
	).length;
	const processDocumentation =
		totalProcesses > 0 ? documentedProcesses / totalProcesses : 0;
	const riskCoverage =
		totalProcesses > 0 ? processesWithRisks / totalProcesses : 0;
	const evaluationScore =
		evaluacionesData && !evaluacionesData.insufficientData
			? evaluacionesData.orgAvgScore / 100
			: 0;
	const maturityScore = Math.round(
		(processDocumentation * 0.25 + riskCoverage * 0.25 + evaluationScore * 0.5) * 100,
	);

	const topRisks: TopRisk[] = topRisksRaw.map((r) => ({
		id: r.id,
		title: r.title,
		description: r.description,
		processName: r.processDefinition.name,
		severity: r.severity,
		probability: r.probability,
		riskScore: r.riskScore,
	}));

	const t = await getTranslations("dashboard.riskDashboard");
	const basePath = `/${organizationSlug}`;

	// Build enriched activity feed: sessions + evaluations, sorted by date
	const sessionActivity: ActivityItem[] = recentSessions.map((s) => ({
		type: "session_ended" as const,
		title: t("activitySessionCompleted", { process: s.processDefinition?.name ?? t("noProcess") }),
		subtitle: t("activityNodesExtracted", { count: s._count.diagramNodes }),
		date: formatRelativeDate(s.updatedAt, t),
		_sortDate: s.updatedAt,
	}));

	const evalActivity: ActivityItem[] = recentEvaluations
		.filter((e) => e.completedAt)
		.map((e) => ({
			type: "evaluation_completed" as const,
			title: t("activityEvalCompleted", { name: e.scenario.template.title }),
			subtitle: t("activityEvalScore", { score: e.overallScore ?? 0 }),
			date: formatRelativeDate(e.completedAt!, t),
			_sortDate: e.completedAt!,
		}));

	// Merge and sort by date, take top 8
	const allActivity = [...sessionActivity, ...evalActivity]
		.sort((a, b) => (b as ActivityItemWithSort)._sortDate.getTime() - (a as ActivityItemWithSort)._sortDate.getTime())
		.slice(0, 8)
		.map(({ _sortDate, ...rest }) => rest) as ActivityItem[];

	// Vulnerable processes — from evaluaciones heatmap data, sorted by avg alignment (lowest first)
	const vulnerableProcesses: VulnerableProcess[] =
		evaluacionesData && !evaluacionesData.insufficientData
			? evaluacionesData.processHeatmap
					.map((p) => ({
						name: p.processName,
						avgScore: p.avgAlignment,
						processId: p.processName, // using name as ID for now
						simulationCount: p.simulationCount,
					}))
					.sort((a, b) => a.avgScore - b.avgScore)
					.slice(0, 5)
			: [];

	// Next steps recommendations — smart, data-driven
	const nextSteps: NextStepRecommendation[] = computeNextSteps({
		processCount: totalProcesses,
		evaluacionesData,
		vulnerableProcesses,
		basePath,
		t,
	});

	return (
		<div className="h-[calc(100vh-64px)]">
			<RiskDashboard
				organizationId={orgId}
				organizationName={activeOrganization.name}
				organizationSlug={organizationSlug}
				maturityScore={maturityScore}
				topRisks={topRisks}
				nextSession={
					nextSession
						? {
								id: nextSession.id,
								scheduledFor:
									nextSession.scheduledFor!.toISOString(),
								processName:
									nextSession.processDefinition?.name ?? null,
								status: nextSession.status,
							}
						: null
				}
				recentActivity={allActivity}
				processCount={totalProcesses}
				documentedCount={documentedProcesses}
				riskCount={riskCount}
				hasActiveSession={!!activeSession}
				evaluaciones={
					evaluacionesData && !evaluacionesData.insufficientData
						? {
								orgAvgScore: evaluacionesData.orgAvgScore,
								totalSimulations: evaluacionesData.totalSimulations,
								membersEvaluated: evaluacionesData.membersEvaluated,
								completionRate: evaluacionesData.completionRate,
								dimensionAverages: evaluacionesData.dimensionAverages,
								scoreTrend: evaluacionesData.scoreTrend,
							}
						: null
				}
				vulnerableProcesses={vulnerableProcesses}
				nextSteps={nextSteps}
			/>
		</div>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface ActivityItemWithSort extends ActivityItem {
	_sortDate: Date;
}

function formatRelativeDate(date: Date, t: (key: string, values?: Record<string, unknown>) => string): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return t("dateToday");
	if (diffDays === 1) return t("dateYesterday");
	if (diffDays < 7) return t("dateDaysAgo", { count: diffDays });
	return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

interface NextStepsInput {
	processCount: number;
	evaluacionesData: Awaited<ReturnType<typeof fetchHumanRiskDashboardData>> | null;
	vulnerableProcesses: VulnerableProcess[];
	basePath: string;
	t: (key: string, values?: Record<string, unknown>) => string;
}

function computeNextSteps({ processCount, evaluacionesData, vulnerableProcesses, basePath, t }: NextStepsInput): NextStepRecommendation[] {
	const steps: NextStepRecommendation[] = [];

	// No processes yet → first step
	if (processCount === 0) {
		steps.push({
			id: "capture-first",
			message: t("nextStepCapture"),
			href: `${basePath}/sessions`,
			icon: "scan",
		});
		return steps;
	}

	// Has processes but no evaluations data
	if (!evaluacionesData || evaluacionesData.insufficientData) {
		steps.push({
			id: "first-eval",
			message: t("nextStepFirstEval"),
			href: `${basePath}/evaluaciones`,
			icon: "evaluate",
		});
		return steps;
	}

	// Low team alignment (< 60)
	if (evaluacionesData.orgAvgScore < 60 && vulnerableProcesses.length > 0) {
		steps.push({
			id: "improve-weakest",
			message: t("nextStepImproveWeakest", { process: vulnerableProcesses[0]?.name ?? "" }),
			href: `${basePath}/evaluaciones`,
			icon: "improve",
		});
	}

	// Low completion rate (< 50%)
	if (evaluacionesData.completionRate < 50) {
		steps.push({
			id: "boost-completion",
			message: t("nextStepBoostCompletion", { rate: evaluacionesData.completionRate }),
			href: `${basePath}/evaluaciones`,
			icon: "remind",
		});
	}

	// Everything healthy — grow
	if (steps.length === 0) {
		steps.push({
			id: "add-processes",
			message: t("nextStepGrow"),
			href: `${basePath}/processes`,
			icon: "grow",
		});
	}

	return steps.slice(0, 3); // max 3 recommendations
}
