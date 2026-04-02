export function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-500";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-800";
  if (score >= 80) return "bg-emerald-950/50";
  if (score >= 60) return "bg-amber-950/50";
  return "bg-red-950/50";
}

export function scoreStroke(score: number | null): string {
  if (score === null) return "#64748b";
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

/** Inverted: low risk = good (green), high risk = bad (red) */
export function riskLevelColor(riskLevel: number | null): string {
  if (riskLevel === null) return "text-slate-500";
  if (riskLevel <= 30) return "text-emerald-400";
  if (riskLevel <= 60) return "text-amber-400";
  return "text-red-400";
}

export function riskLevelBg(riskLevel: number | null): string {
  if (riskLevel === null) return "bg-slate-800";
  if (riskLevel <= 30) return "bg-emerald-950/50";
  if (riskLevel <= 60) return "bg-amber-950/50";
  return "bg-red-950/50";
}
