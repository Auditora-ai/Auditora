"use client";

import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
	end: number;
	duration?: number;
	decimals?: number;
	suffix?: string;
}

/**
 * Animated counter that counts from 0 to `end` when `active` becomes true.
 */
export function useCountUp({
	end,
	duration = 2000,
	decimals = 0,
	suffix = "",
}: UseCountUpOptions) {
	const [value, setValue] = useState(0);
	const frameRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	useEffect(() => {
		// Reset when active changes
		startTimeRef.current = 0;
		setValue(0);

		const animate = (timestamp: number) => {
			if (!startTimeRef.current) {
				startTimeRef.current = timestamp;
			}

			const elapsed = timestamp - startTimeRef.current;
			const progress = Math.min(elapsed / duration, 1);

			// Ease out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = eased * end;

			setValue(Number(current.toFixed(decimals)));

			if (progress < 1) {
				frameRef.current = requestAnimationFrame(animate);
			}
		};

		frameRef.current = requestAnimationFrame(animate);

		return () => {
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}
		};
	}, [end, duration, decimals]);

	return `${value}${suffix}`;
}
