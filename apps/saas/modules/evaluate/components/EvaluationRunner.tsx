"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  ClockIcon,
  TargetIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { EvaluationScenario } from "@evaluate/data/mock-evaluation";
import { useEvaluation } from "@evaluate/hooks/use-evaluation";

// ─── Score Ring SVG ──────────────────────────────────────────
function ScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
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
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score ring */}
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
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
interface EvaluationRunnerProps {
  evaluationName: string;
  roleBadge: string;
  scenarios: readonly EvaluationScenario[];
}

export function EvaluationRunner({
  evaluationName,
  roleBadge,
  scenarios,
}: EvaluationRunnerProps) {
  const {
    state,
    currentScenario,
    progressPercent,
    start,
    selectOption,
    nextScenario,
    reset,
  } = useEvaluation(scenarios);

  const estimatedMinutes = useMemo(
    () => Math.max(5, Math.round(scenarios.length * 1.5)),
    [scenarios.length],
  );

  // ─── Gap list for results ─────────────────────────────────
  const gaps = useMemo(() => {
    return state.answers
      .filter((a) => !a.isCorrect)
      .map((a) => {
        const sc = scenarios.find((s) => s.id === a.scenarioId);
        return sc
          ? {
              description: `Fallaste en ${sc.linkedStepName}`,
              linkedSteps: `paso ${sc.linkedStep}`,
            }
          : null;
      })
      .filter(Boolean);
  }, [state.answers, scenarios]);

  // Last answer feedback
  const lastAnswer = state.answers[state.answers.length - 1] ?? null;

  // ─── WELCOME SCREEN ────────────────────────────────────────
  if (state.phase === "welcome") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center">
          {/* Icon */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--palette-action, #3B8FE8)" }}
          >
            <TargetIcon className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">{evaluationName}</h1>

          <span
            className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: "var(--palette-action, #3B8FE8)" }}
          >
            {roleBadge}
          </span>

          <div className="mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClipboardIcon className="h-4 w-4" />
              {scenarios.length} escenarios
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              ~{estimatedMinutes} min
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Se te presentaran situaciones reales del proceso. Elige la mejor
            accion segun el procedimiento establecido.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={start}
            className="mt-8 w-full rounded-xl text-base font-semibold"
            style={{ backgroundColor: "var(--palette-action, #3B8FE8)" }}
          >
            <PlayIcon className="mr-2 h-5 w-5" />
            Iniciar
          </Button>
        </div>
      </div>
    );
  }

  // ─── SCENARIO SCREEN ───────────────────────────────────────
  if (state.phase === "scenario" && currentScenario) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        {/* Progress bar */}
        <div className="sticky top-0 z-10 w-full bg-background">
          <div className="h-[3px] w-full bg-muted">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--palette-action, #3B8FE8)",
              }}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted-foreground">
              Escenario {state.currentIndex + 1} de {state.totalCount}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-4 pb-8 pt-2 md:px-6">
          <div className="mx-auto w-full max-w-lg">
            {/* Context */}
            <div className="mb-6 rounded-xl border border-border/50 bg-card p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {currentScenario.context}
              </p>
            </div>

            {/* Question */}
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {currentScenario.question}
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentScenario.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => selectOption(option.label)}
                  className={cn(
                    "flex min-h-[56px] w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all active:scale-[0.98]",
                    "border-border/50 hover:border-[var(--palette-action,#3B8FE8)] hover:shadow-sm",
                  )}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: "var(--palette-action, #3B8FE8)",
                      color: "white",
                    }}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground pt-0.5">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FEEDBACK SCREEN ───────────────────────────────────────
  if (state.phase === "feedback" && currentScenario && lastAnswer) {
    const isCorrect = lastAnswer.isCorrect;

    return (
      <div className="flex min-h-[100dvh] flex-col">
        {/* Progress bar */}
        <div className="sticky top-0 z-10 w-full bg-background">
          <div className="h-[3px] w-full bg-muted">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--palette-action, #3B8FE8)",
              }}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6 md:px-6">
          <div className="mx-auto w-full max-w-lg text-center">
            {/* Icon */}
            {isCorrect ? (
              <CheckCircle2Icon
                className="mx-auto h-16 w-16"
                style={{ color: "var(--palette-success, #16A34A)" }}
              />
            ) : (
              <XCircleIcon
                className="mx-auto h-16 w-16"
                style={{ color: "var(--palette-destructive, #DC2626)" }}
              />
            )}

            <h2 className="mt-4 text-xl font-bold text-foreground">
              {isCorrect ? "¡Correcto!" : "Incorrecto"}
            </h2>

            {/* Correct answer */}
            <p className="mt-3 text-sm text-muted-foreground">
              Segun el procedimiento, la respuesta correcta es{" "}
              <span className="font-semibold text-foreground">
                {currentScenario.correctAnswer}
              </span>
            </p>

            {/* Explanation */}
            <div
              className="mt-4 rounded-xl border-l-4 bg-card p-4 text-left"
              style={{
                borderLeftColor: isCorrect
                  ? "var(--palette-success, #16A34A)"
                  : "var(--palette-orientation, #D97706)",
              }}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Paso {currentScenario.linkedStep}: {currentScenario.linkedStepName}
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {currentScenario.explanation}
              </p>
            </div>

            {/* Next button */}
            <Button
              variant="primary"
              size="lg"
              onClick={nextScenario}
              className="mt-8 w-full rounded-xl text-base font-semibold"
              style={{ backgroundColor: "var(--palette-action, #3B8FE8)" }}
            >
              {state.currentIndex + 1 >= state.totalCount ? "Ver resultados" : "Siguiente"}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ────────────────────────────────────────
  if (state.phase === "results") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-lg">
          {/* Score ring */}
          <div className="flex flex-col items-center">
            <ScoreRing score={state.score} />

            <p className="mt-4 text-lg font-semibold text-foreground">
              {state.correctCount}/{state.totalCount} correctas
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {state.score >= 75
                ? "¡Excelente dominio del procedimiento!"
                : state.score >= 50
                  ? "Buen conocimiento, pero hay areas de mejora."
                  : "Se requiere refuerzo en varios pasos del proceso."}
            </p>
          </div>

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Areas de mejora
              </h3>
              <div className="flex flex-col gap-2">
                {gaps.map((gap, idx) =>
                  gap ? (
                    <div
                      key={idx}
                      className="rounded-xl border-l-4 bg-card p-3"
                      style={{ borderLeftColor: "var(--palette-orientation, #D97706)" }}
                    >
                      <p className="text-sm text-foreground">{gap.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ({gap.linkedSteps})
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Supervisor notification */}
          <div className="mt-8 rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Tu resultado fue enviado a tu supervisor
            </p>
          </div>

          {/* Retry */}
          <Button
            variant="outline"
            size="lg"
            onClick={reset}
            className="mt-6 w-full rounded-xl"
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" />
            Reintentar evaluacion
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Small helper icon (clipboard) ───────────────────────────
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
