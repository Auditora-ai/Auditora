"use client";

import { useState, useCallback, useMemo } from "react";
import type { EvaluationScenario, RecordedAnswer } from "@evaluate/data/mock-evaluation";

export type EvaluationPhase = "welcome" | "scenario" | "feedback" | "results";

export interface EvaluationState {
  readonly phase: EvaluationPhase;
  readonly currentIndex: number;
  readonly answers: readonly RecordedAnswer[];
  readonly selectedOption: "A" | "B" | "C" | null;
  readonly score: number;
  readonly correctCount: number;
  readonly totalCount: number;
}

export interface UseEvaluationReturn {
  readonly state: EvaluationState;
  readonly currentScenario: EvaluationScenario | undefined;
  readonly progressPercent: number;
  readonly start: () => void;
  readonly selectOption: (option: "A" | "B" | "C") => void;
  readonly nextScenario: () => void;
  readonly reset: () => void;
}

export function useEvaluation(
  scenarios: readonly EvaluationScenario[],
): UseEvaluationReturn {
  const [phase, setPhase] = useState<EvaluationPhase>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<RecordedAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);

  const totalCount = scenarios.length;

  const currentScenario = useMemo(
    () => scenarios[currentIndex],
    [scenarios, currentIndex],
  );

  const correctCount = useMemo(
    () => answers.filter((a) => a.isCorrect).length,
    [answers],
  );

  const score = useMemo(
    () => (answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0),
    [correctCount, answers.length],
  );

  const progressPercent = useMemo(
    () => (totalCount > 0 ? Math.round(((currentIndex + 1) / totalCount) * 100) : 0),
    [currentIndex, totalCount],
  );

  const start = useCallback(() => {
    setPhase("scenario");
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
  }, []);

  const selectOption = useCallback(
    (option: "A" | "B" | "C") => {
      if (!currentScenario || phase !== "scenario") return;

      const isCorrect = option === currentScenario.correctAnswer;
      const answer: RecordedAnswer = {
        scenarioId: currentScenario.id,
        selected: option,
        isCorrect,
      };

      setSelectedOption(option);
      setAnswers((prev) => [...prev, answer]);
      setPhase("feedback");
    },
    [currentScenario, phase],
  );

  const nextScenario = useCallback(() => {
    setSelectedOption(null);

    if (currentIndex + 1 >= totalCount) {
      setPhase("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPhase("scenario");
    }
  }, [currentIndex, totalCount]);

  const reset = useCallback(() => {
    setPhase("welcome");
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
  }, []);

  const state: EvaluationState = useMemo(
    () => ({
      phase,
      currentIndex,
      answers,
      selectedOption,
      score,
      correctCount,
      totalCount,
    }),
    [phase, currentIndex, answers, selectedOption, score, correctCount, totalCount],
  );

  return {
    state,
    currentScenario,
    progressPercent,
    start,
    selectOption,
    nextScenario,
    reset,
  };
}
