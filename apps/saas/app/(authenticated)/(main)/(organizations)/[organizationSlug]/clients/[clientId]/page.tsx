import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ClientWorkspace } from "@clients/components/ClientWorkspace";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ clientId: string }>;
}) {
	const { clientId } = await params;
	const client = await db.client.findUnique({
		where: { id: clientId },
		select: { name: true },
	});
	return { title: client?.name ?? "Client" };
}

export default async function ClientPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
	const { organizationSlug, clientId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const client = await db.client.findUnique({
		where: { id: clientId, organizationId: activeOrganization.id },
		include: {
			projects: {
				include: {
					_count: { select: { sessions: true } },
				},
				orderBy: { createdAt: "desc" },
			},
			documents: {
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!client) {
		return notFound();
	}

	// Get all sessions across all projects for this client
	const sessions = await db.meetingSession.findMany({
		where: {
			project: { clientId: client.id },
		},
		include: {
			project: true,
			processDefinition: true,
		},
		orderBy: { createdAt: "desc" },
	});

	return (
		<ClientWorkspace
			client={client}
			sessions={sessions}
			organizationSlug={organizationSlug}
		/>
	);
}
