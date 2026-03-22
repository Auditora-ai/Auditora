"use client";

import { Button } from "@repo/ui/components/button";
import { StatsTile } from "@shared/components/StatsTile";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
	ActivityTimeline,
	type ActivityItem,
} from "./ActivityTimeline";
import { EngagementProgress } from "./EngagementProgress";
import {
	ProjectsGrid,
	type ProjectCardData,
} from "./ProjectsGrid";

export type ClientDashboardData = {
	sessionsThisMonth: number;
	processesMapped: number;
	aiAccuracy: number;
	processesGoal: number;
	activities: ActivityItem[];
	projects: ProjectCardData[];
};

export function ClientDashboard({
	data,
	basePath,
}: {
	data: ClientDashboardData;
	basePath: string;
}) {
	const t = useTranslations("dashboard");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div />
				<Button asChild>
					<Link href={`${basePath}/sessions/new`}>
						<PlusIcon className="mr-2 size-4" />
						{t("newSession")}
					</Link>
				</Button>
			</div>

			<div className="@container">
				<div className="grid gap-4 @2xl:grid-cols-3">
					<StatsTile
						title={t("sessionsThisMonth")}
						value={data.sessionsThisMonth}
						valueFormat="number"
					/>
					<StatsTile
						title={t("processesMapped")}
						value={data.processesMapped}
						valueFormat="number"
					/>
					<StatsTile
						title={t("aiAccuracy")}
						value={data.aiAccuracy / 100}
						valueFormat="percentage"
					/>
				</div>
			</div>

			<EngagementProgress
				mapped={data.processesMapped}
				goal={data.processesGoal}
			/>

			<ActivityTimeline activities={data.activities} />

			<ProjectsGrid projects={data.projects} basePath={basePath} />
		</div>
	);
}
