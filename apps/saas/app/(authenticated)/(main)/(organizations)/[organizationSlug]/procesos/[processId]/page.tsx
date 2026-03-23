import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { ProcessDetailView } from "@process-library/components/ProcessDetailView";

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
			_count: {
				select: { sessions: true, versions: true, raciEntries: true, conflicts: true },
			},
		},
	});

	if (!process) return notFound();
	if (process.organizationId !== activeOrganization.id) return notFound();

	const sessionCount = process._count.sessions;

	return (
		<ProcessDetailView
			process={{
				id: process.id,
				name: process.name,
				description: process.description,
				level: process.level,
				processStatus: process.processStatus,
				category: process.category,
				owner: process.owner,
				goals: process.goals,
				triggers: process.triggers,
				outputs: process.outputs,
				bpmnXml: process.bpmnXml,
				sessionsCount: sessionCount,
				versionsCount: process._count.versions,
				raciCount: process._count.raciEntries,
				conflictsCount: process._count.conflicts,
			}}
			basePath={`/${organizationSlug}`}
		/>
	);
}
