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

	// Dynamic stroke color computed from score — must remain as inline style
	const strokeColor =
		pct >= 80
			? "var(--success, oklch(0.723 0.219 149.579))"
			: pct >= 40
				? "var(--amber-500, oklch(0.769 0.188 70.08))"
				: "var(--destructive, oklch(0.577 0.245 27.325))";

	return (
		<div
			className="relative flex items-center gap-2"
			title={`Proceso ${pct}% completo`}
			role="meter"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={`Salud del proceso: ${pct}%`}
		>
			<svg width={size} height={size} className="-rotate-90" aria-hidden="true">
				{/* Track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					className="stroke-border"
					strokeWidth={3}
				/>
				{/* Progress */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					style={{ stroke: strokeColor }}
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
