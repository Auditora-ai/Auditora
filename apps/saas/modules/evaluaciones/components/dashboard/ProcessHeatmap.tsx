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

function ScoreBadge({
  value,
  inverted,
}: {
  value: number;
  inverted?: boolean;
}) {
  const colorFn = inverted ? riskLevelColor : scoreColor;
  const bgFn = inverted ? riskLevelBg : scoreBg;

  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold",
        bgFn(value),
        colorFn(value),
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </span>
  );
}

export function ProcessHeatmap({ processHeatmap }: ProcessHeatmapProps) {
  const t = useTranslations("evaluaciones.dashboard");

  if (processHeatmap.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="px-1 py-3 md:px-5 md:py-4">
        <h3 className="text-sm font-medium text-slate-400">
          {t("processHeatmap")}
        </h3>
      </div>

      {/* Mobile: Card layout */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {processHeatmap.map((row) => (
          <div
            key={row.processName}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground truncate">
                {row.processName}
              </h4>
              <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                {row.simulationCount} {t("simulations").toLowerCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">{t("alignment")}</p>
                <ScoreBadge value={row.avgAlignment} />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">{t("riskLevel")}</p>
                <ScoreBadge value={row.avgRiskLevel} inverted />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">{t("criterio")}</p>
                <ScoreBadge value={row.avgCriterio} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
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
    </div>
  );
}
