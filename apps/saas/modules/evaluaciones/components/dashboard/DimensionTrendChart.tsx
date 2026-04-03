"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import type { DimensionTrend } from "@evaluaciones/lib/dashboard-queries";

interface DimensionTrendChartProps {
  dimensionTrends: DimensionTrend[];
}

const chartConfig = {
  alignment: { label: "Alignment", color: "#3B8FE8" },
  riskLevel: { label: "Risk Level", color: "#f87171" },
  criterio: { label: "Criterio", color: "#818cf8" },
} satisfies ChartConfig;

export function DimensionTrendChart({
  dimensionTrends,
}: DimensionTrendChartProps) {
  const t = useTranslations("evaluaciones.progress");

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-slate-400">
        {t("dimensionTrends")}
      </h3>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <LineChart
          data={dimensionTrends}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#1e293b" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            width={32}
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
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          />
          <Line
            dataKey="alignment"
            name={t("alignment")}
            type="monotone"
            stroke="#3B8FE8"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3B8FE8" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="riskLevel"
            name={t("riskLevel")}
            type="monotone"
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#f87171" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="criterio"
            name={t("criterio")}
            type="monotone"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ r: 3, fill: "#818cf8" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
