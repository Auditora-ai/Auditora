"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { useEffect, useState, type PropsWithChildren } from "react";
import { SidebarProvider, useSidebar } from "../lib/sidebar-context";
import { CommandPalette } from "./CommandPalette";
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
			<div
				className={cn("flex min-h-screen", {
					"md:ml-[280px]": useSidebarLayout && !isCollapsed,
					"md:ml-[80px]": useSidebarLayout && isCollapsed,
				})}
			>
				<main
					className={cn(
						"bg-background py-4 w-full border-t md:border-t-0 md:border-l",
					)}
				>
					<div className="container h-full">{children}</div>
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
