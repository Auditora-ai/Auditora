"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function LenisProvider({ children }: { children: React.ReactNode }) {
	const lenisRef = useRef<Lenis | null>(null);

	useEffect(() => {
		const lenis = new Lenis({
			autoRaf: false,
			smoothWheel: true,
			lerp: 0.08,
			duration: 1.2,
		});
		lenisRef.current = lenis;

		// Sync Lenis scroll position with GSAP ScrollTrigger
		lenis.on("scroll", ScrollTrigger.update);

		// Drive Lenis from GSAP's ticker for frame-perfect sync
		const tickerCallback = (time: number) => {
			lenis.raf(time * 1000);
		};
		gsap.ticker.add(tickerCallback);
		gsap.ticker.lagSmoothing(0);

		// Refresh ScrollTrigger after Lenis is ready
		ScrollTrigger.refresh();

		return () => {
			gsap.ticker.remove(tickerCallback);
			lenis.destroy();
			lenisRef.current = null;
		};
	}, []);

	return <>{children}</>;
}
