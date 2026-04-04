"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
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
import type { PanoramaData, PanoramaScoreTrendPoint } from "../types";

const SECTION_HEADER = "mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CARD_BASE = "rounded-2xl border border-border bg-card";
const CARD_INTERACTIVE = `${CARD_BASE} transition-all hover:shadow-sm active:scale-[0.98]`;
const SCORE_COLOR = (score: number) =>
	score >= 80 ? "text-green-600 dark:text-green-400"
	: score >= 60 ? "text-amber-600 dark:text-amber-400"
	: "text-destructive";

export function PanoramaMobile({ data }: { data: PanoramaData }) {
	const t = useTranslations("dashboard.panorama");
	const basePath = `/${data.organizationSlug}`;

	if (data.insufficientData) {
		return (
			<div className="flex flex-col gap-5 pb-24">
				<EmptyState
					icon={BarChart3Icon}
					title={t("noData")}
					description={t("noData")}
					actions={[
						{ label: t("noDataCta"), href: `${basePath}/descubrir` },
						{ label: t("noDataCta"), href: `${basePath}/evaluaciones`, variant: "outline" },
					]}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 pb-24">
			{/* ── Hero Score ── */}
			<div className={`${CARD_BASE} p-4`}>
				<div className="flex items-center gap-4">
					<RiskMaturityRing score={data.maturityScore} size="md" />
					<div className="flex-1">
						<p className="text-base font-semibold text-foreground">
							{t("operationControl", { score: data.maturityScore })}
						</p>
						{data.scoreTrend.length >= 2 && <TrendBadge trend={data.scoreTrend} />}
					</div>
				</div>
			</div>

			{/* ── KPIs ── */}
			<div className="grid grid-cols-2 gap-3">
				<KpiCard icon={<FileTextIcon className="size-4 text-primary" />} value={`${data.documentedPercent}%`} label={t("kpiDocumented")} />
				<KpiCard icon={<UsersIcon className="size-4 text-green-600 dark:text-green-400" />} value={`${data.evaluatedPercent}%`} label={t("kpiEvaluated")} />
				<KpiCard icon={<TrendingUpIcon className="size-4 text-primary" />} value={`${data.alignmentPercent}%`} label={t("kpiAlignment")} />
				<KpiCard icon={<CheckCircle2Icon className="size-4 text-amber-600 dark:text-amber-400" />} value={`${data.completionRate}%`} label={t("kpiCompletion")} />
			</div>

			{/* ── Alerts ── */}
			{data.vulnerableProcesses.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("alertsTitle")}</h2>
					<div className="space-y-3">
						{data.vulnerableProcesses.map((proc) => (
							<div key={proc.name} className={`${CARD_BASE} border-l-4 border-l-destructive p-4`}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 min-w-0">
										<AlertTriangleIcon className="size-4 shrink-0 text-destructive" />
										<span className="text-sm font-medium text-foreground truncate">{proc.name}</span>
									</div>
									<span className={cn("text-sm font-bold tabular-nums", SCORE_COLOR(proc.avgScore))}>{proc.avgScore}%</span>
								</div>
								<div className="mt-2 h-1.5 rounded-full bg-muted">
									<div className={cn("h-full rounded-full transition-all", proc.avgScore < 50 ? "bg-destructive" : "bg-amber-500")} style={{ width: `${proc.avgScore}%` }} />
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{/* ── Actions ── */}
			{data.actions.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("actionsTitle")}</h2>
					<div className="space-y-3">
						{data.actions.map((action, i) => (
							<Link key={i} href={action.href} className={`${CARD_INTERACTIVE} flex items-center gap-3 p-4 min-h-[48px] border-l-4 border-l-primary`}>
								{action.type === "evaluate" ? <ClipboardCheckIcon className="size-4 text-primary" />
									: action.type === "document" ? <FileTextIcon className="size-4 text-primary" />
									: <TrendingUpIcon className="size-4 text-amber-600 dark:text-amber-400" />}
								<span className="flex-1 text-sm text-foreground">{action.processName}</span>
								<ArrowRightIcon className="size-4 text-muted-foreground" />
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── Trend ── */}
			{data.scoreTrend.length > 1 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("scoreTrendTitle")}</h2>
					<div className={`${CARD_BASE} p-4`}>
						<Sparkline data={data.scoreTrend} />
					</div>
				</section>
			)}

			{/* ── Activity ── */}
			{data.activity.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("activityTitle")}</h2>
					<div className={`${CARD_BASE} divide-y divide-border overflow-hidden`}>
						{data.activity.map((item, i) => (
							<div key={i} className="flex items-start gap-3 px-4 py-3">
								{item.type === "evaluation_completed"
									? <ClipboardCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
									: <WorkflowIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
								<div className="min-w-0 flex-1">
									<p className="text-sm text-foreground truncate">{item.title}</p>
									<p className="text-xs text-muted-foreground">{item.subtitle}</p>
								</div>
								<span className="shrink-0 text-[10px] text-muted-foreground">{item.date}</span>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

// ─── Sub-components ─────────────────────────────────────────

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
	return (
		<div className="rounded-2xl border border-border bg-card p-4">
			<div className="flex items-center gap-3">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</div>
				<div>
					<p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
					<p className="text-[10px] text-muted-foreground">{label}</p>
				</div>
			</div>
		</div>
	);
}

function TrendBadge({ trend }: { trend: PanoramaScoreTrendPoint[] }) {
	const latest = trend[trend.length - 1]?.score ?? 0;
	const previous = trend[trend.length - 2]?.score ?? 0;
	const diff = latest - previous;
	if (diff === 0) return null;
	return (
		<span className={cn("inline-flex items-center gap-1 text-xs font-medium mt-1", diff > 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
			{diff > 0 ? "↑" : "↓"} {Math.abs(diff)}%
		</span>
	);
}

function Sparkline({ data }: { data: PanoramaScoreTrendPoint[] }) {
	if (data.length < 2) return null;
	const max = Math.max(...data.map((d) => d.score), 100);
	const min = Math.min(...data.map((d) => d.score), 0);
	const range = max - min || 1;
	const w = 300;
	const h = 60;
	const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((d.score - min) / range) * h }));
	const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
	const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

	return (
		<div>
			<svg viewBox={`0 0 ${w} ${h}`} className="h-[60px] w-full" preserveAspectRatio="none">
				<defs>
					<linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
						<stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
					</linearGradient>
				</defs>
				<path d={areaD} fill="url(#trendGrad)" />
				<path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
				{data.map((d) => <span key={d.month}>{d.month}</span>)}
			</div>
		</div>
	);
}
