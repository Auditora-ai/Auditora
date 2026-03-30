"use client";

import { cn } from "@repo/ui";
import {
  scoreColor,
  scoreBg,
  riskLevelColor,
  riskLevelBg,
} from "@simulations/lib/score-utils";
import type { ProcessHeatmapRow } from "@simulations/lib/dashboard-queries";

interface ProcessHeatmapProps {
  processHeatmap: ProcessHeatmapRow[];
}

function ScoreCell({
  value,
  inverted,
}: {
  value: number;
  inverted?: boolean;
}) {
  const colorFn = inverted ? riskLevelColor : scoreColor;
  const bgFn = inverted ? riskLevelBg : scoreBg;

  return (
    <td className="px-4 py-3 text-center">
      <span
        className={cn(
          "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
          bgFn(value),
          colorFn(value),
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </td>
  );
}

export function ProcessHeatmap({ processHeatmap }: ProcessHeatmapProps) {
  if (processHeatmap.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="px-5 py-4">
        <h3 className="text-sm font-medium text-slate-400">
          Mapa de Calor por Proceso
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Proceso</th>
              <th className="px-4 py-3 text-center">Alineamiento</th>
              <th className="px-4 py-3 text-center">Nivel de Riesgo</th>
              <th className="px-4 py-3 text-center">Criterio</th>
              <th className="px-4 py-3 text-center">Simulaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {processHeatmap.map((row) => (
              <tr
                key={row.processName}
                className="transition-colors hover:bg-slate-800/50"
              >
                <td className="px-5 py-3 text-sm font-medium text-foreground">
                  {row.processName}
                </td>
                <ScoreCell value={row.avgAlignment} />
                <ScoreCell value={row.avgRiskLevel} inverted />
                <ScoreCell value={row.avgCriterio} />
                <td
                  className="px-4 py-3 text-center text-sm text-slate-400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.simulationCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
