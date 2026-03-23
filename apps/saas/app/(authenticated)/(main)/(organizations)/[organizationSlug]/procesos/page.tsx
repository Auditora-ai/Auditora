import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProcessLibrary } from "@process-library/components/ProcessLibrary";
import type { ProcessCardData } from "@process-library/components/ProcessCard";

export async function generateMetadata() {
	return { title: "Procesos" };
}

export default async function ProcessHubPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string }>;
	searchParams: Promise<{ projectId?: string }>;
}) {
	const { organizationSlug } = await params;
	const { projectId: selectedProjectId } = await searchParams;
	const t = await getTranslations("processLibrary");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const orgId = activeOrganization.id;

	// Get all projects for this org
	const allProjects = await db.project.findMany({
		where: { client: { organizationId: orgId } },
		include: { client: { select: { name: true } } },
		orderBy: { updatedAt: "desc" },
	});

	// Use first project as default if none selected
	const activeProjectId = selectedProjectId ?? allProjects[0]?.id;
	const activeProject = allProjects.find((p) => p.id === activeProjectId);

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
		category: pd.category,
		projectName: pd.architecture.project.name,
		projectId: pd.architecture.project.id,
		nodesCount: 0,
		versionsCount: pd._count.versions,
		sessionsCount: pd._count.sessions,
		hasBpmn: !!pd.bpmnXml,
	}));

	const projects = allProjects.map((p) => ({
		id: p.id,
		name: `${p.client.name} — ${p.name}`,
	}));

	return (
		<div>
			<PageHeader
				title={t("title")}
				subtitle={
					activeProject
						? `${activeProject.client.name} — ${activeProject.name}`
						: t("subtitle")
				}
			/>
			<div className="mt-6">
				<ProcessLibrary
					processes={processes}
					projects={projects}
					basePath={`/${organizationSlug}`}
					activeProjectId={activeProjectId}
					clientName={activeProject?.client.name}
				/>
			</div>
		</div>
	);
}
