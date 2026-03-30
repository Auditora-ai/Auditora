"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { DashboardWelcome } from "@onboarding/components/DashboardWelcome";
import { HeroBpmnViewer } from "./HeroBpmnViewer";
import { SmartCTA } from "./SmartCTA";
import { QuickActions } from "./QuickActions";
import { ArchitectureDonut } from "./ArchitectureDonut";
import { AiInsightCard } from "./AiInsightCard";
import {
	ActivityTimeline,
	type ActivityItem,
} from "./ActivityTimeline";

export type RecentProcess = {
	id: string;
	name: string;
	level: string;
	category: string | null;
	status: string;
};

export type ClientDashboardData = {
	sessionsThisMonth: number;
	processesMapped: number;
	aiAccuracy: number;
	processesGoal: number;
	activities: ActivityItem[];
	totalSessions: number;
	recentProcesses: RecentProcess[];
	processStats: {
		core: number;
		strategic: number;
		support: number;
	};
	orgProfile: {
		industry: string | null;
		employeeCount: string | null;
	};
	// New fields for hero dashboard
	latestProcess: {
		id: string;
		name: string;
		bpmnXml: string | null;
	} | null;
	aiExtractedNodes: number;
	sessionsWithTranscripts: number;
	insight: string;
};

export function ClientDashboard({
	data,
	basePath,
}: {
	data: ClientDashboardData;
	basePath: string;
}) {
	const t = useTranslations("dashboard");
	const [welcomeDismissed, setWelcomeDismissed] = useState(() =>
		typeof window !== "undefined" &&
		localStorage.getItem("onboarding-welcome-dismissed") === "true",
	);

	if (data.totalSessions === 0 && data.processesMapped === 0 && !welcomeDismissed) {
		return (
			<DashboardWelcome
				basePath={basePath}
				onDismiss={() => {
					localStorage.setItem("onboarding-welcome-dismissed", "true");
					setWelcomeDismissed(true);
				}}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header: Title + Differentiator Stat + Smart CTA */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-serif font-semibold tracking-tight">
						{t("hero.title")}
					</h1>
					{data.aiExtractedNodes > 0 && (
						<p className="text-sm text-muted-foreground mt-1">
							{t("hero.aiStat", {
								nodes: data.aiExtractedNodes,
								sessions: data.sessionsWithTranscripts,
							})}
						</p>
					)}
				</div>
				<SmartCTA
					basePath={basePath}
					totalProcesses={data.processesMapped}
					latestProcessName={data.latestProcess?.name ?? null}
					latestProcessId={data.latestProcess?.id ?? null}
				/>
			</div>

			{/* Hero: BPMN Diagram Viewer */}
			<HeroBpmnViewer
				bpmnXml={data.latestProcess?.bpmnXml ?? null}
				processName={data.latestProcess?.name ?? null}
				processId={data.latestProcess?.id ?? null}
				basePath={basePath}
			/>

			{/* Quick Actions: Chat / Audio / Call */}
			<QuickActions basePath={basePath} />

			{/* Bottom Row: Architecture Donut + AI Insight */}
			<div className="grid gap-4 md:grid-cols-2">
				<ArchitectureDonut
					core={data.processStats.core}
					strategic={data.processStats.strategic}
					support={data.processStats.support}
				/>
				<AiInsightCard insight={data.insight} />
			</div>

			{/* Recent Processes + Activity Timeline */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Recent processes */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">
								{t("recentProcesses")}
							</CardTitle>
							{data.recentProcesses.length > 0 && (
								<Link
									href={`${basePath}/processes`}
									className="text-xs text-primary hover:underline"
								>
									{t("viewAll")}
								</Link>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{data.recentProcesses.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-6">
								{t("noProcesses")}
							</p>
						) : (
							<div className="space-y-2">
								{data.recentProcesses.map((p) => (
									<Link
										key={p.id}
										href={`${basePath}/processes/${p.id}`}
										className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent/50"
									>
										<span className="font-medium text-sm truncate">{p.name}</span>
										<div className="flex items-center gap-1.5 shrink-0">
											{p.category && (
												<Badge className="text-xs">
													{p.category}
												</Badge>
											)}
											<Badge className="text-xs">{p.status}</Badge>
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Activity Timeline */}
				<ActivityTimeline activities={data.activities} />
			</div>
		</div>
	);
}
