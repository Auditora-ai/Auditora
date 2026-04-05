"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { config as authConfig } from "@repo/auth/config";
import { Button, cn, Logo } from "@repo/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { NotificationBell } from "@notifications/components/NotificationBell";
import { UserMenu } from "@shared/components/UserMenu";
import { useNavData } from "@shared/hooks/use-nav-data";
import {
	BarChart3Icon,
	CompassIcon,
	GraduationCapIcon,
	LayoutDashboardIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	PlusIcon,
	SettingsIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ElementType } from "react";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";
import { UpgradeBanner } from "../../payments/components/UpgradeBanner";
import { useIsMobile } from "../hooks/use-media-query";
import { useSidebar } from "../lib/sidebar-context";
import { NavBadge } from "./NavBadge";
import { RiskMaturityRing } from "./RiskMaturityRing";

interface NavItem {
	id: string;
	label: string;
	href: string;
	icon: ElementType;
	isActive: boolean;
	hidden?: boolean;
	badge?: {
		text?: string;
		dotColor?: "red" | "green" | "amber" | null;
		pulse?: boolean;
	};
	quickAction?: {
		label: string;
		href: string;
	};
	section?: "flow" | "main" | "tools" | "bottom";
	flowStep?: number;
	flowCompleted?: boolean;
	sectionHeader?: string;
}

