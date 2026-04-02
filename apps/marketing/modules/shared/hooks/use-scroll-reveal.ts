"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
}

/**
 * Hook that returns a ref and an `inView` boolean.
 * When the element enters the viewport, `inView` becomes true.
 * If `once` is true (default), it stays true forever.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
	threshold = 0.15,
	rootMargin = "0px 0px -60px 0px",
	once = true,
}: UseScrollRevealOptions = {}) {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);

	const handleIntersect = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					setInView(true);
					if (once && ref.current) {
						observer?.unobserve(ref.current);
					}
				} else if (!once) {
					setInView(false);
				}
			}
		},
		[once],
	);

	let observer: IntersectionObserver | undefined;

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		observer = new IntersectionObserver(handleIntersect, {
			threshold,
			rootMargin,
		});
		observer.observe(node);

		return () => {
			observer?.disconnect();
		};
	}, [threshold, rootMargin, handleIntersect]);

	return { ref, inView };
}
