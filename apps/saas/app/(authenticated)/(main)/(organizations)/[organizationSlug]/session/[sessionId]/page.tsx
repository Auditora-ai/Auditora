import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { db } from "@repo/database";
import { DownloadIcon, ShareIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionReviewClient } from "@meeting/components/SessionReviewClient";

export async function generateMetadata() {
	return { title: "Session Review" };
}

const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "In Progress",
	ENDED: "Completed",
	SCHEDULED: "Scheduled",
	CANCELLED: "Cancelled",
};

export default async function SessionReviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { organizationSlug, sessionId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			organization: { select: { name: true } },
			processDefinition: true,
			diagramNodes: true,
			transcriptEntries: { orderBy: { timestamp: "asc" } },
		},
	});

	if (!session) return notFound();

	const duration =
		session.startedAt && session.endedAt
			? Math.round(
					(session.endedAt.getTime() - session.startedAt.getTime()) /
						60000,
				)
			: null;

	const allNodes = session.diagramNodes;
	const visibleNodes = allNodes.filter((n) => n.state !== "REJECTED");
	const confirmedCount = allNodes.filter(
		(n) => n.state === "CONFIRMED",
	).length;
	const rejectedCount = allNodes.filter(
		(n) => n.state === "REJECTED",
	).length;

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="sm" asChild>
					<Link href={`/${organizationSlug}/sessions`}>
						<ArrowLeftIcon className="mr-1 h-4 w-4" />
						Sessions
					</Link>
				</Button>
			</div>

			<div className="flex items-start justify-between">
				<PageHeader
					title={session.organization.name}
					subtitle={`${session.type === "DISCOVERY" ? "Discovery" : "Deep Dive"}${session.processDefinition ? ` — ${session.processDefinition.name}` : ""}`}
				/>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<a
							href={`/api/sessions/${sessionId}/export?format=xml`}
							download
						>
							<DownloadIcon className="mr-1 h-3.5 w-3.5" />
							BPMN XML
						</a>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<a
							href={`/share/${session.shareToken}`}
							target="_blank"
							rel="noreferrer"
						>
							<ShareIcon className="mr-1 h-3.5 w-3.5" />
							Share
						</a>
					</Button>
				</div>
			</div>

			<div className="mt-2 flex items-center gap-3">
				<Badge
					status={session.status === "ENDED" ? "success" : "info"}
				>
					{STATUS_LABELS[session.status] || session.status}
				</Badge>
				{duration && (
					<span className="text-sm text-muted-foreground">
						{duration} min
					</span>
				)}
				<span className="text-sm text-muted-foreground">
					{allNodes.length} nodes
				</span>
				<span className="text-sm text-muted-foreground">
					{new Date(session.createdAt).toLocaleDateString()}
				</span>
			</div>

			{/* Client-side interactive components */}
			<SessionReviewClient
				sessionId={sessionId}
				nodes={visibleNodes.map((n) => ({
					id: n.id,
					type: n.nodeType.toLowerCase(),
					label: n.label,
					state: n.state.toLowerCase() as any,
					lane: n.lane || undefined,
					connections: n.connections,
					formedAt: n.formedAt.toISOString(),
				}))}
				transcriptEntries={session.transcriptEntries.map((e) => ({
					id: e.id,
					speaker: e.speaker,
					text: e.text,
					timestamp: e.timestamp,
				}))}
				bpmnXml={session.bpmnXml}
				totalNodeCount={allNodes.length}
				confirmedCount={confirmedCount}
				rejectedCount={rejectedCount}
			/>
		</div>
	);
}
