/**
 * Process Maturity Score Hero Section
 *
 * Displays a big circular maturity score (0-100) with 3 sub-scores:
 * - Completeness (from process_audit)
 * - Complexity (inverted, from complexity_score)
 * - SIPOC Coverage (from process_audit updatedScores)
 *
 * Dark chrome header with Instrument Serif display type.
 */

interface MaturityScoreProps {
	processName: string;
	orgName: string;
	date: string;
	duration: string;
	transcriptCount: number;
	nodeCount: number;
	confirmedCount: number;
	completenessScore: number | null;
	complexityScore: number | null;
	sipocCoverage: number | null;
}

function computeMaturityScore(
	completeness: number | null,
	complexity: number | null,
	sipoc: number | null,
): { score: number; partial: boolean } {
	const parts: { value: number; weight: number }[] = [];

	if (completeness != null) parts.push({ value: completeness, weight: 0.4 });
	if (complexity != null) parts.push({ value: (10 - complexity) * 10, weight: 0.3 });
	if (sipoc != null) parts.push({ value: sipoc, weight: 0.3 });

	if (parts.length === 0) return { score: 0, partial: true };

	const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
	const score = Math.round(parts.reduce((s, p) => s + (p.value * p.weight) / totalWeight, 0));
	return { score: Math.max(0, Math.min(100, score)), partial: parts.length < 3 };
}

function scoreColor(score: number): string {
	if (score >= 75) return "text-green-400";
	if (score >= 50) return "text-amber-400";
	if (score >= 25) return "text-orange-400";
	return "text-red-400";
}

function ringGradient(score: number): string {
	if (score >= 75) return "from-green-500 to-green-400";
	if (score >= 50) return "from-amber-500 to-amber-400";
	if (score >= 25) return "from-orange-500 to-orange-400";
	return "from-red-500 to-red-400";
}

export function MaturityScore({
	processName,
	orgName,
	date,
	duration,
	transcriptCount,
	nodeCount,
	confirmedCount,
	completenessScore,
	complexityScore,
	sipocCoverage,
}: MaturityScoreProps) {
	const { score, partial } = computeMaturityScore(completenessScore, complexityScore, sipocCoverage);
	const circumference = 2 * Math.PI * 54;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	return (
		<header className="bg-stone-900 border-b border-stone-800">
			<div className="mx-auto max-w-5xl px-6 py-12">
				<div className="flex items-start justify-between gap-8">
					{/* Left: process info */}
					<div className="flex-1 min-w-0">
						<p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">
							Process Intelligence Report
						</p>
						<h1
							className="text-3xl font-semibold text-stone-50 truncate"
							style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
						>
							{processName}
						</h1>
						<p className="mt-1 text-sm text-stone-400">{orgName}</p>

						<div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-400">
							<span>{date}</span>
							<span className="text-stone-700">|</span>
							<span>{duration}</span>
							<span className="text-stone-700">|</span>
							<span>{nodeCount} actividades</span>
							<span className="text-stone-700">|</span>
							<span>{confirmedCount} confirmadas</span>
							<span className="text-stone-700">|</span>
							<span>{transcriptCount} entradas de transcripcion</span>
						</div>

						{/* Sub-scores */}
						<div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
							<SubScore
								label="Completitud"
								value={completenessScore}
								suffix="%"
							/>
							<SubScore
								label="Complejidad"
								value={complexityScore}
								suffix="/10"
								invert
							/>
							<SubScore
								label="Cobertura SIPOC"
								value={sipocCoverage}
								suffix="%"
							/>
						</div>
					</div>

					{/* Right: circular score */}
					<div className="flex flex-col items-center gap-2 shrink-0">
						<div className="relative w-32 h-32">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
								{/* Background ring */}
								<circle
									cx="60" cy="60" r="54"
									fill="none"
									stroke="#292524"
									strokeWidth="8"
								/>
								{/* Score ring */}
								<circle
									cx="60" cy="60" r="54"
									fill="none"
									strokeWidth="8"
									strokeLinecap="round"
									className={`stroke-current ${scoreColor(score)}`}
									style={{
										strokeDasharray: circumference,
										strokeDashoffset,
										transition: "stroke-dashoffset 0.5s ease-out",
									}}
								/>
							</svg>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span
									className={`text-4xl font-bold ${scoreColor(score)}`}
									style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
								>
									{score}
								</span>
								<span className="text-xs text-stone-500">/ 100</span>
							</div>
						</div>
						<span className="text-xs text-stone-500 uppercase tracking-wider">
							Madurez{partial ? " (parcial)" : ""}
						</span>
					</div>
				</div>
			</div>
		</header>
	);
}

function SubScore({
	label,
	value,
	suffix,
	invert,
}: {
	label: string;
	value: number | null;
	suffix: string;
	invert?: boolean;
}) {
	const displayValue = value != null ? value : null;
	const barValue = value != null ? (invert ? ((10 - value) / 10) * 100 : value) : 0;
	const barColor =
		barValue >= 75 ? "bg-green-500" : barValue >= 50 ? "bg-amber-500" : barValue >= 25 ? "bg-orange-500" : "bg-red-500";

	return (
		<div>
			<div className="flex items-center justify-between mb-1">
				<span className="text-xs text-stone-500">{label}</span>
				<span className="text-xs font-medium text-stone-300">
					{displayValue != null ? `${displayValue}${suffix}` : "—"}
				</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-stone-800 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${barValue}%` }}
				/>
			</div>
		</div>
	);
}