function getGreetingKey(): "morning" | "afternoon" | "evening" {
	const hour = new Date().getHours();
	if (hour < 12) return "morning";
	if (hour < 18) return "afternoon";
	return "evening";
}

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization, loaded } = useActiveOrganization();
	const { isCollapsed, toggleCollapsed } = useSidebar();
	const isMobile = useIsMobile();
	const { data: navData, isLoading: navLoading } = useNavData();

	const isCollapsedEffective = isCollapsed && !isMobile;
	const { useSidebarLayout } = config;
	const basePath = activeOrganization ? `/${activeOrganization.slug}` : "/";
	const hasOrg =
		authConfig.organizations.enable && !!activeOrganization;

	// Build badge data
	const processBadge = navData
		? {
				text:
					navData.processStats.total > 0
						? `${navData.processStats.documented}/${navData.processStats.total}`
						: undefined,
				dotColor:
					navData.processStats.total > 0
						? navData.processStats.documented /
								navData.processStats.total >=
							0.8
							? ("green" as const)
							: ("amber" as const)
						: null,
			}
		: undefined;

	// Derive flow completion from navData
	const hasArchitecture = !!navData && navData.maturityScore > 0;
	const hasProcesses = !!navData && navData.processStats.total > 0;
	const hasEvaluation = !!navData && navData.maturityScore >= 40;

	const menuItems: NavItem[] = [
		// ─── INICIO ───
		{
			id: "home",
			label: t("app.menu.home"),
			href: basePath,
			icon: LayoutDashboardIcon,
			isActive: pathname === basePath || pathname === `${basePath}/`,
			hidden: !hasOrg,
			section: "main",
		},
		// ─── CAPTURAR ───
		{
			id: "descubrir",
			label: t("app.menu.discover"),
			href: `${basePath}/discovery`,
			icon: CompassIcon,
			isActive: pathname.startsWith(`${basePath}/discovery`) || pathname.startsWith(`${basePath}/capture`) || pathname.startsWith(`${basePath}/sessions`) || pathname.startsWith(`${basePath}/session/`),
			hidden: !hasOrg,
			section: "flow",
			flowStep: 1,
			flowCompleted: hasArchitecture,
			sectionHeader: t("app.sections.capture"),
		},
		// ─── DOCUMENTAR ───
		{
			id: "processes",
			label: t("app.menu.processes"),
			href: `${basePath}/`,
			icon: WorkflowIcon,
			isActive: pathname.startsWith(`${basePath}/process/`),
			hidden: !hasOrg,
			section: "flow",
			badge: processBadge,
			quickAction: {
				label: t("app.actions.newProcess"),
				href: `${basePath}/`,
			},
			flowStep: 2,
			flowCompleted: hasProcesses,
			sectionHeader: t("app.sections.document"),
		},
		// ─── EVALUAR ───
		{
			id: "evaluaciones",
			label: t("app.menu.evaluaciones"),
			href: `${basePath}/evaluaciones`,
			icon: GraduationCapIcon,
			isActive: pathname.startsWith(`${basePath}/evaluaciones`) || pathname.startsWith(`${basePath}/evaluate`),
			hidden: !hasOrg,
			section: "flow",
			flowStep: 3,
			flowCompleted: false,
			sectionHeader: t("app.sections.evaluate"),
		},
		// ─── VER ───
		{
			id: "panorama",
			label: t("app.menu.dashboard"),
			href: `${basePath}/panorama`,
			icon: BarChart3Icon,
			isActive: pathname === `${basePath}/panorama`,
			section: "flow",
			flowStep: 4,
			flowCompleted: hasEvaluation,
			sectionHeader: t("app.sections.view"),
		},
		// ─── CONFIGURAR ───
		{
			id: "settings",
			label: t("app.menu.organizationSettings"),
			href: `${basePath}/settings`,
			icon: SettingsIcon,
			isActive: pathname.startsWith(`${basePath}/settings`),
			hidden: !hasOrg,
			section: "bottom",
		},
	];

	const mainItems = menuItems.filter(
		(i) => i.section === "main" && !i.hidden,
	);
	const flowItems = menuItems.filter(
		(i) => i.section === "flow" && !i.hidden,
	);
	const bottomItems = menuItems.filter(
		(i) => i.section === "bottom" && !i.hidden,
	);

	// Greeting subtitle
	const greetingSubtitle = navData
		? navData.maturityScore > 0
			? `${t("app.status.riskScore", { score: navData.maturityScore })} · ${navData.criticalRiskCount > 0 ? t("app.status.attentionNeeded", { count: navData.criticalRiskCount }) : t("app.status.underControl")}`
			: t("app.status.setupFirst")
		: "";

	const renderNavItem = (item: NavItem) => {
		const linkContent = (
			<Link
				href={item.href}
				className={cn(
					"relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
					"group/navitem",
					item.isActive
						? "bg-accent text-accent-foreground font-medium"
						: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
					isCollapsedEffective &&
						useSidebarLayout &&
						"justify-center px-2",
				)}
			>
				<item.icon
					className={cn(
						"size-4 shrink-0",
						item.isActive
							? "text-foreground"
							: "text-foreground0",
					)}
				/>
				{(!isCollapsedEffective || !useSidebarLayout) && (
					<>
						<span className="flex-1 truncate">
							{item.label}
						</span>
						{item.badge && (
							<NavBadge
								text={item.badge.text}
								dotColor={item.badge.dotColor}
								pulse={item.badge.pulse}
							/>
						)}
					</>
				)}
				{isCollapsedEffective &&
					useSidebarLayout &&
					item.badge && (
						<NavBadge
							dotColor={item.badge.dotColor}
							pulse={item.badge.pulse}
							collapsed
						/>
					)}
			</Link>
		);

		// Quick action on hover (expanded only)
		const withQuickAction =
			item.quickAction &&
			!isCollapsedEffective &&
			useSidebarLayout ? (
				<div className="group/qa relative">
					{linkContent}
					<Link
						href={item.quickAction.href}
						className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/qa:opacity-100 transition-opacity"
					>
						<span className="flex size-5 items-center justify-center rounded bg-muted hover:bg-accent text-muted-foreground">
							<PlusIcon className="size-3" />
						</span>
					</Link>
				</div>
			) : (
				linkContent
			);

		if (isCollapsedEffective && useSidebarLayout) {
			return (
				<li key={item.id}>
					<Tooltip>
						<TooltipTrigger asChild>
							{withQuickAction}
						</TooltipTrigger>
						<TooltipContent side="right" className="flex flex-col gap-0.5">
							<span>{item.label}</span>
							{item.badge?.text && (
								<span className="text-xs opacity-70">
									{item.badge.text}
								</span>
							)}
						</TooltipContent>
					</Tooltip>
				</li>
			);
		}

		return <li key={item.id}>{withQuickAction}</li>;
	};

	const renderFlowItem = (item: NavItem, index: number, items: NavItem[]) => {
		const isLast = index === items.length - 1;
		const step = item.flowStep ?? index + 1;
		const completed = item.flowCompleted ?? false;
		const sectionLabel = item.sectionHeader;

		const flowLink = (
			<Link
				href={item.href}
				className={cn(
					"relative flex items-center gap-3 rounded-lg py-2 text-sm transition-all duration-150",
					"group/flowitem",
					isCollapsedEffective && useSidebarLayout
						? "justify-center px-2"
						: "px-3",
					item.isActive
						? "bg-primary/[0.08] text-foreground font-medium"
						: completed
							? "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
							: "text-foreground0 hover:bg-accent/50 hover:text-muted-foreground",
				)}
			>
				{/* Step circle */}
				<span
					className={cn(
						"relative z-10 flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-colors duration-150",
						item.isActive
							? "bg-primary text-primary-foreground"
							: completed
								? "bg-primary/20 text-primary ring-1 ring-primary/30"
								: "bg-accent text-foreground0 ring-1 ring-border",
					)}
				>
					{step}
				</span>

				{(!isCollapsedEffective || !useSidebarLayout) && (
					<>
						<span className="flex-1 truncate">{item.label}</span>
						{item.badge && (
							<NavBadge
								text={item.badge.text}
								dotColor={item.badge.dotColor}
								pulse={item.badge.pulse}
							/>
						)}
					</>
				)}
				{isCollapsedEffective &&
					useSidebarLayout &&
					item.badge && (
						<NavBadge
							dotColor={item.badge.dotColor}
							pulse={item.badge.pulse}
							collapsed
						/>
					)}
			</Link>
		);

		// Quick action on hover (expanded only)
		const withQuickAction =
			item.quickAction && !isCollapsedEffective && useSidebarLayout ? (
				<div className="group/qa relative">
					{flowLink}
					<Link
						href={item.quickAction.href}
						className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/qa:opacity-100 transition-opacity"
					>
						<span className="flex size-5 items-center justify-center rounded bg-muted hover:bg-accent text-muted-foreground">
							<PlusIcon className="size-3" />
						</span>
					</Link>
				</div>
			) : (
				flowLink
			);

		const content = (
			<li key={item.id} className="relative">
				{/* Section header label (CAPTURAR, DOCUMENTAR, etc.) */}
				{sectionLabel && !isCollapsedEffective && (
					<div className="mx-3 mb-1 mt-3 first:mt-0">
						<span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
							{sectionLabel}
						</span>
					</div>
				)}
				{/* Connector line to next step */}
				{!isLast && !isCollapsedEffective && (
					<div
						className={cn(
							"absolute left-[21px] w-px h-[calc(100%-20px)] pointer-events-none transition-colors duration-150",
							sectionLabel ? "top-[52px]" : "top-[32px]",
							completed ? "bg-primary/30" : "bg-muted/60",
						)}
					/>
				)}
				{!isLast && isCollapsedEffective && useSidebarLayout && (
					<div
						className={cn(
							"absolute left-1/2 -translate-x-px top-[32px] w-px h-[calc(100%-20px)] pointer-events-none transition-colors duration-150",
							completed ? "bg-primary/30" : "bg-muted/60",
						)}
					/>
				)}
				{withQuickAction}
			</li>
		);

		if (isCollapsedEffective && useSidebarLayout) {
			return (
				<li key={item.id} className="relative">
					{!isLast && (
						<div
							className={cn(
								"absolute left-1/2 -translate-x-px top-[32px] w-px h-[calc(100%-20px)] pointer-events-none transition-colors duration-150",
								completed ? "bg-primary/30" : "bg-muted/60",
							)}
						/>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							{withQuickAction}
						</TooltipTrigger>
						<TooltipContent side="right" className="flex flex-col gap-0.5">
							{sectionLabel && (
								<span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
									{sectionLabel}
								</span>
							)}
							<span className="flex items-center gap-1.5">
								<span className={cn(
									"flex size-4 items-center justify-center rounded-full text-[9px] font-bold",
									item.isActive
										? "bg-primary text-primary-foreground"
										: completed
											? "bg-primary/20 text-primary"
											: "bg-muted text-muted-foreground",
								)}>
									{step}
								</span>
								{item.label}
							</span>
							{item.badge?.text && (
								<span className="text-xs opacity-70">
									{item.badge.text}
								</span>
							)}
						</TooltipContent>
					</Tooltip>
				</li>
			);
		}

		return content;
	};

	return (
		<nav
			className={cn(
				"w-full bg-card text-foreground/80",
				"hidden md:block",
				{
					"md:fixed md:top-0 md:left-0 md:h-full md:w-[280px]":
						useSidebarLayout,
					"md:w-[72px]":
						useSidebarLayout && isCollapsedEffective,
				},
			)}
		>
			<div className="flex h-full flex-col px-3 py-4">
				{/* Header: Logo + Greeting */}
				<div className="mb-3">
					<Link href="/" className="block">
						<Logo withLabel={!isCollapsedEffective} />
					</Link>
					{!isCollapsedEffective && user && (
						<div className="mt-3 px-1">
							<p className="text-sm font-medium text-foreground/80">
								{t(`app.greeting.${getGreetingKey()}`)},{" "}
								{user.name?.split(" ")[0] ?? ""}
							</p>
							{greetingSubtitle && (
								<p className="mt-0.5 text-[11px] text-foreground0 leading-tight">
									{greetingSubtitle}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Org Selector */}
				{authConfig.organizations.enable &&
					!authConfig.organizations.hideOrganization && (
						<div
							className={cn("mb-3", {
								"flex justify-center":
									isCollapsedEffective,
							})}
						>
							<OrganzationSelect
								collapsed={
									isCollapsedEffective &&
									useSidebarLayout
								}
							/>
						</div>
					)}

				{/* Risk Maturity Ring */}
				{hasOrg && !navLoading && navData && (
					<div
						className={cn(
							"mb-4 rounded-lg bg-accent/50 p-3",
							isCollapsedEffective && "flex justify-center p-2",
						)}
					>
						<RiskMaturityRing
							score={navData.maturityScore}
							size={isCollapsedEffective ? "sm" : "md"}
						/>
					</div>
				)}

			{/* Main section — Home */}
			{mainItems.length > 0 && (
				<ul className="flex flex-col gap-0.5 mb-2">
					{mainItems.map(renderNavItem)}
				</ul>
			)}

			{/* Flow section — consulting workflow */}
			<TooltipProvider delayDuration={0}>
			{flowItems.length > 0 && (
				<ul className="flex flex-col gap-0.5">
					{flowItems.map((item, i, arr) => renderFlowItem(item, i, arr))}
				</ul>
			)}

			</TooltipProvider>

				{/* Upgrade banner (shown when session credits are low) */}
				{hasOrg && !isCollapsedEffective && activeOrganization && (
					<UpgradeBanner
						organizationId={activeOrganization.id}
						organizationSlug={activeOrganization.slug}
					/>
				)}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Bottom section: Settings + User */}
				<div className="mt-4 flex flex-col gap-1">
				<TooltipProvider delayDuration={0}>
					<ul className="flex flex-col gap-0.5">
						{bottomItems.map(renderNavItem)}
					</ul>
				</TooltipProvider>

				{/* Notifications */}
				{hasOrg && (
					<NotificationBell
						organizationId={activeOrganization?.id}
						collapsed={isCollapsedEffective}
					/>
				)}

				{/* Collapse toggle */}
					{useSidebarLayout && (
						<div
							className={cn(
								"flex mt-2",
								isCollapsedEffective
									? "justify-center"
									: "justify-end",
							)}
						>
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleCollapsed}
								className="text-foreground0 hover:text-muted-foreground hover:bg-accent"
								aria-label={
									isCollapsed
										? "Expand sidebar"
										: "Collapse sidebar"
								}
							>
								{isCollapsed ? (
									<PanelLeftOpenIcon className="size-4" />
								) : (
									<PanelLeftCloseIcon className="size-4" />
								)}
							</Button>
						</div>
					)}

					{/* User menu */}
					<div
						className={cn("mt-1", {
							"flex justify-center":
								isCollapsedEffective,
						})}
					>
						<UserMenu
							showUserName={!isCollapsedEffective}
						/>
					</div>
				</div>
			</div>
		</nav>
	);
}
