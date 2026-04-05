"use client";

import { useTranslations } from "next-intl";
import { scoreStroke } from "@evaluaciones/lib/score-utils";

interface HeroScoreCardProps {
  score: number;
}

export function HeroScoreCard({ score }: HeroScoreCardProps) {
  const t = useTranslations("evaluaciones.dashboard");
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const dashOffset = circumference - (progress / 100) * circumference;
  const stroke = scoreStroke(score);

  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card p-8">
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        className="-rotate-90"
        role="img"
        aria-label={`${t("humanRiskScore")}: ${score}/100`}
      >
        <title>{`${t("humanRiskScore")}: ${score}/100`}</title>
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted"
        />
        {/* Progress — dynamic stroke color based on score */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="relative -mt-[118px] mb-[46px] flex flex-col items-center">
        <span
          className="text-5xl font-semibold tabular-nums"
          style={{ color: stroke }}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("humanRiskScore")}
      </p>
    </div>
  );
}
