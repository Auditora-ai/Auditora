import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { SessionDiagram } from "@meeting/components/SessionDiagram";

export async function generateMetadata() {
	return { title: "Shared Process Diagram — Prozea" };
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
			project: { include: { client: true } },
			diagramNodes: { where: { state: { not: "REJECTED" } } },
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

	return (
		<div className="min-h-screen bg-background">
			{/* Minimal header */}
			<div className="border-b border-border bg-card px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-foreground">
							{session.project.client.name}
						</h1>
						<p className="text-sm text-muted-foreground">
							{session.project.name} — Process Diagram
						</p>
					</div>
					<span className="text-xs text-muted-foreground">
						Powered by Prozea
					</span>
				</div>
			</div>

			{/* Diagram - full width */}
			<div className="h-[calc(100vh-73px)]">
				<SessionDiagram nodes={nodes} />
			</div>
		</div>
	);
}
