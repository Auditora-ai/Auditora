"use client";

import { useState, useCallback } from "react";

interface DeliverableCardData {
  type: string;
  label: string;
  description: string;
  icon: string;
  status: "idle" | "running" | "completed" | "failed" | "draft";
  data?: unknown;
  confidence?: number;
  error?: string;
}

const DELIVERABLE_TYPES: DeliverableCardData[] = [
  {
    type: "mission_vision",
    label: "Mision, Vision y Valores",
    description:
      "Documento estrategico fundacional: proposito, direccion y principios de la organizacion.",
    icon: "🎯",
    status: "idle",
  },
  {
    type: "value_chain",
    label: "Cadena de Valor",
    description:
      "Analisis Porter: actividades primarias y de soporte que crean valor.",
    icon: "⛓️",
    status: "idle",
  },
  {
    type: "landscape",
    label: "Mapa de Procesos",
    description:
      "Landscape organizacional: procesos estrategicos, core y soporte.",
    icon: "🗺️",
    status: "idle",
  },
  {
    type: "horizontal_view",
    label: "Vista Horizontal",
    description:
      "Flujo end-to-end cross-departamental con handoffs y puntos criticos.",
    icon: "↔️",
    status: "idle",
  },
  {
    type: "procedure",
    label: "Procedimientos",
    description:
      "Instrucciones detalladas paso a paso por actividad BPMN.",
    icon: "📋",
    status: "idle",
  },
];

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 70
      ? "bg-green-100 text-green-700"
      : pct >= 40
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
      {pct}% confianza
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: "bg-slate-300",
    running: "bg-amber-500 animate-pulse",
    completed: "bg-green-500",
    failed: "bg-red-500",
    draft: "bg-amber-400",
  };
  return <span className={`h-2 w-2 rounded-full ${styles[status] ?? styles.idle}`} />;
}

export function DeliverablesGrid({
  organizationId,
  existingDeliverables,
}: {
  organizationId: string;
  existingDeliverables: Array<{
    type: string;
    status: string;
    data: unknown;
    confidence: number | null;
    error: string | null;
  }>;
}) {
  const [cards, setCards] = useState<DeliverableCardData[]>(() =>
    DELIVERABLE_TYPES.map((d) => {
      const existing = existingDeliverables.find((e) => e.type === d.type);
      if (existing) {
        return {
          ...d,
          status: existing.status as DeliverableCardData["status"],
          data: existing.data,
          confidence: existing.confidence ?? undefined,
          error: existing.error ?? undefined,
        };
      }
      return d;
    }),
  );

  const generate = useCallback(
    async (type: string) => {
      setCards((prev) =>
        prev.map((c) =>
          c.type === type ? { ...c, status: "running", error: undefined } : c,
        ),
      );

      try {
        const res = await fetch(`/api/deliverables/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        });

        const result = await res.json();

        if (!res.ok) {
          setCards((prev) =>
            prev.map((c) =>
              c.type === type
                ? { ...c, status: "failed", error: result.error }
                : c,
            ),
          );
          return;
        }

        setCards((prev) =>
          prev.map((c) =>
            c.type === type
              ? {
                  ...c,
                  status: result.status === "draft" ? "draft" : "completed",
                  data: result.data,
                  confidence: result.confidence,
                }
              : c,
          ),
        );
      } catch (err) {
        setCards((prev) =>
          prev.map((c) =>
            c.type === type
              ? {
                  ...c,
                  status: "failed",
                  error: err instanceof Error ? err.message : "Error desconocido",
                }
              : c,
          ),
        );
      }
    },
    [organizationId],
  );

  const generateAll = useCallback(async () => {
    const toGenerate = cards.filter(
      (c) => c.status === "idle" || c.status === "failed",
    );
    for (const card of toGenerate) {
      generate(card.type);
    }
  }, [cards, generate]);

  const completedCount = cards.filter(
    (c) => c.status === "completed" || c.status === "draft",
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">
            {completedCount} de {cards.length} entregables generados
          </p>
          <div className="mt-2 h-2 w-64 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${(completedCount / cards.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <button
          onClick={generateAll}
          disabled={cards.some((c) => c.status === "running")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generar todos
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.type}
            className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{card.icon}</span>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {card.label}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={card.status} />
                <ConfidenceBadge confidence={card.confidence} />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 leading-relaxed">
              {card.description}
            </p>

            {/* Status-specific content */}
            {card.status === "failed" && card.error && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {card.error}
              </p>
            )}

            {card.status === "draft" && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                Borrador — datos insuficientes para generar completo
              </p>
            )}

            {card.status === "completed" && card.data != null && (
              <p className="text-xs text-green-600">
                Generado exitosamente
              </p>
            )}

            {/* Action button */}
            <div className="mt-auto pt-2">
              {card.status === "running" ? (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generando...
                </div>
              ) : (
                <button
                  onClick={() => generate(card.type)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {card.status === "idle"
                    ? "Generar"
                    : card.status === "failed"
                      ? "Reintentar"
                      : "Regenerar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
