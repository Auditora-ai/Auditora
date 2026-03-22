import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProjectDashboard } from "@projects/components/ProjectDashboard";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const { projectId } = await params;
	const project = await db.project.findUnique({
		where: { id: projectId },
		select: { name: true },
	});
	return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({
	params,
}: {
	params: Promise<{
		organizationSlug: string;
		clientId: string;
		projectId: string;
	}>;
}) {
	const { organizationSlug, clientId, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const project = await db.project.findUnique({
		where: { id: projectId, clientId },
		include: {
			client: true,
			architecture: {
				include: {
					definitions: {
						orderBy: { priority: "asc" },
					},
					versions: {
						orderBy: { version: "desc" },
					},
				},
			},
			sessions: {
				include: {
					processDefinition: true,
				},
				orderBy: { createdAt: "desc" },
			},
			documents: {
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!project) {
		return notFound();
	}

	return (
		<ProjectDashboard
			project={project}
			organizationSlug={organizationSlug}
			clientId={clientId}
		/>
	);
}
