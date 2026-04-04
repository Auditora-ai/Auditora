"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { RiskMaturityRing } from "@shared/components/RiskMaturityRing";
import { EmptyState } from "@shared/components/EmptyState";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BarChart3Icon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	FileTextIcon,
	ShieldAlertIcon,
	TrendingUpIcon,
	UsersIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PanoramaData, PanoramaVulnerableProcess, PanoramaActionItem, PanoramaActivityItem, PanoramaScoreTrendPoint } from "../types";

export function PanoramaMobile({ data }: { data: PanoramaData }) {
	const t = useTranslations("dashboard.panorama");
	const basePath = `/${data.organizationSlug}`;

	if (data.insufficientData) {
		return (
			<EmptyState
				icon={BarChart3Icon}
				title={t("noData")}
				description={t("noData")}
				actions={[
					{ label: t("noDataCta"), href: `${basePath}/descubrir` },
					{ label: t("noDataCta"), href: `${basePath}/evaluaciones`, variant: "outline" },
				]}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4 pb-4">
			{/* Hero Score */}
			<Card>
				<CardContent className="pt-4">
					<div className="flex items-center gap-4">
						<RiskMaturityRing score={data.maturityScore} size="md" />
						<div className="flex-1">
							<p className="text-lg font-semibold text-foreground">
								{t("operationControl", { score: data.maturityScore })}
							</p>
							{data.scoreTrend.length >= 2 && (
								<TrendIndicator trend={data.scoreTrend} />
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 gap-2">
				<KpiCard
					icon={<FileTextIcon className="size-4 text-primary" />}
					value={`${data.documentedPercent}%`}
					label={t("kpiDocumented")}
				/>
				<KpiCard
					icon={<UsersIcon className="size-4 text-green-600 dark:text-green-400" />}
					value={`${data.evaluatedPercent}%`}
					label={t("kpiEvaluated")}
				/>
				<KpiCard
					icon={<TrendingUpIcon className="size-4 text-primary" />}
					value={`${data.alignmentPercent}%`}
					label={t("kpiAlignment")}
				/>
				<KpiCard
					icon={<CheckCircle2Icon className="size-4 text-amber-600 dark:text-amber-400" />}
					value={`${data.completionRate}%`}
					label={t("kpiCompletion")}
				/>
			</div>

			{/* Alerts - Vulnerable Processes */}
			{data.vulnerableProcesses.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("alertsTitle")}</h2>
					<div className="space-y-2">
						{data.vulnerableProcesses.map((proc) => (
							<Card key={proc.name} className="border-l-4 border-l-destructive">
								<CardContent className="py-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 min-w-0">
											<AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
											<span className="text-sm font-medium text-foreground truncate">{proc.name}</span>
										</div>
										<span className={cn(
											"text-sm font-bold tabular-nums",
											proc.avgScore < 50 ? "text-destructive" : "text-amber-600 dark:text-amber-400",
										)}>
											{proc.avgScore}%
										</span>
									</div>
									<div className="mt-2 h-1.5 rounded-full bg-muted">
										<div
											className={cn(
												"h-full rounded-full transition-all",
												proc.avgScore < 50 ? "bg-destructive" : "bg-amber-500",
											)}
											style={{ width: `${proc.avgScore}%` }}
										/>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Actions */}
			{data.actions.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("actionsTitle")}</h2>
					<div className="space-y-2">
						{data.actions.map((action, i) => (
							<Link
								key={i}
								href={action.href}
								className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 min-h-[48px] transition-all hover:bg-primary/10 active:scale-[0.98]"
							>
								<ActionIcon type={action.type} />
								<span className="flex-1 text-sm text-foreground">{action.processName}</span>
								<ArrowRightIcon className="size-4 text-muted-foreground" />
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Score Trend Sparkline */}
			{data.scoreTrend.length > 1 && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">{t("scoreTrendTitle")}</CardTitle>
					</CardHeader>
					<CardContent>
						<Sparkline data={data.scoreTrend} />
					</CardContent>
				</Card>
			)}

			{/* Activity */}
			{data.activity.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("activityTitle")}</h2>
					<Card>
						<CardContent className="divide-y divide-border p-0">
							{data.activity.map((item, i) => (
								<div key={i} className="flex items-start gap-3 px-4 py-3">
									{item.type === "evaluation_completed"
										? <ClipboardCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
										: <WorkflowIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									}
									<div className="min-w-0 flex-1">
										<p className="text-sm text-foreground truncate">{item.title}</p>
										<p className="text-xs text-muted-foreground">{item.subtitle}</p>
									</div>
									<span className="shrink-0 text-[10px] text-muted-foreground">{item.date}</span>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

// ─── Sub-components ─────────────────────────────────────────

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
	return (
		<Card>
			<CardContent className="flex items-center gap-3 py-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
					{icon}
				</div>
				<div>
					<p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
					<p className="text-[10px] text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function TrendIndicator({ trend }: { trend: PanoramaScoreTrendPoint[] }) {
	const latest = trend[trend.length - 1]?.score ?? 0;
	const previous = trend[trend.length - 2]?.score ?? 0;
	const diff = latest - previous;
	if (diff === 0) return null;
	const isUp = diff > 0;

	return (
		<span className={cn(
			"inline-flex items-center gap-1 text-xs font-medium",
			isUp ? "text-green-600 dark:text-green-400" : "text-destructive",
		)}>
			{isUp ? "↑" : "↓"} {Math.abs(diff)}%
		</span>
	);
}

function ActionIcon({ type }: { type: string }) {
	if (type === "evaluate") return <ClipboardCheckIcon className="size-4 text-primary" />;
	if (type === "document") return <FileTextIcon className="size-4 text-primary" />;
	return <TrendingUpIcon className="size-4 text-amber-600 dark:text-amber-400" />;
}

function Sparkline({ data }: { data: PanoramaScoreTrendPoint[] }) {
	if (data.length < 2) return null;
	const maxScore = Math.max(...data.map((d) => d.score), 100);
	const minScore = Math.min(...data.map((d) => d.score), 0);
	const range = maxScore - minScore || 1;
	const w = 300;
	const h = 60;
	const points = data.map((d, i) => ({
		x: (i / (data.length - 1)) * w,
		y: h - ((d.score - minScore) / range) * h,
	}));
	const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

	return (
		<div className="flex items-end gap-2">
			<svg viewBox={`0 0 ${w} ${h}`} className="h-[60px] w-full" preserveAspectRatio="none">
				<path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<div className="flex flex-col items-end text-[10px] text-muted-foreground shrink-0">
				{data.map((d) => (
					<span key={d.month} className="leading-tight">{d.month}</span>
				))}
			</div>
		</div>
	);
}
