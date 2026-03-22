import { getActiveOrganization } from "@auth/lib/server";
import { ClientDashboard } from "@dashboard/components/ClientDashboard";
import type { ActivityItem } from "@dashboard/components/ActivityTimeline";
import type { ProjectCardData } from "@dashboard/components/ProjectsGrid";
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

	// Fetch metrics
	const [sessionsThisMonth, processesMapped, confirmedNodes, rejectedNodes] =
		await Promise.all([
			db.meetingSession.count({
				where: {
					project: { client: { organizationId: orgId } },
					createdAt: { gte: startOfMonth },
				},
			}),
			db.processDefinition.count({
				where: {
					architecture: {
						project: { client: { organizationId: orgId } },
					},
				},
			}),
			db.diagramNode.count({
				where: {
					state: "CONFIRMED",
					session: {
						project: { client: { organizationId: orgId } },
					},
				},
			}),
			db.diagramNode.count({
				where: {
					state: "REJECTED",
					session: {
						project: { client: { organizationId: orgId } },
					},
				},
			}),
		]);

	const totalDecisions = confirmedNodes + rejectedNodes;
	const aiAccuracy =
		totalDecisions > 0
			? Math.round((confirmedNodes / totalDecisions) * 100)
			: 0;

	// Fetch recent sessions for activity timeline
	const recentSessions = await db.meetingSession.findMany({
		where: { project: { client: { organizationId: orgId } } },
		include: {
			project: { select: { name: true } },
			processDefinition: { select: { name: true } },
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	// Fetch recent processes
	const recentProcesses = await db.processDefinition.findMany({
		where: {
			architecture: {
				project: { client: { organizationId: orgId } },
			},
		},
		select: { id: true, name: true, createdAt: true },
		orderBy: { createdAt: "desc" },
		take: 5,
	});

	// Build activity timeline
	const activities: ActivityItem[] = [
		...recentSessions.map((s) => ({
			id: `session-${s.id}`,
			type: (s.status === "ENDED"
				? "session_ended"
				: "session_created") as ActivityItem["type"],
			title:
				s.status === "ENDED"
					? t("activity.sessionEnded")
					: t("activity.sessionCreated"),
			subtitle: `${s.project.name}${s.processDefinition ? ` — ${s.processDefinition.name}` : ""}`,
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
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() -
				new Date(a.timestamp).getTime(),
		)
		.slice(0, 15);

	// Fetch projects
	const projectsRaw = await db.project.findMany({
		where: { client: { organizationId: orgId } },
		include: {
			_count: { select: { sessions: true } },
			architecture: {
				include: {
					_count: { select: { definitions: true } },
				},
			},
		},
	});

	const projects: ProjectCardData[] = projectsRaw.map((p) => ({
		id: p.id,
		name: p.name,
		status: p.status,
		sessionsCount: p._count.sessions,
		processesCount: p.architecture?._count.definitions ?? 0,
	}));

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
						projects,
					}}
					basePath={`/${organizationSlug}`}
				/>
			</div>
		</div>
	);
}
