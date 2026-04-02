import { getActiveOrganization } from "@auth/lib/server";
import { RiskDashboard, type TopRisk, type ActivityItem } from "@command-center/components/RiskDashboard";
import { db } from "@repo/database";
import { fetchHumanRiskDashboardData } from "@evaluaciones/lib/dashboard-queries";
import { notFound } from "next/navigation";

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
	const [processes, topRisksRaw, nextSession, activeSession, recentSessions, evaluacionesData] =
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

	// Maturity score calculation (mirrors getNavSummary)
	const processesWithRisks = processes.filter(
		(p) => p.risks.length > 0,
	).length;
	const processDocumentation =
		totalProcesses > 0 ? documentedProcesses / totalProcesses : 0;
	const riskCoverage =
		totalProcesses > 0 ? processesWithRisks / totalProcesses : 0;
	const maturityScore = Math.round(
		(processDocumentation * 0.3 + riskCoverage * 0.3) * 100,
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

	const recentActivity: ActivityItem[] = recentSessions.map((s) => ({
		type: "session_ended" as const,
		title: `Sesión "${s.processDefinition?.name ?? "Sin proceso"}" completada`,
		subtitle: `${s._count.diagramNodes} nodos extraídos`,
		date: formatRelativeDate(s.updatedAt),
	}));

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
				recentActivity={recentActivity}
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
			/>
		</div>
	);
}

function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Hoy";
	if (diffDays === 1) return "Ayer";
	if (diffDays < 7) return `Hace ${diffDays} días`;
	return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}
