"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { RiskMaturityRing } from "@shared/components/RiskMaturityRing";
import { EmptyState } from "@shared/components/EmptyState";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BarChart3Icon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	FileTextIcon,
	TrendingUpIcon,
	UsersIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PanoramaData, PanoramaProcessHeatmapRow, PanoramaScoreTrendPoint } from "../types";

export function PanoramaDesktop({ data }: { data: PanoramaData }) {
	const t = useTranslations("dashboard.panorama");
	const basePath = `/${data.organizationSlug}`;

	if (data.insufficientData) {
		return (
			<div className="mx-auto max-w-2xl py-8">
				<EmptyState
					icon={BarChart3Icon}
					title={t("noData")}
					description={t("noData")}
					actions={[
						{ label: t("noDataCta"), href: `${basePath}/discovery` },
						{ label: t("noDataCta"), href: `${basePath}/evaluaciones`, variant: "outline" },
					]}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("title")}</p>
			</div>

			{/* Hero Score + KPI Row */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-8">
						<div className="flex flex-col items-center gap-2">
							<RiskMaturityRing score={data.maturityScore} size="lg" />
							{data.scoreTrend.length >= 2 && <TrendIndicator trend={data.scoreTrend} />}
						</div>
						<div className="grid flex-1 grid-cols-4 gap-6">
							<KpiCell icon={<FileTextIcon className="size-5 text-primary" />} value={`${data.documentedPercent}%`} label={t("kpiDocumented")} />
							<KpiCell icon={<UsersIcon className="size-5 text-green-600 dark:text-green-400" />} value={`${data.evaluatedPercent}%`} label={t("kpiEvaluated")} />
							<KpiCell icon={<TrendingUpIcon className="size-5 text-primary" />} value={`${data.alignmentPercent}%`} label={t("kpiAlignment")} />
							<KpiCell icon={<CheckCircle2Icon className="size-5 text-amber-600 dark:text-amber-400" />} value={`${data.completionRate}%`} label={t("kpiCompletion")} />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Two columns: Alerts+Actions and Trend+Heatmap */}
			<div className="grid grid-cols-2 gap-6">
				{/* Left: Alerts + Actions */}
				<div className="space-y-6">
					{/* Alerts */}
					{data.vulnerableProcesses.length > 0 && (
						<div>
							<h2 className="mb-3 text-sm font-semibold text-foreground">{t("alertsTitle")}</h2>
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
												<div className={cn("h-full rounded-full", proc.avgScore < 50 ? "bg-destructive" : "bg-amber-500")} style={{ width: `${proc.avgScore}%` }} />
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
							<h2 className="mb-3 text-sm font-semibold text-foreground">{t("actionsTitle")}</h2>
							<div className="space-y-2">
								{data.actions.map((action, i) => (
									<Link
										key={i}
										href={action.href}
										className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 transition-all hover:bg-primary/10"
									>
										{action.type === "evaluate"
											? <ClipboardCheckIcon className="size-4 text-primary" />
											: action.type === "document"
												? <FileTextIcon className="size-4 text-primary" />
												: <TrendingUpIcon className="size-4 text-amber-600 dark:text-amber-400" />
										}
										<span className="flex-1 text-sm text-foreground">{action.processName}</span>
										<ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
									</Link>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right: Trend + Heatmap + Activity */}
				<div className="space-y-6">
					{/* Score Trend */}
					{data.scoreTrend.length > 1 && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">{t("scoreTrendTitle")}</CardTitle>
							</CardHeader>
							<CardContent>
								<Sparkline data={data.scoreTrend} height={80} />
							</CardContent>
						</Card>
					)}

					{/* Process Heatmap */}
					{data.processHeatmap.length > 0 && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">{t("heatmapTitle")}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{data.processHeatmap.map((row) => (
										<div key={row.processName} className="flex items-center gap-3">
											<span className="w-32 truncate text-sm text-foreground">{row.processName}</span>
											<div className="flex flex-1 gap-1">
												<HeatCell value={row.avgAlignment} label={t("kpiAlignment")} />
												<HeatCell value={100 - row.avgRisk} label={t("heatmapRisk")} />
												<HeatCell value={row.avgCriterio} label={t("heatmapCriterio")} />
											</div>
											<Badge variant="secondary" className="text-[10px] tabular-nums">{row.simulationCount}</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Activity */}
					{data.activity.length > 0 && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">{t("activityTitle")}</CardTitle>
							</CardHeader>
							<CardContent className="divide-y divide-border p-0 pt-0">
								{data.activity.slice(0, 5).map((item, i) => (
									<div key={i} className="flex items-start gap-3 px-4 py-2.5">
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
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Sub-components ─────────────────────────────────────────

function KpiCell({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
	return (
		<div className="flex items-center gap-3 rounded-lg p-2">
			<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</div>
			<div>
				<p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
				<p className="text-xs text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}

function TrendIndicator({ trend }: { trend: PanoramaScoreTrendPoint[] }) {
	const latest = trend[trend.length - 1]?.score ?? 0;
	const previous = trend[trend.length - 2]?.score ?? 0;
	const diff = latest - previous;
	if (diff === 0) return null;
	const isUp = diff > 0;
	return (
		<span className={cn("inline-flex items-center gap-1 text-xs font-medium", isUp ? "text-green-600 dark:text-green-400" : "text-destructive")}>
			{isUp ? "↑" : "↓"} {Math.abs(diff)}%
		</span>
	);
}

function HeatCell({ value, label }: { value: number; label: string }) {
	const bg = value >= 80 ? "bg-green-500/20" : value >= 60 ? "bg-amber-500/20" : "bg-destructive/20";
	const text = value >= 80 ? "text-green-700 dark:text-green-300" : value >= 60 ? "text-amber-700 dark:text-amber-300" : "text-destructive";
	return (
		<div className={cn("flex-1 rounded px-2 py-1 text-center", bg)} title={label}>
			<span className={cn("text-xs font-semibold tabular-nums", text)}>{value}</span>
		</div>
	);
}

function Sparkline({ data, height = 60 }: { data: PanoramaScoreTrendPoint[]; height?: number }) {
	if (data.length < 2) return null;
	const maxScore = Math.max(...data.map((d) => d.score), 100);
	const minScore = Math.min(...data.map((d) => d.score), 0);
	const range = maxScore - minScore || 1;
	const w = 400;
	const h = height;
	const points = data.map((d, i) => ({
		x: (i / (data.length - 1)) * w,
		y: h - ((d.score - minScore) / range) * (h - 10) - 5,
	}));
	const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
	const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

	return (
		<div>
			<svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
				<defs>
					<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
						<stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
					</linearGradient>
				</defs>
				<path d={areaD} fill="url(#sparkGrad)" />
				<path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				{points.map((p, i) => (
					<circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />
				))}
			</svg>
			<div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
				{data.map((d) => <span key={d.month}>{d.month}</span>)}
			</div>
		</div>
	);
}
