import { db } from "@repo/database";
import { MeetingView } from "@meeting/components/MeetingView";
import { notFound } from "next/navigation";

export const metadata = {
	title: "Live Session — aiprocess.me",
};

export default async function LiveSessionPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { sessionId, organizationSlug } = await params;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			organization: { select: { name: true } },
		},
	});

	if (!session) {
		return notFound();
	}

	return (
		<MeetingView
			sessionId={session.id}
			sessionType={session.type as "DISCOVERY" | "DEEP_DIVE"}
			processName={session.processDefinition?.name}
			clientName={session.organization.name}
			botId={session.recallBotId || undefined}
			shareToken={session.shareToken || undefined}
			startedAt={session.startedAt?.toISOString()}
			processId={session.processDefinitionId || undefined}
			organizationId={session.organizationId}
			organizationSlug={organizationSlug}
			bpmnXml={session.bpmnXml || session.processDefinition?.bpmnXml || null}
		/>
	);
}
