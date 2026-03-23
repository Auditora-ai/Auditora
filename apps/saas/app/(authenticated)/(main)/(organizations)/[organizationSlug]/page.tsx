import { getActiveOrganization } from "@auth/lib/server";
import { ClientDashboard } from "@dashboard/components/ClientDashboard";
import type { ActivityItem } from "@dashboard/components/ActivityTimeline";
import { PageHeader } from "@shared/components/PageHeader";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	return { title: activeOrganization?.name };
}

function generateInsight(
	processCount: number,
	stats: { core: number; strategic: number; support: number },
	t: (key: string, values?: Record<string, string | number>) => string,
): string {
	if (processCount === 0) {
		return t("insight.empty");
	}
	if (stats.support === 0 && processCount > 0) {
		return t("insight.noSupport", { count: processCount });
	}
	if (stats.core < 3) {
		return t("insight.fewCore", { count: stats.core });
	}
	if (stats.strategic === 0) {
		return t("insight.noStrategic", { count: processCount });
	}
	return t("insight.continue", { count: processCount });
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("dashboard");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	// Fetch all metrics in parallel
	const [
		sessionsThisMonth,
		processesMapped,
		confirmedNodes,
		rejectedNodes,
		totalSessions,
		sessionsWithTranscripts,
		latestProcess,
		recentProcesses,
		coreCount,
		strategicCount,
		supportCount,
		org,
	] = await Promise.all([
		db.meetingSession.count({
			where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
		}),
		db.processDefinition.count({
			where: { architecture: { organizationId: orgId } },
		}),
		db.diagramNode.count({
			where: { state: "CONFIRMED", session: { organizationId: orgId } },
		}),
		db.diagramNode.count({
			where: { state: "REJECTED", session: { organizationId: orgId } },
		}),
		db.meetingSession.count({
			where: { organizationId: orgId },
		}),
		// New: count sessions with transcripts (for AI stat)
		db.meetingSession.count({
			where: {
				organizationId: orgId,
				transcriptEntries: { some: {} },
			},
		}),
		// New: latest process with BPMN XML for hero
		db.processDefinition.findFirst({
			where: {
				architecture: { organizationId: orgId },
				bpmnXml: { not: null },
			},
			orderBy: { createdAt: "desc" },
			select: { id: true, name: true, bpmnXml: true },
		}),
		// Recent processes
		db.processDefinition.findMany({
			where: { architecture: { organizationId: orgId } },
			select: { id: true, name: true, level: true, category: true, processStatus: true, createdAt: true },
			orderBy: { createdAt: "desc" },
			take: 5,
		}),
		// Process stats by category
		db.processDefinition.count({
			where: { architecture: { organizationId: orgId }, category: "core" },
		}),
		db.processDefinition.count({
			where: { architecture: { organizationId: orgId }, category: "strategic" },
		}),
		db.processDefinition.count({
			where: { architecture: { organizationId: orgId }, category: "support" },
		}),
		// Org profile
		db.organization.findUnique({
			where: { id: orgId },
			select: { industry: true, employeeCount: true },
		}),
	]);

	const totalDecisions = confirmedNodes + rejectedNodes;
	const aiAccuracy =
		totalDecisions > 0
			? Math.round((confirmedNodes / totalDecisions) * 100)
			: 0;

	// Fetch recent sessions for activity timeline
	const recentSessions = await db.meetingSession.findMany({
		where: { organizationId: orgId },
		include: { processDefinition: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	// Build activity timeline
	const activities: ActivityItem[] = [
		...recentSessions.map((s) => ({
			id: `session-${s.id}`,
			type: (s.status === "ENDED" ? "session_ended" : "session_created") as ActivityItem["type"],
			title: s.status === "ENDED" ? t("activity.sessionEnded") : t("activity.sessionCreated"),
			subtitle: `${s.type}${s.processDefinition ? ` — ${s.processDefinition.name}` : ""}`,
			timestamp: s.createdAt,
		})),
		...recentProcesses.map((p) => ({
			id: `process-${p.id}`,
			type: "process_created" as const,
			title: t("activity.processCreated"),
			subtitle: p.name,
			timestamp: p.createdAt,
		})),
	]
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
		.slice(0, 15);

	const processStats = { core: coreCount, strategic: strategicCount, support: supportCount };
	const insight = generateInsight(recentProcesses.length, processStats, t);

	return (
		<div>
			<PageHeader
				title={activeOrganization.name}
				subtitle={t("subtitle")}
			/>

			<div className="mt-6">
				<ClientDashboard
					data={{
						sessionsThisMonth,
						processesMapped,
						aiAccuracy,
						processesGoal: 10,
						activities,
						totalSessions,
						recentProcesses: recentProcesses.map((p) => ({
							id: p.id,
							name: p.name,
							level: p.level,
							category: p.category,
							status: p.processStatus,
						})),
						processStats,
						orgProfile: {
							industry: org?.industry ?? null,
							employeeCount: org?.employeeCount ?? null,
						},
						latestProcess: latestProcess
							? { id: latestProcess.id, name: latestProcess.name, bpmnXml: latestProcess.bpmnXml }
							: null,
						aiExtractedNodes: confirmedNodes,
						sessionsWithTranscripts,
						insight,
					}}
					basePath={`/${organizationSlug}`}
				/>
			</div>
		</div>
	);
}
