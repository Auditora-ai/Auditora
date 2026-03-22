import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
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
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		include: {
			architecture: {
				include: {
					project: {
						include: { client: true },
					},
				},
			},
		},
	});

	if (!process) return notFound();

	// Verify the process belongs to this organization
	if (process.architecture.project.client.organizationId !== activeOrganization.id) {
		return notFound();
	}

	// Redirect to the full nested route where ProcessDetail component lives
	const clientId = process.architecture.project.clientId;
	const projectId = process.architecture.projectId;

	redirect(
		`/${organizationSlug}/clients/${clientId}/projects/${projectId}/processes/${processId}`,
	);
}
