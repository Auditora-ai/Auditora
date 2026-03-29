"use client";

import { cn } from "@repo/ui";

interface RiskMaturityRingProps {
	score: number;
	size?: "sm" | "md";
	className?: string;
}

export function RiskMaturityRing({
	score,
	size = "md",
	className,
}: RiskMaturityRingProps) {
	const isSmall = size === "sm";
	const radius = isSmall ? 16 : 28;
	const strokeWidth = isSmall ? 3 : 4;
	const svgSize = (radius + strokeWidth) * 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.min(Math.max(score, 0), 100);
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	// Color based on score
	const ringColor =
		score >= 70
			? "#16A34A" // green — good maturity
			: score >= 40
				? "#D97706" // amber — needs work
				: "#DC2626"; // red — critical

	const isEmpty = score === 0;

	return (
		<div className={cn("flex items-center gap-3", className)}>
			<svg
				width={svgSize}
				height={svgSize}
				viewBox={`0 0 ${svgSize} ${svgSize}`}
				className="shrink-0 -rotate-90"
			>
				{/* Background ring */}
				<circle
					cx={radius + strokeWidth}
					cy={radius + strokeWidth}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					className="text-stone-700"
				/>
				{/* Progress ring */}
				{!isEmpty && (
					<circle
						cx={radius + strokeWidth}
						cy={radius + strokeWidth}
						r={radius}
						fill="none"
						stroke={ringColor}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						className="transition-all duration-1000 ease-out"
					/>
				)}
			</svg>
			{!isSmall && (
				<div className="flex flex-col">
					{isEmpty ? (
						<>
							<span className="text-xs text-stone-500">—</span>
							<span className="text-[10px] text-stone-600">
								Sin datos
							</span>
						</>
					) : (
						<>
							<span
								className="text-lg font-semibold tabular-nums"
								style={{ color: ringColor }}
							>
								{score}
							</span>
							<span className="text-[10px] text-stone-500">
								Madurez de Riesgo
							</span>
						</>
					)}
				</div>
			)}
			{isSmall && !isEmpty && (
				<span
					className="text-xs font-semibold tabular-nums"
					style={{ color: ringColor }}
				>
					{score}
				</span>
			)}
		</div>
	);
}
