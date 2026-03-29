"use client";

import { cn } from "@repo/ui";

interface NavBadgeProps {
	text?: string;
	dotColor?: "red" | "green" | "amber" | null;
	collapsed?: boolean;
	pulse?: boolean;
}

export function NavBadge({
	text,
	dotColor,
	collapsed,
	pulse,
}: NavBadgeProps) {
	if (!text && !dotColor) return null;

	const dotColorClass =
		dotColor === "red"
			? "bg-red-500"
			: dotColor === "green"
				? "bg-emerald-500"
				: dotColor === "amber"
					? "bg-amber-500"
					: "";

	// Collapsed mode: just show a color dot
	if (collapsed) {
		if (!dotColor) return null;
		return (
			<span
				className={cn(
					"absolute top-1 right-1 size-2 rounded-full",
					dotColorClass,
					pulse && "animate-pulse",
				)}
			/>
		);
	}

	// Expanded mode: show text badge
	return (
		<span
			className={cn(
				"ml-auto shrink-0 text-[11px] tabular-nums text-stone-500",
				dotColor === "red" && "text-red-400 font-medium",
				dotColor === "amber" && "text-amber-400",
				dotColor === "green" && "text-emerald-400",
			)}
		>
			{text}
		</span>
	);
}
