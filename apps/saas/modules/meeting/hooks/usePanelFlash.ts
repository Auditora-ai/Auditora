"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared hook for panel glow/pulse effects.
 * Returns an inline style object to apply to the panel container.
 *
 * @param trigger - Derived boolean, e.g. `nodes.length > prevNodeCount`
 * @param options.color - CSS color for box-shadow glow (e.g. "rgba(37, 99, 235, 0.4)")
 * @param options.debounceMs - Min interval between flashes (default: 10000ms)
 */
export function usePanelFlash(
	trigger: boolean,
	options: { color: string; debounceMs?: number },
): React.CSSProperties {
	const { color, debounceMs = 10_000 } = options;
	const [isFlashing, setIsFlashing] = useState(false);
	const lastFlashRef = useRef(0);

	useEffect(() => {
		if (!trigger) return;

		const now = Date.now();
		if (now - lastFlashRef.current < debounceMs) return;

		lastFlashRef.current = now;
		setIsFlashing(true);

		const timer = setTimeout(() => setIsFlashing(false), 600);
		return () => clearTimeout(timer);
	}, [trigger, debounceMs]);

	if (!isFlashing) {
		return { transition: "box-shadow 300ms ease-out" };
	}

	return {
		boxShadow: `inset 0 0 12px ${color}, 0 0 8px ${color}`,
		transition: "box-shadow 300ms ease-in",
	};
}
