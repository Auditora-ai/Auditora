"use client";

import { scoreStroke } from "@evaluaciones/lib/score-utils";

interface HeroScoreCardProps {
  score: number;
}

export function HeroScoreCard({ score }: HeroScoreCardProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const dashOffset = circumference - (progress / 100) * circumference;
  const stroke = scoreStroke(score);

  return (
    <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-900 p-8">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-800"
        />
        {/* Progress */}
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
          className="text-5xl font-semibold"
          style={{ color: stroke, fontVariantNumeric: "tabular-nums" }}
        >
          {score}
        </span>
        <span className="text-sm text-slate-500">/100</span>
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Puntaje de Riesgo Humano
      </p>
    </div>
  );
}
