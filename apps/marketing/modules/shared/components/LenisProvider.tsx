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
			smoothWheel: true,
			lerp: 0.08,
			duration: 1.2,
		});
		lenisRef.current = lenis;

		// Sync Lenis scroll position with GSAP ScrollTrigger
		lenis.on("scroll", ScrollTrigger.update);

		// Drive Lenis from GSAP's ticker for frame-perfect sync
		gsap.ticker.add((time) => {
			lenis.raf(time * 1000);
		});
		gsap.ticker.lagSmoothing(0);

		return () => {
			gsap.ticker.remove(lenis.raf);
			lenis.destroy();
			lenisRef.current = null;
		};
	}, []);

	return <>{children}</>;
}
