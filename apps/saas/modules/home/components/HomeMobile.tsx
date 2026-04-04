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
			<div className="flex flex-col gap-4 pb-4">
				<EmptyState
					icon={ShieldAlertIcon}
					title={t("emptyWelcomeTitle")}
					description={t("emptyWelcomeDesc")}
					actions={[
						{
							label: t("emptyCtaCapture"),
							href: `${basePath}/descubrir`,
						},
						{
							label: t("emptyCtaExplore"),
							href: `${basePath}/procesos`,
							variant: "outline",
						},
					]}
				/>
				{/* Onboarding checklist */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">{t("nextStepsTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<OnboardingStep
							label={t("onboardingStep1")}
							done={processCount > 0}
							href={`${basePath}/descubrir`}
						/>
						<OnboardingStep
							label={t("onboardingStep2")}
							done={(evaluaciones?.totalSimulations ?? 0) > 0}
							href={`${basePath}/evaluaciones`}
						/>
						<OnboardingStep
							label={t("onboardingStep3")}
							done={false}
							href={`${basePath}/settings/members`}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 pb-4">
			{/* Hero Score Card */}
			<Card className="overflow-hidden">
				<CardContent className="pt-4">
					<div className="flex items-center gap-4">
						<RiskMaturityRing score={maturityScore} size="md" />
						<div className="flex-1">
							<p className="text-lg font-semibold text-foreground">
								{organizationName}
							</p>
							{hasActiveSession && (
								<span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
									<span className="size-1.5 animate-pulse rounded-full bg-destructive" />
									{t("live")}
								</span>
							)}
							{/* Stats row */}
							<div className="mt-2 grid grid-cols-3 gap-2 text-center">
								<Link href={`${basePath}/procesos`} className="min-h-[48px] flex flex-col items-center justify-center rounded-lg bg-muted p-1.5 active:scale-95 transition-transform">
									<span className="text-base font-bold tabular-nums text-foreground">{documentedCount}<span className="text-xs font-normal text-muted-foreground">/{processCount}</span></span>
									<span className="text-[10px] text-muted-foreground">{t("documented")}</span>
								</Link>
								<Link href={`${basePath}/procesos`} className="min-h-[48px] flex flex-col items-center justify-center rounded-lg bg-muted p-1.5 active:scale-95 transition-transform">
									<span className="text-base font-bold tabular-nums text-foreground">{riskCount}</span>
									<span className="text-[10px] text-muted-foreground">{t("risks")}</span>
								</Link>
								<Link href={`${basePath}/evaluaciones`} className="min-h-[48px] flex flex-col items-center justify-center rounded-lg bg-muted p-1.5 active:scale-95 transition-transform">
									<span className="text-base font-bold tabular-nums text-foreground">{evaluaciones?.totalSimulations ?? 0}</span>
									<span className="text-[10px] text-muted-foreground">{t("evaluationsThisMonth")}</span>
								</Link>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 gap-2">
				<QuickActionCard
					href={`${basePath}/descubrir`}
					icon={<SearchIcon className="size-5 text-primary" />}
					title={t("quickActionCapture")}
					subtitle={t("quickActionCaptureDesc")}
					iconBg="bg-primary/10"
				/>
				<QuickActionCard
					href={`${basePath}/evaluaciones`}
					icon={<ClipboardCheckIcon className="size-5 text-primary" />}
					title={t("quickActionEvaluate")}
					subtitle={t("quickActionEvaluateDesc")}
					iconBg="bg-primary/10"
				/>
			</div>

			{/* Top Risks */}
			{topRisks.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("topRisks")}</h2>
					<div className="space-y-2">
						{topRisks.map((risk) => (
							<RiskCard key={risk.id} risk={risk} basePath={basePath} />
						))}
					</div>
				</div>
			)}

			{/* Vulnerable Processes */}
			{vulnerableProcesses.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("vulnerableProcesses")}</h2>
					<div className="space-y-2">
						{vulnerableProcesses.map((proc) => (
							<VulnerableProcessCard key={proc.processId} process={proc} basePath={basePath} />
						))}
					</div>
				</div>
			)}

			{/* Next Steps */}
			{nextSteps.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("nextStepsTitle")}</h2>
					<div className="space-y-2">
						{nextSteps.map((step) => (
							<Link
								key={step.id}
								href={step.href}
								className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 min-h-[48px] transition-all hover:border-primary/30 active:scale-[0.98]"
							>
								<NextStepIcon icon={step.icon} />
								<span className="flex-1 text-sm text-foreground">{step.message}</span>
								<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Recent Activity */}
			{recentActivity.length > 0 && (
				<div>
					<h2 className="mb-2 text-sm font-semibold text-foreground">{t("recentActivityTitle")}</h2>
					<Card>
						<CardContent className="divide-y divide-border p-0">
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
						</CardContent>
					</Card>
				</div>
			)}

			{/* FAB */}
			<Link
				href={`${basePath}/descubrir`}
				className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
			>
				<PlusIcon className="size-6" />
			</Link>
		</div>
	);
}

