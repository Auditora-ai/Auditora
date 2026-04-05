export function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

export function scoreBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-destructive/10";
}

export function scoreStroke(score: number | null): string {
  if (score === null) return "hsl(var(--muted-foreground))";
  if (score >= 80) return "hsl(var(--chart-2))";
  if (score >= 60) return "hsl(var(--chart-4))";
  return "hsl(var(--chart-5))";
}

/** Inverted: low risk = good (green), high risk = bad (red) */
export function riskLevelColor(riskLevel: number | null): string {
  if (riskLevel === null) return "text-muted-foreground";
  if (riskLevel <= 30) return "text-emerald-500";
  if (riskLevel <= 60) return "text-amber-500";
  return "text-destructive";
}

export function riskLevelBg(riskLevel: number | null): string {
  if (riskLevel === null) return "bg-muted";
  if (riskLevel <= 30) return "bg-emerald-500/10";
  if (riskLevel <= 60) return "bg-amber-500/10";
  return "bg-destructive/10";
}
