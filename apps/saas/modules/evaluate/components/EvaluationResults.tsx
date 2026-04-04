"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircle2Icon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
} from "lucide-react";
import type {
  EvaluationResultsSummary,
  MemberResult,
  EvaluationScenario,
} from "@evaluate/data/mock-evaluation";

// ─── Score Ring (smaller version for list) ────────────────────
function ScoreRingSmall({
  score,
  size = 48,
  strokeWidth = 4,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? "var(--palette-success, #16A34A)"
      : score >= 50
        ? "var(--palette-orientation, #D97706)"
        : "var(--palette-destructive, #DC2626)";

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-xs font-bold text-foreground"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Score bar for member row ────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75
      ? "var(--palette-success, #16A34A)"
      : score >= 50
        ? "var(--palette-orientation, #D97706)"
        : "var(--palette-destructive, #DC2626)";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-semibold tabular-nums shrink-0 w-8 text-right"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  );
}

// ─── Avatar placeholder ────────────────────────────────────
function MemberAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {initials}
    </div>
  );
}

// ─── Drill-down view ──────────────────────────────────────────
function MemberDrillDown({
  result,
  scenarios,
  onBack,
}: {
  result: MemberResult;
  scenarios: readonly EvaluationScenario[];
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Volver a resultados
      </button>

      {/* Member header */}
      <div className="flex items-center gap-3">
        <MemberAvatar initials={result.member.initials} />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">{result.member.name}</p>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white mt-0.5"
            style={{ backgroundColor: "var(--palette-action, #3B8FE8)" }}
          >
            {result.member.role}
          </span>
        </div>
        <ScoreRingSmall score={result.score} />
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
        <span className="text-sm text-muted-foreground">
          {result.correctCount}/{result.totalCount} correctas
        </span>
      </div>

      {/* Answer-by-answer breakdown */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Detalle de decisiones
        </h3>
        <div className="flex flex-col gap-2">
          {result.answers.map((answer, idx) => {
            const scenario = scenarios.find((s) => s.id === answer.scenarioId);
            if (!scenario) return null;
            return (
              <div
                key={answer.scenarioId}
                className={cn(
                  "rounded-xl border p-3",
                  answer.isCorrect
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5",
                )}
              >
                <div className="flex items-start gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle2Icon
                      className="h-5 w-5 shrink-0 mt-0.5"
                      style={{ color: "var(--palette-success, #16A34A)" }}
                    />
                  ) : (
                    <XCircleIcon
                      className="h-5 w-5 shrink-0 mt-0.5"
                      style={{ color: "var(--palette-destructive, #DC2626)" }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Escenario {idx + 1} — Paso {scenario.linkedStep}
                    </p>
                    <p className="text-sm text-foreground mt-0.5 line-clamp-2">
                      {scenario.context.substring(0, 100)}...
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        Respondio: <span className="font-semibold text-foreground">{answer.selected}</span>
                      </span>
                      {!answer.isCorrect && (
                        <span className="text-muted-foreground">
                          Correcta: <span className="font-semibold" style={{ color: "var(--palette-success, #16A34A)" }}>{scenario.correctAnswer}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps */}
      {result.gaps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Brechas identificadas
          </h3>
          <div className="flex flex-col gap-2">
            {result.gaps.map((gap, idx) => (
              <div
                key={idx}
                className="rounded-xl border-l-4 bg-card p-3"
                style={{ borderLeftColor: "var(--palette-orientation, #D97706)" }}
              >
                <p className="text-sm text-foreground">{gap.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">({gap.linkedSteps})</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
interface EvaluationResultsProps {
  summary: EvaluationResultsSummary;
  scenarios: readonly EvaluationScenario[];
}

type SortMode = "worst" | "best";

export function EvaluationResults({
  summary,
  scenarios,
}: EvaluationResultsProps) {
  const [sortMode, setSortMode] = useState<SortMode>("worst");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const sortedResults = useMemo(() => {
    const items = [...summary.memberResults];
    items.sort((a, b) =>
      sortMode === "worst" ? a.score - b.score : b.score - a.score,
    );
    return items;
  }, [summary.memberResults, sortMode]);

  const toggleSort = useCallback(() => {
    setSortMode((prev) => (prev === "worst" ? "best" : "worst"));
  }, []);

  // ─── Drill-down mode ──────────────────────────────────────
  if (selectedMember) {
    const result = summary.memberResults.find(
      (r) => r.memberId === selectedMember,
    );
    if (result) {
      return (
        <div className="px-4 py-5 md:px-6 md:py-6">
          <MemberDrillDown
            result={result}
            scenarios={scenarios}
            onBack={() => setSelectedMember(null)}
          />
        </div>
      );
    }
  }

  // ─── Main results view ───────────────────────────────────
  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:gap-6 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
          Resultados: {summary.processName}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          {summary.completedCount}/{summary.totalAssigned} evaluaciones completadas
        </p>
      </div>

      {/* Team Alignment */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Alineacion del equipo
            </span>
          </div>
          <span
            className="text-xl font-bold tabular-nums"
            style={{
              color:
                summary.teamAlignment >= 75
                  ? "var(--palette-success, #16A34A)"
                  : summary.teamAlignment >= 50
                    ? "var(--palette-orientation, #D97706)"
                    : "var(--palette-destructive, #DC2626)",
            }}
          >
            {summary.teamAlignment}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${summary.teamAlignment}%`,
              backgroundColor:
                summary.teamAlignment >= 75
                  ? "var(--palette-success, #16A34A)"
                  : summary.teamAlignment >= 50
                    ? "var(--palette-orientation, #D97706)"
                    : "var(--palette-destructive, #DC2626)",
            }}
          />
        </div>
      </div>

      {/* Weakest / Strongest steps */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Weakest */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDownIcon
              className="h-4 w-4"
              style={{ color: "var(--palette-destructive, #DC2626)" }}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pasos mas debiles
            </span>
          </div>
          <ul className="space-y-1.5">
            {summary.weakestSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-foreground leading-relaxed">
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Strongest */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUpIcon
              className="h-4 w-4"
              style={{ color: "var(--palette-success, #16A34A)" }}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pasos mas fuertes
            </span>
          </div>
          <ul className="space-y-1.5">
            {summary.strongestSteps.map((step, idx) => (
              <li key={idx} className="text-xs text-foreground leading-relaxed">
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-person results */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground md:text-base">
            Resultados por persona
          </h2>
          <button
            type="button"
            onClick={toggleSort}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpDownIcon className="h-3.5 w-3.5" />
            {sortMode === "worst" ? "Peor primero" : "Mejor primero"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {sortedResults.map((result) => (
            <button
              key={result.memberId}
              type="button"
              onClick={() => setSelectedMember(result.memberId)}
              className="flex w-full flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:border-border active:scale-[0.99]"
            >
              {/* Top row: avatar + name + score ring */}
              <div className="flex items-center gap-3 w-full">
                <MemberAvatar initials={result.member.initials} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{result.member.name}</p>
                  <span className="text-[10px] text-muted-foreground">{result.member.role}</span>
                </div>
                <ScoreRingSmall score={result.score} size={44} />
              </div>

              {/* Score bar */}
              <ScoreBar score={result.score} />

              {/* Gaps preview */}
              {result.gaps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {result.gaps.slice(0, 2).map((gap, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border-l-2 bg-amber-500/5 px-2 py-1 text-[10px] text-muted-foreground leading-snug"
                      style={{ borderLeftColor: "var(--palette-orientation, #D97706)" }}
                    >
                      {gap.description}
                    </span>
                  ))}
                  {result.gaps.length > 2 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{result.gaps.length - 2} mas
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