// ─── Sub-components ────────────────────────────────────────────────

function OnboardingStep({ label, done, href }: { label: string; done: boolean; href: string }) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 min-h-[48px] transition-all hover:border-primary/30 active:scale-[0.98]"
		>
			<span className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
				done ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground",
			)}>
				{done ? <CheckCircle2Icon className="size-4" /> : "·"}
			</span>
			<span className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>{label}</span>
			<ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
		</Link>
	);
}

function QuickActionCard({ href, icon, title, subtitle, iconBg }: { href: string; icon: React.ReactNode; title: string; subtitle: string; iconBg: string }) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 min-h-[48px] transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.98]"
		>
			<div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-[11px] text-muted-foreground">{subtitle}</p>
			</div>
			<ArrowRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
		</Link>
	);
}

function RiskCard({ risk, basePath }: { risk: TopRisk; basePath: string }) {
	const severity = risk.riskScore >= 16 ? "destructive" : risk.riskScore >= 12 ? "secondary" : "outline";
	const borderColor = risk.riskScore >= 16 ? "border-l-destructive" : risk.riskScore >= 12 ? "border-l-amber-500" : "border-l-primary";

	return (
		<Link
			href={`${basePath}/procesos`}
			className={cn("block rounded-xl border border-border border-l-4 bg-card p-3 transition-all hover:shadow-sm", borderColor)}
		>
			<div className="flex items-start justify-between">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<Badge variant={severity} className="text-xs tabular-nums">{risk.riskScore}</Badge>
						<h3 className="truncate text-sm font-medium text-foreground">{risk.title}</h3>
					</div>
					{risk.description && (
						<p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{risk.description}</p>
					)}
					<p className="mt-1 text-[11px] text-muted-foreground">{risk.processName}</p>
				</div>
			</div>
		</Link>
	);
}

function VulnerableProcessCard({ process, basePath }: { process: VulnerableProcess; basePath: string }) {
	const scoreColor = process.avgScore < 50 ? "text-destructive" : process.avgScore < 70 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400";
	const barColor = process.avgScore < 50 ? "bg-destructive" : process.avgScore < 70 ? "bg-amber-500" : "bg-green-500";

	return (
		<Link
			href={`${basePath}/evaluaciones`}
			className="block rounded-xl border border-border bg-card p-3 transition-all hover:shadow-sm"
		>
			<div className="mb-2 flex items-center justify-between">
				<h3 className="truncate text-sm font-medium text-foreground">{process.name}</h3>
				<span className={cn("text-sm font-bold tabular-nums", scoreColor)}>{process.avgScore}</span>
			</div>
			<div className="h-1.5 rounded-full bg-muted">
				<div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${process.avgScore}%` }} />
			</div>
		</Link>
	);
}

function NextStepIcon({ icon }: { icon: string }) {
	const iconMap: Record<string, React.ReactNode> = {
		scan: <SearchIcon className="size-4 text-primary" />,
		evaluate: <ClipboardCheckIcon className="size-4 text-primary" />,
		improve: <TrendingUpIcon className="size-4 text-destructive" />,
		remind: <UserPlusIcon className="size-4 text-amber-600 dark:text-amber-400" />,
		grow: <WorkflowIcon className="size-4 text-green-600 dark:text-green-400" />,
	};
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
			{iconMap[icon] ?? <ArrowRightIcon className="size-4 text-muted-foreground" />}
		</div>
	);
}

function ActivityIcon({ type }: { type: string }) {
	if (type === "evaluation_completed") return <ClipboardCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />;
	if (type === "session_ended") return <WorkflowIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
	if (type === "risk_found") return <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />;
	return <WorkflowIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}
