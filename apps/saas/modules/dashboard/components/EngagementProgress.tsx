"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { useTranslations } from "next-intl";

export function EngagementProgress({
	mapped,
	goal,
}: {
	mapped: number;
	goal: number;
}) {
	const t = useTranslations("dashboard");
	const percentage = goal > 0 ? Math.min(Math.round((mapped / goal) * 100), 100) : 0;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle>{t("engagementProgress")}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							{t("processesGoal", { mapped, goal })}
						</span>
						<span className="font-semibold">{percentage}%</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
							style={{ width: `${percentage}%` }}
						/>
					</div>
					{goal === 0 && (
						<p className="text-xs text-muted-foreground">
							{t("setGoal")}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
