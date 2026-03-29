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
import { UserMenu } from "@shared/components/UserMenu";
import { useNavData } from "@shared/hooks/use-nav-data";
import {
	BotIcon,
	FileTextIcon,
	FolderOpenIcon,
	LayoutDashboardIcon,
	MicIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	PlusIcon,
	ScanSearchIcon,
	SettingsIcon,
	ShieldAlertIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ElementType } from "react";
import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";
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
	section?: "main" | "tools" | "bottom";
}

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Buenos días";
	if (hour < 18) return "Buenas tardes";
	return "Buenas noches";
}

function formatNextSession(date: Date): string {
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return `Hoy ${date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
	}
	if (days === 1) {
		return `Mañana ${date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
	}

	const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
	return `${dayNames[date.getDay()]} ${date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
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
	const riskBadge = navData
		? {
				text:
					navData.criticalRiskCount > 0
						? `${navData.criticalRiskCount} críticos`
						: undefined,
				dotColor:
					navData.criticalRiskCount > 0
						? ("red" as const)
						: navData.maturityScore > 0
							? ("green" as const)
							: null,
			}
		: undefined;

	const sessionBadge = navData
		? {
				text: navData.hasActiveSession
					? "🔴 EN VIVO"
					: navData.nextSession
						? formatNextSession(new Date(navData.nextSession.date))
						: undefined,
				dotColor: navData.hasActiveSession
					? ("red" as const)
					: navData.nextSession
						? ("green" as const)
						: null,
				pulse: navData.hasActiveSession,
			}
		: undefined;

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

	const deliverableBadge = navData
		? {
				text:
					navData.pendingDeliverables > 0
						? `${navData.pendingDeliverables} pendientes`
						: undefined,
				dotColor:
					navData.pendingDeliverables > 0
						? ("amber" as const)
						: null,
			}
		: undefined;

	const menuItems: NavItem[] = [
		// ─── MAIN ───
		{
			id: "panorama",
			label: t("app.menu.dashboard"),
			href: basePath,
			icon: LayoutDashboardIcon,
			isActive: pathname === "/" || pathname === basePath,
			section: "main",
		},
		{
			id: "risks",
			label: t("app.menu.risks"),
			href: `${basePath}/deliverables/risks`,
			icon: ShieldAlertIcon,
			isActive: pathname.startsWith(`${basePath}/deliverables/risks`),
			hidden: !hasOrg,
			section: "main",
			badge: riskBadge,
			quickAction: {
				label: "Registrar Riesgo",
				href: `${basePath}/deliverables/risks`,
			},
		},
		{
			id: "sessions",
			label: t("app.menu.sessions"),
			href: `${basePath}/sessions`,
			icon: MicIcon,
			isActive: pathname.startsWith(`${basePath}/session`),
			hidden: !hasOrg,
			section: "main",
			badge: sessionBadge,
			quickAction: {
				label: "Nueva Sesión",
				href: `${basePath}/sessions/new`,
			},
		},
		{
			id: "processes",
			label: t("app.menu.processes"),
			href: `${basePath}/procesos`,
			icon: WorkflowIcon,
			isActive: pathname.startsWith(`${basePath}/procesos`),
			hidden: !hasOrg,
			section: "main",
			badge: processBadge,
			quickAction: {
				label: "Nuevo Proceso",
				href: `${basePath}/procesos`,
			},
		},
		{
			id: "deliverables",
			label: t("app.menu.deliverables"),
			href: `${basePath}/deliverables`,
			icon: FileTextIcon,
			isActive:
				pathname.startsWith(`${basePath}/deliverables`) &&
				!pathname.startsWith(`${basePath}/deliverables/risks`),
			hidden: !hasOrg,
			section: "main",
			badge: deliverableBadge,
		},
		// ─── TOOLS ───
		{
			id: "documents",
			label: t("app.menu.documents"),
			href: `${basePath}/documents`,
			icon: FolderOpenIcon,
			isActive: pathname.startsWith(`${basePath}/documents`),
			hidden: !hasOrg,
			section: "tools",
		},
		{
			id: "scan",
			label: t("app.menu.scan"),
			href: `${basePath}/scan`,
			icon: ScanSearchIcon,
			isActive: pathname.startsWith(`${basePath}/scan`),
			hidden: !hasOrg,
			section: "tools",
		},
		{
			id: "assistant",
			label: t("app.menu.assistant"),
			href: "#",
			icon: BotIcon,
			isActive: false,
			hidden: !hasOrg,
			section: "tools",
		},
		// ─── BOTTOM ───
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
	const toolItems = menuItems.filter(
		(i) => i.section === "tools" && !i.hidden,
	);
	const bottomItems = menuItems.filter(
		(i) => i.section === "bottom" && !i.hidden,
	);

	// Greeting subtitle
	const greetingSubtitle = navData
		? navData.maturityScore > 0
			? `Risk score: ${navData.maturityScore} · ${navData.criticalRiskCount > 0 ? `${navData.criticalRiskCount} requieren atención` : "Todo bajo control"}`
			: "Comienza configurando tu primer cliente"
		: "";

	const renderNavItem = (item: NavItem) => {
		const linkContent = (
			<Link
				href={item.href}
				className={cn(
					"relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
					"group/navitem",
					item.isActive
						? "bg-stone-800 text-stone-50 font-medium border-l-2 border-blue-600"
						: "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200 border-l-2 border-transparent",
					isCollapsedEffective &&
						useSidebarLayout &&
						"justify-center px-2",
				)}
			>
				<item.icon
					className={cn(
						"size-4 shrink-0",
						item.isActive
							? "text-stone-50"
							: "text-stone-500",
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
						<span className="flex size-5 items-center justify-center rounded bg-stone-700 hover:bg-stone-600 text-stone-300">
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

	return (
		<nav
			className={cn(
				"w-full bg-stone-900 text-stone-200",
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
							<p className="text-sm font-medium text-stone-200">
								{getGreeting()},{" "}
								{user.name?.split(" ")[0] ?? ""}
							</p>
							{greetingSubtitle && (
								<p className="mt-0.5 text-[11px] text-stone-500 leading-tight">
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
							"mb-4 rounded-lg bg-stone-800/50 p-3",
							isCollapsedEffective && "flex justify-center p-2",
						)}
					>
						<RiskMaturityRing
							score={navData.maturityScore}
							size={isCollapsedEffective ? "sm" : "md"}
						/>
					</div>
				)}

				{/* Main nav items */}
				<TooltipProvider delayDuration={0}>
					<ul className="flex flex-col gap-0.5">
						{mainItems.map(renderNavItem)}
					</ul>

					{/* Tools section */}
					{toolItems.length > 0 && (
						<>
							{!isCollapsedEffective && (
								<div className="mx-3 mt-5 mb-2">
									<span className="text-[10px] font-medium uppercase tracking-wider text-stone-600">
										{t("app.menu.tools")}
									</span>
								</div>
							)}
							{isCollapsedEffective && (
								<div className="mx-auto my-3 h-px w-6 bg-stone-700" />
							)}
							<ul className="flex flex-col gap-0.5">
								{toolItems.map(renderNavItem)}
							</ul>
						</>
					)}
				</TooltipProvider>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Bottom section: Settings + User */}
				<div className="mt-4 flex flex-col gap-1">
					<TooltipProvider delayDuration={0}>
						<ul className="flex flex-col gap-0.5">
							{bottomItems.map(renderNavItem)}
						</ul>
					</TooltipProvider>

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
								className="text-stone-500 hover:text-stone-300 hover:bg-stone-800"
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
