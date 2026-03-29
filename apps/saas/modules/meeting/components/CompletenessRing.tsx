"use client";

interface CompletenessRingProps {
	score: number | null;
	size?: number;
}

export function CompletenessRing({ score, size = 24 }: CompletenessRingProps) {
	const radius = (size - 4) / 2;
	const circumference = 2 * Math.PI * radius;
	const pct = score ?? 0;
	const offset = circumference - (pct / 100) * circumference;

	return (
		<div className="relative flex items-center gap-1.5" title={`Completeness: ${pct}%`}>
			<svg width={size} height={size} className="-rotate-90">
				{/* Track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#334155"
					strokeWidth={2.5}
				/>
				{/* Progress */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#2563EB"
					strokeWidth={2.5}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					className="transition-all duration-500 ease-out"
				/>
			</svg>
			<span className="text-[10px] font-medium text-chrome-text-secondary tabular-nums">
				{pct}%
			</span>
		</div>
	);
}
