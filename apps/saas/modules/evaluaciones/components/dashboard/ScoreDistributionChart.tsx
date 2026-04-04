"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { useTranslations } from "next-intl";

interface ScoreDistributionChartProps {
  dimensionAverages: {
    alignment: number;
    riskLevel: number;
    criterio: number;
  };
}

const chartConfig = {
  value: { label: "Score" },
} satisfies ChartConfig;

function barColor(value: number): string {
  if (value >= 80) return "#34d399"; // emerald-400
  if (value >= 60) return "#fbbf24"; // amber-400
  return "#f87171"; // red-400
}

export function ScoreDistributionChart({
  dimensionAverages,
}: ScoreDistributionChartProps) {
  const t = useTranslations("evaluaciones.dashboard");

  const data = [
    {
      dimension: t("alignment"),
      value: dimensionAverages.alignment,
    },
    {
      dimension: t("controlLevel"),
      value: Math.max(0, 100 - dimensionAverages.riskLevel),
    },
    {
      dimension: t("criterio"),
      value: dimensionAverages.criterio,
    },
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-slate-400">
        {t("scoreDistribution")}
      </h3>
      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="dimension"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            width={110}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(v) => (
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {v}/100
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry) => (
              <Cell key={entry.dimension} fill={barColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
