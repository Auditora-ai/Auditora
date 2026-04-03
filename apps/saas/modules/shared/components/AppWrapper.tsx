"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { useEffect, useState, type PropsWithChildren } from "react";
import { SidebarProvider, useSidebar } from "../lib/sidebar-context";
import { CommandPalette } from "./CommandPalette";
import { MobileBottomBar } from "./MobileBottomBar";
import { MobileHeader } from "./MobileHeader";
import { NavBar } from "./NavBar";

function AppContent({ children }: PropsWithChildren) {
	const { isCollapsed } = useSidebar();
	const { useSidebarLayout } = config;
	const [isLiveSession, setIsLiveSession] = useState(false);

	// Detect live-session-active class on body
	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsLiveSession(document.body.classList.contains("live-session-active"));
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
		setIsLiveSession(document.body.classList.contains("live-session-active"));
		return () => observer.disconnect();
	}, []);

	// Live session mode: no navbar, no sidebar offset, no padding
	if (isLiveSession) {
		return (
			<div className="bg-background">
				<div className="flex min-h-screen">
					<main className="w-full bg-background">
						<div className="h-full">{children}</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background">
			<NavBar />
			<CommandPalette />
			<MobileBottomBar />
			<div
				className={cn("flex min-h-screen", {
					"md:ml-[280px]": useSidebarLayout && !isCollapsed,
					"md:ml-[72px]": useSidebarLayout && isCollapsed,
				})}
			>
			<main
				className={cn(
					"bg-background w-full border-t md:border-t-0 md:border-l",
					// Bottom padding: account for mobile bottom bar + safe area
					"pb-[calc(var(--mobile-bottom-bar-height)+var(--safe-area-inset-bottom)+1rem)] md:pb-4",
				)}
			>
				<MobileHeader />
				<div className="h-full px-3 py-3 md:container md:py-4">{children}</div>
			</main>
			</div>
		</div>
	);
}

export function AppWrapper({ children }: PropsWithChildren) {
	return (
		<SidebarProvider>
			<AppContent>{children}</AppContent>
		</SidebarProvider>
	);
}
