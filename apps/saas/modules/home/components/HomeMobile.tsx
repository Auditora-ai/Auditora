"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { RiskMaturityRing } from "@shared/components/RiskMaturityRing";
import { EmptyState } from "@shared/components/EmptyState";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	PlusIcon,
	SearchIcon,
	ShieldAlertIcon,
	TrendingUpIcon,
	UserPlusIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HomePageProps, TopRisk, VulnerableProcess, NextStepRecommendation, ActivityItem } from "../types";

// ─── Shared design tokens ─────────────────────────────────
const SECTION_HEADER = "mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CARD_BASE = "rounded-2xl border border-border bg-card";
const CARD_INTERACTIVE = `${CARD_BASE} transition-all hover:shadow-sm active:scale-[0.98]`;
const SCORE_COLOR = (score: number) =>
	score >= 80 ? "text-green-600 dark:text-green-400"
	: score >= 60 ? "text-amber-600 dark:text-amber-400"
	: "text-destructive";
const BAR_COLOR = (score: number) =>
	score >= 80 ? "bg-green-500"
	: score >= 60 ? "bg-amber-500"
	: "bg-destructive";

export function HomeMobile({
	organizationName,
	organizationSlug,
	maturityScore,
	topRisks,
	recentActivity,
	processCount,
	documentedCount,
	riskCount,
	hasActiveSession,
	evaluaciones,
	vulnerableProcesses = [],
	nextSteps = [],
}: HomePageProps) {
	const t = useTranslations("dashboard.riskDashboard");
	const basePath = `/${organizationSlug}`;
	const isEmpty = processCount === 0 && riskCount === 0;

	if (isEmpty) {
		return (
			<div className="flex flex-col gap-5 pb-24">
				<EmptyState
					icon={ShieldAlertIcon}
					title={t("emptyWelcomeTitle")}
					description={t("emptyWelcomeDesc")}
					actions={[
						{ label: t("emptyCtaCapture"), href: `${basePath}/descubrir` },
						{ label: t("emptyCtaExplore"), href: `${basePath}/procesos`, variant: "outline" },
					]}
				/>
				<div className={`${CARD_BASE} p-4`}>
					<h2 className={SECTION_HEADER}>{t("nextStepsTitle")}</h2>
					<div className="space-y-2">
						{[
							{ label: t("onboardingStep1"), done: false, href: `${basePath}/descubrir` },
							{ label: t("onboardingStep2"), done: false, href: `${basePath}/evaluaciones` },
							{ label: t("onboardingStep3"), done: false, href: `${basePath}/settings/members` },
						].map((step, i) => (
							<Link key={i} href={step.href} className="group flex items-center gap-3 rounded-xl border border-border px-4 py-3 min-h-[48px] transition-all hover:border-primary/30 active:scale-[0.98]">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{i + 1}</span>
								<span className="flex-1 text-sm text-foreground">{step.label}</span>
								<ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
							</Link>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 pb-24">
			{/* ── Hero Score ── */}
			<div className={`${CARD_BASE} p-4`}>
				<div className="flex items-center gap-4">
					<RiskMaturityRing score={maturityScore} size="md" />
					<div className="flex-1 min-w-0">
						<p className="text-base font-semibold text-foreground truncate">{organizationName}</p>
						{hasActiveSession && (
							<span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive mt-1">
								<span className="size-1.5 animate-pulse rounded-full bg-destructive" />
								{t("live")}
							</span>
						)}
					</div>
				</div>
				{/* Stats */}
				<div className="mt-4 grid grid-cols-3 gap-2">
					<StatCell href={`${basePath}/procesos`} value={`${documentedCount}/${processCount}`} label={t("documented")} />
					<StatCell href={`${basePath}/procesos`} value={String(riskCount)} label={t("risks")} />
					<StatCell href={`${basePath}/evaluaciones`} value={String(evaluaciones?.totalSimulations ?? 0)} label={t("evaluationsThisMonth")} />
				</div>
			</div>

			{/* ── Quick Actions ── */}
			<div className="grid grid-cols-1 gap-3">
				<QuickAction href={`${basePath}/descubrir`} icon={<SearchIcon className="size-5 text-primary" />} iconBg="bg-primary/10" title={t("quickActionCapture")} subtitle={t("quickActionCaptureDesc")} />
				<QuickAction href={`${basePath}/evaluaciones`} icon={<ClipboardCheckIcon className="size-5 text-primary" />} iconBg="bg-primary/10" title={t("quickActionEvaluate")} subtitle={t("quickActionEvaluateDesc")} />
			</div>

			{/* ── Top Risks ── */}
			{topRisks.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("topRisks")}</h2>
					<div className="space-y-3">
						{topRisks.map((risk) => (
							<Link key={risk.id} href={`${basePath}/procesos`}
								className={cn(CARD_INTERACTIVE, "block p-4 border-l-4",
									risk.riskScore >= 16 ? "border-l-destructive" : risk.riskScore >= 12 ? "border-l-amber-500" : "border-l-primary"
								)}>
								<div className="flex items-center gap-2">
									<Badge variant={risk.riskScore >= 16 ? "destructive" : "secondary"} className="tabular-nums">{risk.riskScore}</Badge>
									<span className="truncate text-sm font-medium text-foreground">{risk.title}</span>
								</div>
								{risk.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{risk.description}</p>}
								<p className="mt-1 text-[10px] text-muted-foreground">{risk.processName}</p>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── Vulnerable Processes ── */}
			{vulnerableProcesses.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("vulnerableProcesses")}</h2>
					<div className="space-y-3">
						{vulnerableProcesses.map((proc) => (
							<Link key={proc.processId} href={`${basePath}/evaluaciones`}
								className={`${CARD_INTERACTIVE} block p-4`}>
								<div className="mb-2 flex items-center justify-between">
									<span className="truncate text-sm font-medium text-foreground">{proc.name}</span>
									<span className={cn("text-sm font-bold tabular-nums", SCORE_COLOR(proc.avgScore))}>{proc.avgScore}</span>
								</div>
								<div className="h-1.5 rounded-full bg-muted">
									<div className={cn("h-full rounded-full transition-all", BAR_COLOR(proc.avgScore))} style={{ width: `${proc.avgScore}%` }} />
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── Next Steps ── */}
			{nextSteps.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("nextStepsTitle")}</h2>
					<div className="space-y-3">
						{nextSteps.map((step) => (
							<Link key={step.id} href={step.href} className={`${CARD_INTERACTIVE} flex items-center gap-3 p-4 min-h-[48px]`}>
								<NextStepIcon icon={step.icon} />
								<span className="flex-1 text-sm text-foreground">{step.message}</span>
								<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
							</Link>
						))}
					</div>
				</section>
			)}

			{/* ── Activity Feed ── */}
			{recentActivity.length > 0 && (
				<section>
					<h2 className={SECTION_HEADER}>{t("recentActivityTitle")}</h2>
					<div className={`${CARD_BASE} divide-y divide-border overflow-hidden`}>
						{recentActivity.map((item, i) => (
							<div key={i} className="flex items-start gap-3 px-4 py-3">
								<ActivityIcon type={item.type} />
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

			{/* ── FAB ── */}
			<Link href={`${basePath}/descubrir`}
				className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform">
				<PlusIcon className="size-6" />
			</Link>
		</div>
	);
}

// ─── Shared sub-components ─────────────────────────────────

function StatCell({ href, value, label }: { href: string; value: string; label: string }) {
	return (
		<Link href={href} className="flex flex-col items-center justify-center rounded-xl bg-muted p-2.5 min-h-[48px] active:scale-95 transition-transform">
			<span className="text-base font-bold tabular-nums text-foreground">{value}</span>
			<span className="text-[10px] text-muted-foreground">{label}</span>
		</Link>
	);
}

function QuickAction({ href, icon, iconBg, title, subtitle }: { href: string; icon: React.ReactNode; iconBg: string; title: string; subtitle: string }) {
	return (
		<Link href={href} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 min-h-[48px] transition-all hover:shadow-sm active:scale-[0.98]">
			<div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>{icon}</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-[10px] text-muted-foreground">{subtitle}</p>
			</div>
			<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
		</Link>
	);
}

function NextStepIcon({ icon }: { icon: string }) {
	const map: Record<string, React.ReactNode> = {
		scan: <SearchIcon className="size-4 text-primary" />,
		evaluate: <ClipboardCheckIcon className="size-4 text-primary" />,
		improve: <TrendingUpIcon className="size-4 text-destructive" />,
		remind: <UserPlusIcon className="size-4 text-amber-600 dark:text-amber-400" />,
		grow: <WorkflowIcon className="size-4 text-green-600 dark:text-green-400" />,
	};
	return <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">{map[icon] ?? <ArrowRightIcon className="size-4 text-muted-foreground" />}</div>;
}

function ActivityIcon({ type }: { type: string }) {
	if (type === "evaluation_completed") return <ClipboardCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />;
	if (type === "risk_found") return <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />;
	return <WorkflowIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}
