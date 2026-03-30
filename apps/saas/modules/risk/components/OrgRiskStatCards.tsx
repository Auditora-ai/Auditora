"use client";

import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  avgScore: number;
  opportunities: number;
}

interface OrgRiskStatCardsProps {
  stats: RiskStats;
}

// ─── Component ──────────────────────────────────────────────────────────────

const cards = [
  {
    key: "total" as const,
    label: "Total Riesgos",
    icon: ShieldAlertIcon,
    color: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  {
    key: "critical" as const,
    label: "Críticos",
    icon: AlertTriangleIcon,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    key: "high" as const,
    label: "Altos",
    icon: TrendingUpIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    key: "avgScore" as const,
    label: "Score Promedio",
    icon: TargetIcon,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    key: "opportunities" as const,
    label: "Oportunidades",
    icon: SparklesIcon,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
];

export function OrgRiskStatCards({ stats }: OrgRiskStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <div
            key={card.key}
            className={`rounded-xl border ${card.border} ${card.bg} p-4`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${card.color}`}>
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
