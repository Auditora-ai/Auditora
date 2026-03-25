"use client";

export function StatsBar({
	sessionsThisWeek,
	processCount,
	coveragePercent,
	pendingIntake,
}: {
	sessionsThisWeek: number;
	processCount: number;
	coveragePercent: number;
	pendingIntake: number;
}) {
	const stats = [
		{ value: sessionsThisWeek, label: "Esta semana" },
		{ value: processCount, label: "Procesos" },
		{ value: `${coveragePercent}%`, label: "Cobertura" },
		{ value: pendingIntake, label: "Intake pendiente" },
	];

	return (
		<div className="mt-3 flex gap-6">
			{stats.map((stat) => (
				<div key={stat.label} className="flex items-baseline gap-1.5">
					<span className="text-sm font-bold text-[#0F172A]">{stat.value}</span>
					<span className="text-[10px] text-[#94A3B8]">{stat.label}</span>
				</div>
			))}
		</div>
	);
}
