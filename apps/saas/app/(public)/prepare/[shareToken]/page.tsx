"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  category: string;
  question: string;
  context: string | null;
  priority: number;
}

interface PrepareData {
  processName: string;
  processDescription: string | null;
  organizationName: string | null;
  organizationLogo: string | null;
  questions: Question[];
  completenessScore: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  MISSING_PATH: "Flujo del proceso",
  MISSING_ROLE: "Roles y responsabilidades",
  MISSING_EXCEPTION: "Manejo de excepciones",
  MISSING_DECISION: "Criterios de decision",
  MISSING_TRIGGER: "Inicio del proceso",
  MISSING_OUTPUT: "Resultados del proceso",
  CONTRADICTION: "Aclaracion necesaria",
  UNCLEAR_HANDOFF: "Transferencia entre areas",
  MISSING_SLA: "Tiempos y niveles de servicio",
  MISSING_SYSTEM: "Sistemas y aplicaciones",
  GENERAL_GAP: "Informacion general",
};

export default function PreparePage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [data, setData] = useState<PrepareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [respondentName, setRespondentName] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/public/intelligence/${shareToken}`);
        if (res.status === 404) {
          setError("Este enlace no es valido.");
          return;
        }
        if (res.status === 410) {
          setError("Este enlace ha expirado. Solicita uno nuevo al consultor.");
          return;
        }
        if (!res.ok) {
          setError("Error al cargar las preguntas.");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("No se pudo conectar. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [shareToken]);

  const handleSubmit = async () => {
    const filledAnswers = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([itemId, answer]) => ({
        itemId,
        answer,
        respondentName: respondentName || undefined,
      }));

    if (filledAnswers.length === 0) return;

    setSubmitting(true);
    try {
      await fetch(`/api/public/intelligence/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: filledAnswers }),
      });
      setSubmitted(true);
    } catch {
      setError("Error al enviar respuestas. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <p className="text-lg text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">&#10003;</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Respuestas enviadas
          </h2>
          <p className="text-muted-foreground">
            Gracias por tu ayuda. Tus respuestas han sido registradas y seran
            revisadas por el consultor.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {data.organizationLogo && (
            <img
              src={data.organizationLogo}
              alt=""
              className="mb-3 h-8 object-contain"
            />
          )}
          {data.organizationName && (
            <p className="text-sm text-muted-foreground">{data.organizationName}</p>
          )}
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {data.processName}
          </h1>
          {data.processDescription && (
            <p className="mt-1 text-sm text-muted-foreground">
              {data.processDescription}
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Necesitamos tu ayuda para completar la documentacion de este proceso.
            Responde las preguntas que puedas — no es necesario responder todas.
          </p>
        </div>
      </header>

      {/* Name input */}
      <div className="mx-auto max-w-2xl px-6 py-4">
        <label className="block text-sm font-medium text-muted-foreground">
          Tu nombre (opcional)
        </label>
        <input
          type="text"
          value={respondentName}
          onChange={(e) => setRespondentName(e.target.value)}
          placeholder="Ej: Juan Perez"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Questions */}
      <main className="mx-auto max-w-2xl px-6 pb-32">
        <div className="space-y-6">
          {data.questions.map((q, index) => (
            <div key={q.id} className="rounded-xl border border-border p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {index + 1} / {data.questions.length}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[q.category] || q.category}
                </span>
              </div>
              <p className="mb-3 text-base font-medium text-foreground">
                {q.question}
              </p>
              {q.context && (
                <p className="mb-3 text-xs text-muted-foreground">{q.context}</p>
              )}
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                placeholder="Escribe tu respuesta aqui..."
                rows={3}
                className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {answeredCount} de {data.questions.length} respondidas
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-border"
          >
            {submitting ? "Enviando..." : "Enviar respuestas"}
          </button>
        </div>
      </div>
    </div>
  );
}
