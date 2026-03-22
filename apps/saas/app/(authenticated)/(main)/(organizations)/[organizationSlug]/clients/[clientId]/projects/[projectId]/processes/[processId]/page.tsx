import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProcessDetail } from "@projects/components/ProcessDetail";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ processId: string }>;
}) {
	const { processId } = await params;
	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		select: { name: true },
	});
	return { title: process?.name ?? "Process" };
}

export default async function ProcessDetailPage({
	params,
}: {
	params: Promise<{
		organizationSlug: string;
		clientId: string;
		projectId: string;
		processId: string;
	}>;
}) {
	const { organizationSlug, clientId, projectId, processId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		include: {
			parent: { select: { id: true, name: true, level: true } },
			children: {
				select: {
					id: true,
					name: true,
					level: true,
					processStatus: true,
					description: true,
				},
				orderBy: { priority: "asc" },
			},
			sessions: {
				select: {
					id: true,
					type: true,
					status: true,
					createdAt: true,
					endedAt: true,
					_count: { select: { diagramNodes: true } },
				},
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			versions: {
				select: {
					version: true,
					changeNote: true,
					createdBy: true,
					createdAt: true,
				},
				orderBy: { version: "desc" },
				take: 20,
			},
		},
	});

	if (!process) {
		return notFound();
	}

	const project = await db.project.findUnique({
		where: { id: projectId },
		select: { name: true, client: { select: { name: true } } },
	});

	return (
		<ProcessDetail
			process={JSON.parse(JSON.stringify(process))}
			projectName={project?.name || ""}
			clientName={project?.client.name || ""}
			organizationSlug={organizationSlug}
			clientId={clientId}
			projectId={projectId}
		/>
	);
}
