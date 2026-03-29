"use client";

import { RefreshCwIcon, TrendingUpIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrendPoint {
  date: string;
  totalScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface RiskTrendChartProps {
  processId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskTrendChart({ processId }: RiskTrendChartProps) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrend = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/processes/${processId}/risks/trend`,
      );
      if (res.ok) {
        const data = await res.json();
        setTrend(data.trend || []);
      }
    } catch (error) {
      console.error("Failed to fetch risk trend:", error);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <RefreshCwIcon className="mr-2 h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">Cargando tendencia...</span>
      </div>
    );
  }

  if (trend.length < 2) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-chrome-border bg-chrome-raised/50 px-4 py-3">
        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Necesitas al menos 2 auditorías para tendencia
        </span>
      </div>
    );
  }

  const maxScore = Math.max(...trend.map((t) => t.totalScore), 1);
  const BAR_HEIGHT = 48;

  return (
    <div className="rounded-lg border border-chrome-border bg-chrome-raised/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Tendencia de Riesgo
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1" style={{ height: BAR_HEIGHT }}>
        {trend.map((point, i) => {
          const total = point.totalScore;
          const heightPct = (total / maxScore) * 100;
          const critPct =
            total > 0 ? (point.criticalCount / total) * 100 : 0;
          const highPct =
            total > 0 ? (point.highCount / total) * 100 : 0;
          const medPct =
            total > 0 ? (point.mediumCount / total) * 100 : 0;
          const lowPct =
            total > 0 ? (point.lowCount / total) * 100 : 0;

          return (
            <div
              key={i}
              className="relative flex-1 overflow-hidden rounded-t"
              style={{ height: `${Math.max(4, heightPct)}%` }}
              title={`${new Date(point.date).toLocaleDateString()} — Score: ${total}`}
            >
              {/* Stacked segments */}
              <div className="flex h-full w-full flex-col-reverse">
                {lowPct > 0 && (
                  <div
                    className="bg-green-600"
                    style={{ height: `${lowPct}%` }}
                  />
                )}
                {medPct > 0 && (
                  <div
                    className="bg-sky-500"
                    style={{ height: `${medPct}%` }}
                  />
                )}
                {highPct > 0 && (
                  <div
                    className="bg-amber-600"
                    style={{ height: `${highPct}%` }}
                  />
                )}
                {critPct > 0 && (
                  <div
                    className="bg-red-600"
                    style={{ height: `${critPct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis dates */}
      <div className="mt-1 flex gap-1">
        {trend.map((point, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[8px] text-muted-foreground"
          >
            {new Date(point.date).toLocaleDateString("es", {
              month: "short",
              day: "numeric",
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-600" />
          Crítico
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-600" />
          Alto
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-sky-500" />
          Medio
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-600" />
          Bajo
        </span>
      </div>
    </div>
  );
}
