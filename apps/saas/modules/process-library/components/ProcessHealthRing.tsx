"use client";

interface ProcessHealthRingProps {
	score: number;
	size?: number;
}

export function ProcessHealthRing({
	score,
	size = 36,
}: ProcessHealthRingProps) {
	const radius = (size - 4) / 2;
	const circumference = 2 * Math.PI * radius;
	const pct = Math.round(Math.max(0, Math.min(100, score)));
	const offset = circumference - (pct / 100) * circumference;

	// Semantic color based on score
	const strokeColor =
		pct >= 80 ? "#16A34A" : pct >= 40 ? "#D97706" : "#DC2626";

	return (
		<div
			className="relative flex items-center gap-2"
			title={`Proceso ${pct}% completo`}
		>
			<svg width={size} height={size} className="-rotate-90">
				{/* Track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#E2E8F0"
					strokeWidth={3}
				/>
				{/* Progress */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={strokeColor}
					strokeWidth={3}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					className="transition-all duration-500 ease-out"
				/>
			</svg>
			<span className="text-sm font-semibold tabular-nums text-foreground">
				{pct}%
			</span>
		</div>
	);
}
