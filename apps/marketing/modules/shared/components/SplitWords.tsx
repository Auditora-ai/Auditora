"use client";

import type { ReactNode } from "react";

interface SplitWordsProps {
	children: string;
	className?: string;
	innerClassName?: string;
}

/**
 * Wraps each word in overflow-hidden spans for GSAP word-reveal animations.
 * The inner span (`.split-word-inner`) is the animation target.
 *
 * Usage with GSAP:
 *   gsap.from(".split-word-inner", { y: "110%", stagger: 0.06, duration: 1.0, ease: "power4.out" })
 */
export function SplitWords({
	children,
	className = "",
	innerClassName = "split-word-inner",
}: SplitWordsProps): ReactNode {
	const words = children.split(/\s+/).filter(Boolean);

	return (
		<>
			{words.map((word, i) => (
				<span
					key={`${word}-${i}`}
					className={`inline-flex overflow-hidden ${className}`}
				>
					<span className={innerClassName}>{word}</span>
					{i < words.length - 1 && (
						<span className={innerClassName}>&nbsp;</span>
					)}
				</span>
			))}
		</>
	);
}
