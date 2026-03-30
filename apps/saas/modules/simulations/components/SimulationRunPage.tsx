"use client";

import { useState, useCallback } from "react";
import { SimulationIntro } from "./SimulationIntro";
import { SimulationRunner } from "./SimulationRunner";
import { SimulationResults } from "./SimulationResults";
import { Loader2Icon } from "lucide-react";

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

interface SimulationRunPageProps {
  decisions: DecisionItem[];
  respondEndpoint: string;
  backHref: string;
  templateTitle: string;
  narrative: string;
}

type Phase = "intro" | "running" | "evaluating" | "results";

export function SimulationRunPage({
  decisions,
  respondEndpoint,
  backHref,
  templateTitle,
  narrative,
}: SimulationRunPageProps) {
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
        <SimulationIntro
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
              style={{ color: "#00E5C0" }}
            >
              Simulación
            </p>
            <h1
              className="mt-1 font-display text-lg"
              style={{ color: "#F1F5F9" }}
            >
              {templateTitle}
            </h1>
          </div>

          <SimulationRunner
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
                "radial-gradient(ellipse at top right, rgba(0,229,192,0.08), transparent 60%)",
            }}
          />

          <div className="relative z-10 text-center">
            <Loader2Icon
              className="mx-auto mb-6 h-8 w-8 animate-spin"
              style={{ color: "#00E5C0" }}
            />
            <p
              className="font-display text-xl"
              style={{ color: "#F1F5F9" }}
            >
              Evaluando tus decisiones...
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: "#64748B" }}
            >
              Nuestro motor de IA está analizando tu criterio
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
              style={{ color: "#00E5C0" }}
            >
              Resultados
            </p>
            <h1
              className="mt-2 font-display text-2xl md:text-3xl"
              style={{ color: "#F1F5F9" }}
            >
              {templateTitle}
            </h1>
          </div>

          <SimulationResults
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
