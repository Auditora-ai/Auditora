import { db } from "@repo/database";
import { MeetingView } from "@meeting/components/MeetingView";
import { notFound } from "next/navigation";

export const metadata = {
	title: "Live Session — Prozea",
};

export default async function LiveSessionPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { sessionId } = await params;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			project: { include: { client: true } },
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
			clientName={session.project.client.name}
			botId={session.recallBotId || undefined}
			shareToken={session.shareToken || undefined}
			startedAt={session.startedAt?.toISOString()}
		/>
	);
}
