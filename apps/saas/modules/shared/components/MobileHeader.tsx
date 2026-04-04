"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { config as authConfig } from "@repo/auth/config";
import { Logo } from "@repo/ui";
import { NotificationBell } from "@notifications/components/NotificationBell";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

function useSectionTitle(): string {
	const pathname = usePathname();
	const t = useTranslations();

	if (pathname.includes("/descubrir") || pathname.includes("/sessions") || pathname.includes("/session/")) {
		return t("app.menu.discover");
	}
	if (pathname.includes("/processes") || pathname.includes("/procesos") || pathname.includes("/procedures")) {
		return t("app.menu.processes");
	}
	if (pathname.includes("/evaluaciones")) {
		return t("app.menu.evaluaciones");
	}
	if (pathname.includes("/settings")) {
		return t("app.menu.organizationSettings");
	}
	if (pathname.includes("/panorama")) {
		return t("app.menu.dashboard");
	}
	return t("app.menu.dashboard");
}

export function MobileHeader() {
	const { activeOrganization } = useActiveOrganization();
	const sectionTitle = useSectionTitle();

	const hasOrg = authConfig.organizations.enable && !!activeOrganization;
	if (!hasOrg) return null;

	return (
		<header
			className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur-sm px-3 md:hidden"
			style={{ paddingTop: "var(--safe-area-inset-top)" }}
		>
			{/* Logo — left */}
			<div className="flex items-center shrink-0">
				<Logo monogram className="text-xl" />
			</div>

			{/* Section title + Org name — center */}
			<div className="flex-1 min-w-0 px-3 text-center">
				<span className="text-sm font-semibold text-foreground truncate block">
					{sectionTitle}
				</span>
				<span className="text-[10px] text-muted-foreground truncate block">
					{activeOrganization!.name}
				</span>
			</div>

			{/* Right side: NotificationBell */}
			<div className="flex items-center shrink-0">
				<NotificationBell
					organizationId={activeOrganization!.id}
					collapsed
				/>
			</div>
		</header>
	);
}
