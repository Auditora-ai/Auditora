"use client";

import { useEffect, useRef, useState } from "react";
import {
	useMotionValue,
	useTransform,
	animate,
	motion,
	useInView,
} from "framer-motion";

interface AnimatedCounterProps {
	/** Target number to count up to */
	target: number;
	/** Text after the number (e.g. "%", "+", "x") */
	suffix?: string;
	/** Text before the number (e.g. "$") */
	prefix?: string;
	/** Duration in seconds */
	duration?: number;
	/** Number of decimal places */
	decimals?: number;
	/** Custom class name for the number span */
	className?: string;
}

/**
 * Reusable animated counter that counts up when scrolled into view.
 * Uses framer-motion for smooth 60fps animation with easing.
 * Respects prefers-reduced-motion.
 *
 * @example
 * <AnimatedCounter target={73} suffix="%" />
 * <AnimatedCounter target={4.9} prefix="$" decimals={1} />
 */
export function AnimatedCounter({
	target,
	suffix = "",
	prefix = "",
	duration = 2,
	decimals = 0,
	className,
}: AnimatedCounterProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-80px" });
	const [display, setDisplay] = useState(0);
	const motionVal = useMotionValue(0);
	const rounded = useTransform(motionVal, (v) =>
		decimals > 0 ? Number.parseFloat(v.toFixed(decimals)) : Math.round(v),
	);

	useEffect(() => {
		if (!isInView) return;

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReduced) {
			setDisplay(target);
			return;
		}

		const unsubscribe = rounded.on("change", (v) => setDisplay(v));
		const controls = animate(motionVal, target, {
			duration,
			ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
		});

		return () => {
			unsubscribe();
			controls.stop();
		};
	}, [isInView, target, duration, decimals, motionVal, rounded]);

	return (
		<span ref={ref} className={className}>
			{prefix}
			<motion.span>{display}</motion.span>
			{suffix}
		</span>
	);
}
