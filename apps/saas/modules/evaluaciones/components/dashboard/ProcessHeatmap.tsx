"use client";

import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import {
  scoreColor,
  scoreBg,
  riskLevelColor,
  riskLevelBg,
} from "@evaluaciones/lib/score-utils";
import type { ProcessHeatmapRow } from "@evaluaciones/lib/dashboard-queries";

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
    <td className="px-3 py-3 text-center md:px-4">
      <span
        className={cn(
          "inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold md:min-w-[3rem] md:px-2.5 md:text-sm",
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
  const t = useTranslations("evaluaciones.dashboard");

  if (processHeatmap.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="px-5 py-4">
        <h3 className="text-sm font-medium text-slate-400">
          {t("processHeatmap")}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-800 text-left text-[10px] font-medium uppercase tracking-wider text-slate-500 md:text-xs">
              <th className="px-4 py-3 md:px-5">{t("process")}</th>
              <th className="px-3 py-3 text-center md:px-4">{t("alignment")}</th>
              <th className="px-3 py-3 text-center md:px-4">{t("riskLevel")}</th>
              <th className="px-3 py-3 text-center md:px-4">{t("criterio")}</th>
              <th className="px-3 py-3 text-center md:px-4">{t("simulations")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {processHeatmap.map((row) => (
              <tr
                key={row.processName}
                className="transition-colors hover:bg-slate-800/50"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground md:px-5">
                  {row.processName}
                </td>
                <ScoreCell value={row.avgAlignment} />
                <ScoreCell value={row.avgRiskLevel} inverted />
                <ScoreCell value={row.avgCriterio} />
                <td
                  className="px-3 py-3 text-center text-sm text-slate-400 md:px-4"
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
