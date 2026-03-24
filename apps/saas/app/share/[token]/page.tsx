import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { SessionDiagram } from "@meeting/components/SessionDiagram";
import { SparklesIcon, ListChecksIcon } from "lucide-react";

export async function generateMetadata() {
	return { title: "Shared Process Diagram — aiprocess.me" };
}

export default async function SharedDiagramPage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;

	const session = await db.meetingSession.findUnique({
		where: { shareToken: token },
		include: {
			organization: { select: { name: true } },
			processDefinition: { select: { name: true } },
			diagramNodes: { where: { state: { not: "REJECTED" } } },
			sessionSummary: true,
		},
	});

	if (!session) return notFound();

	const nodes = session.diagramNodes.map((n) => ({
		id: n.id,
		type: n.nodeType.toLowerCase(),
		label: n.label,
		state: n.state.toLowerCase() as any,
		lane: n.lane || undefined,
		connections: n.connections,
	}));

	const duration =
		session.startedAt && session.endedAt
			? Math.round(
					(session.endedAt.getTime() - session.startedAt.getTime()) /
						60000,
				)
			: null;

	return (
		<div className="flex min-h-screen flex-col bg-background">
			{/* Header with metadata */}
			<div className="border-b border-border bg-card px-6 py-4">
				<div className="mx-auto max-w-6xl">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-lg font-semibold text-foreground">
								{session.organization.name}
							</h1>
							<p className="text-sm text-muted-foreground">
								{session.processDefinition?.name || session.type} — Process Diagram
							</p>
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{duration && <span>{duration} min session</span>}
							<span>{nodes.length} process steps</span>
							<span>
								{new Date(
									session.createdAt,
								).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Summary (if available) */}
			{session.sessionSummary && (
				<div className="border-b border-border bg-card/50 px-6 py-4">
					<div className="mx-auto max-w-6xl">
						<div className="mb-2 flex items-center gap-2">
							<SparklesIcon className="h-3.5 w-3.5 text-primary" />
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Session Summary
							</span>
						</div>
						<p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
							{session.sessionSummary.summary}
						</p>
						{session.sessionSummary.actionItems.length > 0 && (
							<div className="mt-3">
								<div className="mb-1.5 flex items-center gap-1.5">
									<ListChecksIcon className="h-3 w-3 text-muted-foreground" />
									<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
										Next Steps
									</span>
								</div>
								<ul className="space-y-1">
									{session.sessionSummary.actionItems.map(
										(item, i) => (
											<li
												key={i}
												className="flex items-start gap-2 text-sm text-foreground"
											>
												<span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
												{item}
											</li>
										),
									)}
								</ul>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Diagram - full width */}
			<div className="flex-1">
				<div className="h-[calc(100vh-200px)] min-h-[400px]">
					<SessionDiagram nodes={nodes} bpmnXml={session.bpmnXml} />
				</div>
			</div>

			{/* Footer CTA */}
			<div className="border-t border-border bg-card px-6 py-4">
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<span className="text-xs text-muted-foreground">
						Powered by aiprocess.me
					</span>
					<a
						href="https://aiprocess.me"
						target="_blank"
						rel="noreferrer"
						className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Start your free trial
					</a>
				</div>
			</div>
		</div>
	);
}
