"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@repo/ui/components/progress";
import { useEffect, useState } from "react";
import { SettingsItem } from "@shared/components/SettingsItem";
import {
	ClipboardCheckIcon,
	CpuIcon,
	MessageSquareIcon,
	FileTextIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";

interface UsageMetric {
	used: number;
	limit: number | null;
}

interface UsageData {
	evaluations: UsageMetric;
	evaluators: UsageMetric;
	processes: UsageMetric;
	sessions: UsageMetric;
	reports: UsageMetric;
	billingCycleAnchor: string | null;
}

interface MetricRowProps {
	icon: React.ReactNode;
	label: string;
	used: number;
	limit: number | null;
	t: ReturnType<typeof useTranslations>;
}

function MetricRow({ icon, label, used, limit, t }: MetricRowProps) {
	if (limit === null) {
		return (
			<div className="flex items-center justify-between py-1.5">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					{icon}
					<span>{label}</span>
				</div>
				<span className="flex items-center gap-1 text-xs text-muted-foreground">
					<ZapIcon className="size-3" />
					{t("usage.unlimited")}
				</span>
			</div>
		);
	}

	const usagePercent =
		limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	const isWarning = usagePercent >= 80;
	const isExhausted = usagePercent >= 100;
	const remaining = Math.max(0, limit - used);

	return (
		<div className="space-y-1.5 py-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{icon}
					<span className="text-sm font-medium">{label}</span>
				</div>
				<span className="text-sm tabular-nums">
					{t("usage.used", { used, limit })}
				</span>
			</div>
			<Progress
				value={usagePercent}
				className={
					isExhausted
						? "[&>div]:bg-destructive"
						: isWarning
							? "[&>div]:bg-amber-500"
							: ""
				}
			/>
			<p className="text-xs text-muted-foreground">
				{isExhausted
					? t("usage.exhausted")
					: t("usage.remaining", { count: remaining })}
			</p>
		</div>
	);
}

interface MetricCategoryProps {
	title: string;
	children: React.ReactNode;
}

function MetricCategory({ title, children }: MetricCategoryProps) {
	return (
		<div className="rounded-lg border p-4 space-y-3">
			<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{title}
			</h4>
			<div className="space-y-1">{children}</div>
		</div>
	);
}

export function UsageDashboard({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [usage, setUsage] = useState<UsageData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchUsage() {
			try {
				const res = await fetch(`/api/organizations/${organizationId}/usage`);
				if (res.ok) {
					setUsage(await res.json());
				}
			} catch {
				// Silently fail — usage will show as loading
			} finally {
				setLoading(false);
			}
		}
		fetchUsage();
	}, [organizationId]);

	if (loading || !usage) {
		return null;
	}

	// Compute billing cycle reset date
	const resetDate = (() => {
		if (!usage.billingCycleAnchor) return null;
		const anchor = new Date(usage.billingCycleAnchor);
		const now = new Date();
		const anchorDay = anchor.getDate();

		// Next reset is the next occurrence of the anchor day
		const nextReset = new Date(now.getFullYear(), now.getMonth(), anchorDay);
		if (nextReset <= now) {
			nextReset.setMonth(nextReset.getMonth() + 1);
		}

		return nextReset.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	})();

	return (
		<SettingsItem
			title={t("usage.title")}
			description={
				resetDate
					? t("usage.resets", { date: resetDate })
					: undefined
			}
		>
			<div className="space-y-4">
				{/* Evaluations Category */}
				<MetricCategory title={t("usage.categoryEvaluations")}>
					<MetricRow
						icon={
							<ClipboardCheckIcon className="size-4 text-muted-foreground" />
						}
						label={t("usage.evaluations")}
						used={usage.evaluations.used}
						limit={usage.evaluations.limit}
						t={t}
					/>
					<MetricRow
						icon={<UsersIcon className="size-4 text-muted-foreground" />}
						label={t("usage.evaluators")}
						used={usage.evaluators.used}
						limit={usage.evaluators.limit}
						t={t}
					/>
				</MetricCategory>

				{/* Processes Category */}
				<MetricCategory title={t("usage.categoryProcesses")}>
					<MetricRow
						icon={<CpuIcon className="size-4 text-muted-foreground" />}
						label={t("usage.processes")}
						used={usage.processes.used}
						limit={usage.processes.limit}
						t={t}
					/>
				</MetricCategory>

				{/* Tools Category */}
				<MetricCategory title={t("usage.categoryTools")}>
					<MetricRow
						icon={
							<MessageSquareIcon className="size-4 text-muted-foreground" />
						}
						label={t("usage.sessions")}
						used={usage.sessions.used}
						limit={usage.sessions.limit}
						t={t}
					/>
					<MetricRow
						icon={
							<FileTextIcon className="size-4 text-muted-foreground" />
						}
						label={t("usage.reports")}
						used={usage.reports.used}
						limit={usage.reports.limit}
						t={t}
					/>
				</MetricCategory>
			</div>
		</SettingsItem>
	);
}
