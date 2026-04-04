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
import type { HomePageProps, TopRisk, VulnerableProcess, ActivityItem } from "../types";

export function HomeDesktop({
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
	const tc = useTranslations("common");
	const basePath = `/${organizationSlug}`;
	const isEmpty = processCount === 0 && riskCount === 0;

	if (isEmpty) {
		return (
			<div className="mx-auto max-w-2xl space-y-6 py-8">
				<EmptyState
					icon={ShieldAlertIcon}
					title={t("emptyWelcomeTitle")}
					description={t("emptyWelcomeDesc")}
					actions={[
						{ label: t("emptyCtaCapture"), href: `${basePath}/descubrir` },
						{ label: t("emptyCtaExplore"), href: `${basePath}/procesos`, variant: "outline" },
					]}
				/>
				<Card className="mx-auto max-w-md">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">{t("nextStepsTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{[
							{ label: t("onboardingStep1"), done: processCount > 0, href: `${basePath}/descubrir` },
							{ label: t("onboardingStep2"), done: (evaluaciones?.totalSimulations ?? 0) > 0, href: `${basePath}/evaluaciones` },
							{ label: t("onboardingStep3"), done: false, href: `${basePath}/settings/members` },
						].map((step, i) => (
							<Link key={i} href={step.href} className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-all hover:border-primary/30">
								<span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium", step.done ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground")}>
									{step.done ? <CheckCircle2Icon className="size-4" /> : String(i + 1)}
								</span>
								<span className={cn("text-sm", step.done ? "text-muted-foreground line-through" : "text-foreground")}>{step.label}</span>
								<ArrowRightIcon className="ml-auto size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
							</Link>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header + Actions */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">{organizationName}</p>
				</div>
				<div className="flex items-center gap-2">
					{hasActiveSession && (
						<Badge variant="destructive" className="animate-pulse">
							{t("live")}
						</Badge>
					)}
					<Button asChild>
						<Link href={`${basePath}/evaluaciones`}>
							<ClipboardCheckIcon className="mr-1.5 size-4" />
							{t("createEvaluation")}
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href={`${basePath}/descubrir`}>
							<PlusIcon className="mr-1.5 size-4" />
							{t("quickActionCapture")}
						</Link>
					</Button>
				</div>
			</div>

			{/* Hero Score + KPIs */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-8">
						<RiskMaturityRing score={maturityScore} size="lg" />
						<div className="grid flex-1 grid-cols-4 gap-4">
							<KpiCell
								value={`${documentedCount}/${processCount}`}
								label={t("documented")}
								href={`${basePath}/procesos`}
							/>
							<KpiCell
								value={String(riskCount)}
								label={t("risks")}
								href={`${basePath}/procesos`}
								valueClass="text-amber-600 dark:text-amber-400"
							/>
							<KpiCell
								value={String(evaluaciones?.totalSimulations ?? 0)}
								label={t("evaluationsThisMonth")}
								href={`${basePath}/evaluaciones`}
								valueClass="text-primary"
							/>
							<KpiCell
								value={String(evaluaciones?.membersEvaluated ?? 0)}
								label={t("activeEvaluators")}
								href={`${basePath}/evaluaciones?tab=dashboard`}
								valueClass="text-green-600 dark:text-green-400"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<div className="grid grid-cols-3 gap-3">
				<QuickAction href={`${basePath}/descubrir`} icon={<SearchIcon className="size-5 text-primary" />} iconBg="bg-primary/10" title={t("quickActionCapture")} subtitle={t("quickActionCaptureDesc")} />
				<QuickAction href={`${basePath}/evaluaciones`} icon={<ClipboardCheckIcon className="size-5 text-primary" />} iconBg="bg-primary/10" title={t("quickActionEvaluate")} subtitle={t("quickActionEvaluateDesc")} />
				<QuickAction href={`${basePath}/settings/members`} icon={<UserPlusIcon className="size-5 text-green-600 dark:text-green-400" />} iconBg="bg-green-500/10" title={t("quickActionInvite")} subtitle={t("quickActionInviteDesc")} />
			</div>

			{/* Two columns: Risks + Vulnerable Processes */}
			<div className="grid grid-cols-2 gap-6">
				{/* Top Risks */}
				<div>
					<h2 className="mb-3 text-sm font-semibold text-foreground">{t("topRisks")}</h2>
					{topRisks.length === 0 ? (
						<Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("noRisksDesc")}</CardContent></Card>
					) : (
						<div className="space-y-2">
							{topRisks.map((risk) => (
								<Link key={risk.id} href={`${basePath}/procesos`} className={cn(
									"block rounded-xl border border-border border-l-4 bg-card p-4 transition-all hover:shadow-md",
									risk.riskScore >= 16 ? "border-l-destructive" : risk.riskScore >= 12 ? "border-l-amber-500" : "border-l-primary",
								)}>
									<div className="flex items-center gap-2">
										<Badge variant={risk.riskScore >= 16 ? "destructive" : "secondary"} className="tabular-nums">{risk.riskScore}</Badge>
										<h3 className="truncate text-sm font-medium text-foreground">{risk.title}</h3>
									</div>
									{risk.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{risk.description}</p>}
									<p className="mt-1 text-[11px] text-muted-foreground">{risk.processName} · {tc("severity")}: {risk.severity} · {tc("probability")}: {risk.probability}</p>
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Vulnerable Processes */}
				<div>
					<h2 className="mb-3 text-sm font-semibold text-foreground">{t("vulnerableProcesses")}</h2>
					{vulnerableProcesses.length === 0 ? (
						<Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("noVulnerableProcesses")}</CardContent></Card>
					) : (
						<div className="space-y-2">
							{vulnerableProcesses.map((proc) => {
								const scoreColor = proc.avgScore < 50 ? "text-destructive" : proc.avgScore < 70 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400";
								const barColor = proc.avgScore < 50 ? "bg-destructive" : proc.avgScore < 70 ? "bg-amber-500" : "bg-green-500";
								return (
									<Link key={proc.processId} href={`${basePath}/evaluaciones`} className="block rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
										<div className="mb-2 flex items-center justify-between">
											<h3 className="truncate text-sm font-medium text-foreground">{proc.name}</h3>
											<span className={cn("text-sm font-bold tabular-nums", scoreColor)}>{proc.avgScore}</span>
										</div>
										<div className="h-1.5 rounded-full bg-muted">
											<div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${proc.avgScore}%` }} />
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Next Steps + Activity */}
			<div className="grid grid-cols-2 gap-6">
				{nextSteps.length > 0 && (
					<div>
						<h2 className="mb-3 text-sm font-semibold text-foreground">{t("nextStepsTitle")}</h2>
						<div className="space-y-2">
							{nextSteps.map((step) => (
								<Link key={step.id} href={step.href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
									<NextStepIcon icon={step.icon} />
									<span className="flex-1 text-sm text-foreground">{step.message}</span>
									<ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
								</Link>
							))}
						</div>
					</div>
				)}

				{recentActivity.length > 0 && (
					<div>
						<h2 className="mb-3 text-sm font-semibold text-foreground">{t("recentActivityTitle")}</h2>
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
			</div>
		</div>
	);
}

// ─── Sub-components ────────────────────────────────────────────

function KpiCell({ value, label, href, valueClass }: { value: string; label: string; href: string; valueClass?: string }) {
	return (
		<Link href={href} className="group rounded-lg p-2 transition-all hover:bg-accent">
			<p className={cn("text-2xl font-bold tabular-nums text-foreground transition-colors", valueClass)}>{value}</p>
			<p className="text-xs text-muted-foreground">{label}</p>
		</Link>
	);
}

function QuickAction({ href, icon, iconBg, title, subtitle }: { href: string; icon: React.ReactNode; iconBg: string; title: string; subtitle: string }) {
	return (
		<Link href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
			<div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>{icon}</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
				<p className="text-[11px] text-muted-foreground">{subtitle}</p>
			</div>
			<ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
