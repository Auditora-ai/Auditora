/**
 * Live Session Layout — Fullscreen override
 *
 * This layout removes the app shell (sidebar, navbar, container padding)
 * so the live session view occupies 100% of the viewport.
 * The NavBar and sidebar are hidden via CSS when this layout is active.
 */
"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";

export default function LiveSessionLayout({ children }: PropsWithChildren) {
	// Hide the app shell (NavBar, sidebar, container) when live session is active
	useEffect(() => {
		document.body.classList.add("live-session-active");
		return () => {
			document.body.classList.remove("live-session-active");
		};
	}, []);

	return <>{children}</>;
}
