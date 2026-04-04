"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll + GSAP ScrollTrigger sync.
 * Re-initializes on route/locale changes.
 * Properly cleans up ticker callbacks to prevent stacking.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
	const lenisRef = useRef<Lenis | null>(null);
	const pathname = usePathname();

	useEffect(() => {
		// Kill any stale ScrollTriggers from previous locale
		ScrollTrigger.getAll().forEach((st) => st.kill());

		const lenis = new Lenis({
			duration: 1.2,
			easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
		});

		lenisRef.current = lenis;

		// Sync Lenis scroll → ScrollTrigger
		lenis.on("scroll", ScrollTrigger.update);

		// Single ticker callback — must be named so we can remove it
		const tickerFn = (time: number) => {
			lenis.raf(time * 1000);
		};
		gsap.ticker.add(tickerFn);
		gsap.ticker.lagSmoothing(0);

		// After DOM settles, refresh ScrollTrigger positions
		const refreshTimer = setTimeout(() => {
			ScrollTrigger.refresh();
		}, 500);

		return () => {
			clearTimeout(refreshTimer);
			gsap.ticker.remove(tickerFn);
			lenis.destroy();
			lenisRef.current = null;
		};
	}, [pathname]); // Re-init on route change (locale switch)

	return <>{children}</>;
}
