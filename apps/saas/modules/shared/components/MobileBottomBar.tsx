"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { config as authConfig } from "@repo/auth/config";
import { cn } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { useNavData } from "@shared/hooks/use-nav-data";
import {
	BarChart3Icon,
	BotIcon,
	ClipboardListIcon,
	FileTextIcon,
	FolderOpenIcon,
	GraduationCapIcon,
	LayoutDashboardIcon,
	MicIcon,
	MoreHorizontalIcon,
	ScanSearchIcon,
	SettingsIcon,
	ShieldAlertIcon,
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
	const { activeOrganization } = useActiveOrganization();
	const { data: navData } = useNavData();

	const hasOrg = authConfig.organizations.enable && !!activeOrganization;
	if (!hasOrg) return null;

	const basePath = `/${activeOrganization!.slug}`;

	const primaryTabs: MobileTab[] = [
		{
			label: t("app.menu.scan"),
			href: `${basePath}/scan`,
			icon: ScanSearchIcon,
			isActive: pathname.startsWith(`${basePath}/scan`),
		},
		{
			label: t("app.menu.processes"),
			href: `${basePath}/processes`,
			icon: WorkflowIcon,
			isActive: pathname.startsWith(`${basePath}/processes`),
		},
		{
			label: t("app.menu.risks"),
			href: `${basePath}/risks`,
			icon: ShieldAlertIcon,
			isActive: pathname.startsWith(`${basePath}/risks`),
			dotColor:
				navData && navData.criticalRiskCount > 0 ? "red" : null,
		},
		{
			label: t("app.menu.dashboard"),
			href: basePath,
			icon: LayoutDashboardIcon,
			isActive: pathname === basePath,
		},
	];

	const moreItems = [
		{
			label: t("app.menu.procedures"),
			href: `${basePath}/procedures`,
			icon: ClipboardListIcon,
		},
		{
			label: t("app.menu.evaluaciones"),
			href: `${basePath}/evaluaciones`,
			icon: GraduationCapIcon,
		},
		{
			label: t("app.menu.sessions"),
			href: `${basePath}/sessions`,
			icon: MicIcon,
		},
		{
			label: t("app.menu.evaluation"),
			href: `${basePath}/evaluation`,
			icon: BarChart3Icon,
		},
		{
			label: t("app.menu.deliverables"),
			href: `${basePath}/deliverables`,
			icon: FileTextIcon,
		},
		{
			label: t("app.menu.documents"),
			href: `${basePath}/documents`,
			icon: FolderOpenIcon,
		},
		{
			label: t("app.menu.assistant"),
			href: "#",
			icon: BotIcon,
		},
		{
			label: t("app.menu.organizationSettings"),
			href: `${basePath}/settings`,
			icon: SettingsIcon,
		},
	];

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900 md:hidden">
			<div className="flex items-center justify-around px-2 py-1">
				{primaryTabs.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={cn(
							"relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
							tab.isActive
								? "text-[#00E5C0] font-medium"
								: "text-slate-500",
						)}
					>
						<tab.icon className="size-5" />
						<span>{tab.label}</span>
						{tab.dotColor && (
							<span
								className={cn(
									"absolute top-1.5 right-1/4 size-1.5 rounded-full",
									tab.dotColor === "red" &&
										"bg-red-500",
									tab.dotColor === "green" &&
										"bg-[#16A34A]",
									tab.dotColor === "amber" &&
										"bg-amber-500",
									tab.pulse && "animate-pulse",
								)}
							/>
						)}
					</Link>
				))}

				{/* More button */}
				<Sheet>
					<SheetTrigger asChild>
						<button
							type="button"
							className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-slate-500"
						>
							<MoreHorizontalIcon className="size-5" />
							<span>{t("app.menu.tools")}</span>
						</button>
					</SheetTrigger>
					<SheetContent
						side="bottom"
						className="bg-slate-900 border-slate-800"
					>
						<SheetHeader>
							<SheetTitle className="text-slate-200">
								{t("app.menu.tools")}
							</SheetTitle>
						</SheetHeader>
						<div className="grid grid-cols-3 gap-4 py-6">
							{moreItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="flex flex-col items-center gap-2 rounded-lg p-3 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
								>
									<item.icon className="size-6" />
									<span className="text-xs text-center">
										{item.label}
									</span>
								</Link>
							))}
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}
