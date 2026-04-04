"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll provider using Lenis, synced with GSAP ScrollTrigger.
 *
 * KEY: Lenis.on("scroll") calls ScrollTrigger.update() so both systems
 * share the same scroll position. Without this, ScrollTrigger pins,
 * scrub timelines, and trigger positions are all broken.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
	const lenisRef = useRef<Lenis | null>(null);

	useEffect(() => {
		const lenis = new Lenis({
			duration: 1.2,
			easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
		});

		lenisRef.current = lenis;

		// ─── Connect Lenis → ScrollTrigger ───
		lenis.on("scroll", ScrollTrigger.update);

		// ─── Connect GSAP ticker → Lenis ───
		gsap.ticker.add((time) => {
			lenis.raf(time * 1000);
		});
		gsap.ticker.lagSmoothing(0);

		return () => {
			lenis.destroy();
			lenisRef.current = null;
		};
	}, []);

	return <>{children}</>;
}
