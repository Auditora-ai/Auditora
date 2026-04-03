"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { EvaluacionRunPage } from "@evaluaciones/components/EvaluacionRunPage";

interface DecisionOption {
  label: string;
  description: string;
}

interface DecisionData {
  id: string;
  order: number;
  prompt: string;
  options: DecisionOption[];
  consequences: string[];
  proceduralReference: string | null;
}

interface SimulationData {
  runId: string;
  templateId: string;
  templateTitle: string;
  narrative: string;
  decisions: DecisionData[];
}

export default function IntakeSimulationPage() {
  const params = useParams();
  const token = params.token as string; // token = runId

  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/intake/evaluacion/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((d: SimulationData) => setData(d))
      .catch(() =>
        setError("Este enlace no es válido o la evaluación ya fue completada."),
      )
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center"
        style={{ backgroundColor: "#0A1428" }}
      >
        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(59,143,232,0.08), transparent 60%)",
          }}
        />
        <div className="relative z-10 text-center">
          <Loader2Icon
            className="mx-auto mb-4 h-8 w-8 animate-spin"
            style={{ color: "#3B8FE8" }}
          />
          <p className="text-sm" style={{ color: "#64748B" }}>
            Cargando evaluación...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ backgroundColor: "#0A1428" }}
      >
        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(59,143,232,0.08), transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          <h1
            className="mb-3 font-display text-2xl"
            style={{ color: "#F1F5F9" }}
          >
            Enlace no válido
          </h1>
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            {error ?? "No se pudo cargar la evaluación."}
          </p>
        </div>
      </div>
    );
  }

  const respondEndpoint = `/api/evaluaciones/${data.templateId}/run/${data.runId}`;

  return (
    <EvaluacionRunPage
      decisions={data.decisions}
      respondEndpoint={respondEndpoint}
      backHref="/"
      templateTitle={data.templateTitle}
      narrative={data.narrative}
    />
  );
}
