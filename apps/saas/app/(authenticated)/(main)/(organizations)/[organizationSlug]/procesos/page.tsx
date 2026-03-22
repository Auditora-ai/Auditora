import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProcessLibrary } from "@process-library/components/ProcessLibrary";
import type { ProcessCardData } from "@process-library/components/ProcessCard";

export async function generateMetadata() {
	return { title: "Process Library" };
}

export default async function ProcessLibraryPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("processLibrary");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;

	const processDefinitions = await db.processDefinition.findMany({
		where: {
			architecture: {
				project: { client: { organizationId: orgId } },
			},
		},
		include: {
			architecture: {
				include: {
					project: { select: { name: true, id: true } },
				},
			},
			_count: {
				select: { sessions: true, versions: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const processes: ProcessCardData[] = processDefinitions.map((pd) => ({
		id: pd.id,
		name: pd.name,
		description: pd.description,
		level: pd.level,
		processStatus: pd.processStatus,
		projectName: pd.architecture.project.name,
		projectId: pd.architecture.project.id,
		nodesCount: 0,
		versionsCount: pd._count.versions,
		sessionsCount: pd._count.sessions,
		hasBpmn: !!pd.bpmnXml,
	}));

	const projectsSet = new Map<string, string>();
	for (const pd of processDefinitions) {
		projectsSet.set(
			pd.architecture.project.id,
			pd.architecture.project.name,
		);
	}
	const projects = Array.from(projectsSet, ([id, name]) => ({ id, name }));

	return (
		<div>
			<PageHeader title={t("title")} subtitle={t("subtitle")} />
			<div className="mt-6">
				<ProcessLibrary
					processes={processes}
					projects={projects}
					basePath={`/${organizationSlug}`}
				/>
			</div>
		</div>
	);
}
