"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
	CalendarIcon,
	CheckCircle2Icon,
	FileTextIcon,
	CircleStopIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";

export type ActivityItem = {
	id: string;
	type: "session_created" | "session_ended" | "process_created" | "nodes_confirmed";
	title: string;
	subtitle?: string;
	timestamp: Date;
	metadata?: {
		count?: number;
		status?: string;
	};
};

const activityIcons = {
	session_created: CalendarIcon,
	session_ended: CircleStopIcon,
	process_created: FileTextIcon,
	nodes_confirmed: CheckCircle2Icon,
};

const activityColors = {
	session_created: "text-blue-500",
	session_ended: "text-green-500",
	process_created: "text-purple-500",
	nodes_confirmed: "text-emerald-500",
};

export function ActivityTimeline({
	activities,
}: {
	activities: ActivityItem[];
}) {
	const t = useTranslations("dashboard");

	if (activities.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("recentActivity")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">{t("noActivity")}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("recentActivity")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{activities.map((activity) => {
						const Icon = activityIcons[activity.type];
						const colorClass = activityColors[activity.type];
						return (
							<div
								key={activity.id}
								className="flex items-start gap-3"
							>
								<div
									className={`mt-0.5 shrink-0 ${colorClass}`}
								>
									<Icon className="size-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium leading-none">
										{activity.title}
									</p>
									{activity.subtitle && (
										<p className="mt-1 text-xs text-muted-foreground">
											{activity.subtitle}
										</p>
									)}
								</div>
								<span className="shrink-0 text-xs text-muted-foreground">
									{formatDistanceToNow(
										new Date(activity.timestamp),
										{ addSuffix: true },
									)}
								</span>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
