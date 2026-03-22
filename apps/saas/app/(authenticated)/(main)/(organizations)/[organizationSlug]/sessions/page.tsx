import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { db } from "@repo/database";
import {
	WorkflowIcon,
	PlusIcon,
	PlayIcon,
	EyeIcon,
	ClockIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	return { title: "Sessions" };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	ACTIVE: "default",
	CONNECTING: "secondary",
	ENDED: "outline",
	FAILED: "destructive",
	SCHEDULED: "secondary",
};

export default async function SessionsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("sessions");

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const sessions = await db.meetingSession.findMany({
		include: {
			project: { include: { client: true } },
			processDefinition: true,
			_count: {
				select: { diagramNodes: true, transcriptEntries: true },
			},
		},
		orderBy: { createdAt: "desc" },
		take: 50,
	});

	return (
		<div>
			<div className="flex items-center justify-between">
				<PageHeader title={t("title")} subtitle={t("subtitle")} />
				<Button asChild>
					<Link href={`/${organizationSlug}/sessions/new`}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("newSession")}
					</Link>
				</Button>
			</div>

			<div className="mt-6">
				{sessions.length === 0 ? (
					<Card>
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<WorkflowIcon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground">
								{t("empty.title")}
							</h3>
							<p className="mt-2 max-w-sm text-sm text-muted-foreground">
								{t("empty.description")}
							</p>
							<Button asChild className="mt-6">
								<Link
									href={`/${organizationSlug}/sessions/new`}
								>
									<PlusIcon className="mr-2 h-4 w-4" />
									{t("newSession")}
								</Link>
							</Button>
						</div>
					</Card>
				) : (
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Client</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Nodes</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sessions.map((session) => (
									<TableRow key={session.id}>
										<TableCell>
											<div>
												<p className="font-medium text-foreground">
													{session.project.client
														.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{session.project.name}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{session.type === "DISCOVERY"
													? "Discovery"
													: "Deep Dive"}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="tabular-nums">
												{session._count.diagramNodes}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													STATUS_VARIANT[
														session.status
													] || "secondary"
												}
											>
												{session.status}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground">
											<div className="flex items-center gap-1">
												<ClockIcon className="h-3 w-3" />
												{new Date(
													session.createdAt,
												).toLocaleDateString()}
											</div>
										</TableCell>
										<TableCell className="text-right">
											{session.status === "ACTIVE" ||
											session.status === "CONNECTING" ? (
												<Button
													size="sm"
													variant="default"
													asChild
												>
													<Link
														href={`/${organizationSlug}/session/${session.id}/live`}
													>
														<PlayIcon className="mr-1 h-3 w-3" />
														Join
													</Link>
												</Button>
											) : (
												<Button
													size="sm"
													variant="outline"
													asChild
												>
													<Link
														href={`/${organizationSlug}/session/${session.id}`}
													>
														<EyeIcon className="mr-1 h-3 w-3" />
														View
													</Link>
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				)}
			</div>
		</div>
	);
}
