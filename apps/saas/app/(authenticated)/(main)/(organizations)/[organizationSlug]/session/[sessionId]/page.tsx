import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { db } from "@repo/database";
import { DownloadIcon, ShareIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionDiagram } from "@meeting/components/SessionDiagram";

export async function generateMetadata() {
	return { title: "Session Review" };
}

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
			project: { include: { client: true } },
			processDefinition: true,
			diagramNodes: { where: { state: { not: "REJECTED" } } },
			transcriptEntries: { orderBy: { timestamp: "asc" } },
			_count: { select: { diagramNodes: true } },
		},
	});

	if (!session) return notFound();

	const duration = session.startedAt && session.endedAt
		? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
		: null;

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
					title={session.project.client.name}
					subtitle={`${session.project.name} — ${session.type === "DISCOVERY" ? "Discovery" : "Deep Dive"}`}
				/>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<a href={`/api/sessions/${sessionId}/export?format=xml`} download>
							<DownloadIcon className="mr-1 h-3 w-3" />
							BPMN XML
						</a>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<a href={`/share/${session.shareToken}`} target="_blank" rel="noreferrer">
							<ShareIcon className="mr-1 h-3 w-3" />
							Share
						</a>
					</Button>
				</div>
			</div>

			<div className="mt-2 flex items-center gap-3">
				<Badge status={session.status === "ENDED" ? "success" : "info"}>
					{session.status}
				</Badge>
				{duration && (
					<span className="text-sm text-muted-foreground">{duration} min</span>
				)}
				<span className="text-sm text-muted-foreground">
					{session._count.diagramNodes} nodes
				</span>
				<span className="text-sm text-muted-foreground">
					{new Date(session.createdAt).toLocaleDateString()}
				</span>
			</div>

			{/* Diagram */}
			<Card className="mt-6">
				<div className="h-[500px]">
					<SessionDiagram
						nodes={session.diagramNodes.map((n) => ({
							id: n.id,
							type: n.nodeType.toLowerCase(),
							label: n.label,
							state: n.state.toLowerCase() as any,
							lane: n.lane || undefined,
							connections: n.connections,
						}))}
					/>
				</div>
			</Card>

			{/* Transcript */}
			<Card className="mt-6 p-6">
				<h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Transcript
				</h3>
				<div className="max-h-96 space-y-2 overflow-y-auto">
					{session.transcriptEntries.map((entry) => (
						<div key={entry.id} className="border-b border-border/30 pb-2">
							<div className="flex items-baseline justify-between">
								<span className="text-xs font-semibold text-primary">
									{entry.speaker}
								</span>
								<span className="text-[10px] text-muted-foreground">
									{Math.floor(entry.timestamp / 60)}:{Math.floor(entry.timestamp % 60).toString().padStart(2, "0")}
								</span>
							</div>
							<p className="mt-0.5 text-sm text-foreground">{entry.text}</p>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
