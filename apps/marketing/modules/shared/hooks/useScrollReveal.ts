"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(
	containerRef: RefObject<HTMLElement | null>,
	selector = ".reveal",
	options: { y?: number; duration?: number; stagger?: number; delay?: number } = {},
) {
	const { y = 40, duration = 0.8, stagger = 0.15, delay = 0 } = options;

	useGSAP(
		() => {
			if (!containerRef.current) return;

			const elements = containerRef.current.querySelectorAll(selector);
			if (elements.length === 0) return;

			gsap.set(elements, { opacity: 0, y });

			gsap.to(elements, {
				opacity: 1,
				y: 0,
				duration,
				stagger,
				delay,
				ease: "power2.out",
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top 85%",
					once: true,
				},
			});
		},
		{ scope: containerRef },
	);
}
