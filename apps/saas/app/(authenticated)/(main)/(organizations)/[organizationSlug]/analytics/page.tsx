import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { StatsTile } from "@shared/components/StatsTile";
import { Card } from "@repo/ui/components/card";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	return { title: "Analytics" };
}

export default async function AnalyticsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("sessions");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	// Aggregate stats
	const totalSessions = await db.meetingSession.count();
	const completedSessions = await db.meetingSession.count({
		where: { status: "ENDED" },
	});
	const totalNodes = await db.diagramNode.count();
	const confirmedNodes = await db.diagramNode.count({
		where: { state: "CONFIRMED" },
	});
	const rejectedNodes = await db.diagramNode.count({
		where: { state: "REJECTED" },
	});
	const totalClients = await db.client.count();

	const accuracyRate =
		totalNodes > 0
			? Math.round((confirmedNodes / (confirmedNodes + rejectedNodes || 1)) * 100)
			: 0;

	return (
		<div>
			<PageHeader
				title="Analytics"
				subtitle="Your process elicitation metrics"
			/>

			<div className="@container mt-6">
				<div className="grid @2xl:grid-cols-3 gap-4">
					<StatsTile
						title="Total Sessions"
						value={totalSessions}
						valueFormat="number"
						trend={0}
					/>
					<StatsTile
						title="Completed"
						value={completedSessions}
						valueFormat="number"
						trend={0}
					/>
					<StatsTile
						title="Clients"
						value={totalClients}
						valueFormat="number"
						trend={0}
					/>
				</div>

				<div className="mt-4 grid @2xl:grid-cols-3 gap-4">
					<StatsTile
						title="Total Nodes Mapped"
						value={totalNodes}
						valueFormat="number"
						trend={0}
					/>
					<StatsTile
						title="AI Accuracy"
						value={accuracyRate / 100}
						valueFormat="percentage"
						trend={0}
					/>
					<StatsTile
						title="Nodes Confirmed"
						value={confirmedNodes}
						valueFormat="number"
						trend={0}
					/>
				</div>
			</div>

			<Card className="mt-6">
				<div className="flex h-48 items-center justify-center p-8 text-muted-foreground">
					Session timeline and trends will appear here as you complete more sessions.
				</div>
			</Card>
		</div>
	);
}
