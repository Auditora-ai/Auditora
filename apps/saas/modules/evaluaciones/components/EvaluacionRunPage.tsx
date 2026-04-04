"use client";

import { useState, useCallback } from "react";
import { EvaluacionIntro } from "./EvaluacionIntro";
import { EvaluacionRunner } from "./EvaluacionRunner";
import { EvaluacionResults } from "./EvaluacionResults";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from 'next-intl';

interface DecisionOption {
  label: string;
  description: string;
}

interface DecisionItem {
  id: string;
  order: number;
  prompt: string;
  options: DecisionOption[];
  consequences: string[];
  proceduralReference: string | null;
}

interface ScoreData {
  alignment: number;
  riskLevel: number;
  criterio: number;
  overallScore: number;
  errorPatterns?: string[];
  aiFeedback?: string;
}

interface EvaluacionRunPageProps {
  decisions: DecisionItem[];
  respondEndpoint: string;
  backHref: string;
  templateTitle: string;
  narrative: string;
}

type Phase = "intro" | "running" | "evaluating" | "results";

export function EvaluacionRunPage({
  decisions,
  respondEndpoint,
  backHref,
  templateTitle,
  narrative,
}: EvaluacionRunPageProps) {
  const t = useTranslations('evaluaciones.runPage');
  const [phase, setPhase] = useState<Phase>("intro");
  const [scores, setScores] = useState<ScoreData | null>(null);

  const handleRunComplete = useCallback(
    async (basicScores: {
      alignment: number;
      riskLevel: number;
      criterio: number;
      overallScore: number;
    }) => {
      // Show evaluating phase while AI scores the run
      setPhase("evaluating");

      try {
        const res = await fetch(`${respondEndpoint}/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const aiScores = await res.json();
          setScores({
            alignment: aiScores.alignment ?? basicScores.alignment,
            riskLevel: aiScores.riskLevel ?? basicScores.riskLevel,
            criterio: aiScores.criterio ?? basicScores.criterio,
            overallScore: aiScores.overallScore ?? basicScores.overallScore,
            errorPatterns: aiScores.errorPatterns ?? [],
            aiFeedback: aiScores.feedback ?? "",
          });
        } else {
          // Fallback to basic scores
          setScores(basicScores);
        }
      } catch {
        setScores(basicScores);
      }

      setPhase("results");
    },
    [respondEndpoint],
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0A1428" }}
    >
      {phase === "intro" && (
        <EvaluacionIntro
          templateTitle={templateTitle}
          narrative={narrative}
          onStart={() => setPhase("running")}
        />
      )}

      {phase === "running" && (
        <div className="py-8">
          {/* Header */}
          <div className="mx-auto mb-8 max-w-3xl px-4">
            <p
              className="text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: "#3B8FE8" }}
            >
              {t('label')}
            </p>
            <h1
              className="mt-1 text-lg font-semibold"
              style={{ color: "#F1F5F9" }}
            >
              {templateTitle}
            </h1>
          </div>

          <EvaluacionRunner
            decisions={decisions}
            respondEndpoint={respondEndpoint}
            onComplete={handleRunComplete}
          />
        </div>
      )}

      {phase === "evaluating" && (
        <div className="flex min-h-screen flex-col items-center justify-center">
          {/* Gradient overlays */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(59,143,232,0.08), transparent 60%)",
            }}
          />

          <div className="relative z-10 text-center">
            <Loader2Icon
              className="mx-auto mb-6 h-8 w-8 animate-spin"
              style={{ color: "#3B8FE8" }}
            />
            <p
              className="text-xl font-semibold"
              style={{ color: "#F1F5F9" }}
            >
              {t('evaluatingTitle')}
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: "#64748B" }}
            >
              {t('evaluatingDescription')}
            </p>
          </div>
        </div>
      )}

      {phase === "results" && scores && (
        <div className="py-12">
          {/* Header */}
          <div className="mx-auto mb-10 max-w-2xl px-4 text-center">
            <p
              className="text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: "#3B8FE8" }}
            >
              {t('resultsLabel')}
            </p>
            <h1
              className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight"
              style={{ color: "#F1F5F9" }}
            >
              {templateTitle}
            </h1>
          </div>

          <EvaluacionResults
            scores={scores}
            errorPatterns={scores.errorPatterns}
            aiFeedback={scores.aiFeedback}
            backHref={backHref}
          />
        </div>
      )}
    </div>
  );
}
