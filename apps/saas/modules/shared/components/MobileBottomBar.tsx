"use client";

import { useSession } from "@auth/hooks/use-session";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { useUnreadCount } from "@notifications/hooks/use-unread-count";
import { config } from "@config";
import { config as authConfig } from "@repo/auth/config";
import { authClient } from "@repo/auth/client";
import { cn } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { UserAvatar } from "@shared/components/UserAvatar";
import { useNavData } from "@shared/hooks/use-nav-data";
import {
	BellIcon,
	CompassIcon,
	CreditCardIcon,
	GraduationCapIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MoreHorizontalIcon,
	SettingsIcon,
	UserIcon,
	UsersIcon,
	WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ElementType } from "react";

interface MobileTab {
	label: string;
	href: string;
	icon: ElementType;
	isActive: boolean;
	dotColor?: "red" | "green" | "amber" | null;
	pulse?: boolean;
}

export function MobileBottomBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { data: navData } = useNavData();

	const hasOrg = authConfig.organizations.enable && !!activeOrganization;
	if (!hasOrg) return null;

	const basePath = `/${activeOrganization!.slug}`;
	const organizationId = activeOrganization!.id;

	const primaryTabs: MobileTab[] = [
		{
			label: t("app.menu.discover"),
			href: `${basePath}/descubrir`,
			icon: CompassIcon,
			isActive: pathname.startsWith(`${basePath}/descubrir`) || pathname.startsWith(`${basePath}/sessions`) || pathname.startsWith(`${basePath}/session/`),
		},
		{
			label: t("app.menu.processes"),
			href: `${basePath}/procesos`,
			icon: WorkflowIcon,
			isActive: pathname.startsWith(`${basePath}/processes`) || pathname.startsWith(`${basePath}/procesos`) || pathname.startsWith(`${basePath}/procedures`),
		},
		{
			label: t("app.menu.evaluaciones"),
			href: `${basePath}/evaluaciones`,
			icon: GraduationCapIcon,
			isActive: pathname.startsWith(`${basePath}/evaluaciones`),
		},
		{
			label: t("app.menu.dashboard"),
			href: basePath,
			icon: LayoutDashboardIcon,
			isActive: pathname === basePath || pathname === `${basePath}/panorama`,
		},
	];

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	return (
		<div
			className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
			style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}
		>
			<div className="flex items-center justify-around px-1">
				{primaryTabs.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] min-h-[56px] min-w-[48px] justify-center transition-colors active:scale-95",
							tab.isActive
								? "text-primary font-medium"
								: "text-muted-foreground",
						)}
					>
						<tab.icon className="size-5" />
						<span className="truncate max-w-[64px]">{tab.label}</span>
						{tab.dotColor && (
							<span
								className={cn(
									"absolute top-1.5 right-1/4 size-2 rounded-full",
									tab.dotColor === "red" &&
										"bg-red-500",
									tab.dotColor === "green" &&
										"bg-emerald-500",
									tab.dotColor === "amber" &&
										"bg-amber-500",
									tab.pulse && "animate-pulse",
								)}
							/>
						)}
					</Link>
				))}

				{/* More button with bottom sheet */}
				<Sheet>
					<SheetTrigger asChild>
						<button
							type="button"
							className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground min-h-[56px] min-w-[48px] justify-center active:scale-95 transition-transform"
						>
							<MoreHorizontalIcon className="size-5" />
							<span>{t("app.menu.more")}</span>
						</button>
					</SheetTrigger>
					<SheetContent
						side="bottom"
						className="bg-background border-border rounded-t-2xl"
					>
						<SheetHeader>
							<SheetTitle>
								{t("app.menu.more")}
							</SheetTitle>
						</SheetHeader>

						{/* User info header */}
						{user && (
							<div className="flex items-center gap-3 px-2 py-4 border-b border-border">
								<UserAvatar
									name={user.name ?? ""}
									avatarUrl={user.image}
									className="size-12"
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-foreground truncate">
										{user.name}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{user.email}
									</p>
								</div>
							</div>
						)}

						{/* Menu items */}
						<div className="flex flex-col py-2">
							{/* Notifications */}
							<MoreSheetNotificationItem organizationId={organizationId} />

							{/* Account Settings */}
							<Link
								href="/settings/general"
								className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground min-h-[48px] active:bg-accent/80"
							>
								<UserIcon className="size-5 shrink-0" />
								<span>{t("app.userMenu.accountSettings")}</span>
							</Link>

							{/* Organization Settings */}
							<Link
								href={`${basePath}/settings`}
								className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground min-h-[48px] active:bg-accent/80"
							>
								<SettingsIcon className="size-5 shrink-0" />
								<span>{t("app.menu.organizationSettings")}</span>
							</Link>

							{/* Members */}
							<Link
								href={`${basePath}/settings/members`}
								className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground min-h-[48px] active:bg-accent/80"
							>
						<UsersIcon className="size-5 shrink-0" />
						<span>{t("app.menu.members")}</span>
							</Link>

							{/* Billing */}
							<Link
								href={`${basePath}/settings/billing`}
								className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground min-h-[48px] active:bg-accent/80"
							>
								<CreditCardIcon className="size-5 shrink-0" />
								<span>{t("app.menu.billing")}</span>
							</Link>

							{/* Divider */}
							<div className="my-2 border-t border-border" />

							{/* Sign Out */}
							<button
								type="button"
								onClick={onLogout}
								className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-destructive hover:bg-destructive/10 min-h-[48px] w-full text-left active:bg-destructive/20"
							>
								<LogOutIcon className="size-5 shrink-0" />
								<span>{t("app.userMenu.logout")}</span>
							</button>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}

/**
 * Extracted notification item so it can use the useUnreadCount hook
 * without conditionally calling hooks in the parent.
 */
function MoreSheetNotificationItem({ organizationId }: { organizationId: string }) {
	const t = useTranslations();
	const { data } = useUnreadCount(organizationId);
	const unreadCount = data?.count ?? 0;

	return (
		<Link
			href={`/notifications`}
			className="relative flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground min-h-[48px] active:bg-accent/80"
		>
			<div className="relative">
				<BellIcon className="size-5 shrink-0" />
				{unreadCount > 0 && (
					<span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-primary" />
				)}
			</div>
			<span>{t("app.menu.notifications")}</span>
			{unreadCount > 0 && (
				<span className="ml-auto flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
					{unreadCount > 9 ? "9+" : unreadCount}
				</span>
			)}
		</Link>
	);
}
