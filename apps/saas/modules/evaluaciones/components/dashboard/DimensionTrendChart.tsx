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
  alignment: { label: "Alignment", color: "hsl(var(--chart-1))" },
  riskLevel: { label: "Risk Level", color: "hsl(var(--chart-5))" },
  criterio: { label: "Criterio", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export function DimensionTrendChart({
  dimensionTrends,
}: DimensionTrendChartProps) {
  const t = useTranslations("evaluaciones.progress");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("dimensionTrends")}
      </h3>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <LineChart
          data={dimensionTrends}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            width={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(v) => (
                  <span className="tabular-nums">
                    {v}/100
                  </span>
                )}
              />
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
          />
          {/* Dynamic chart line colors — kept as inline style values */}
          <Line
            dataKey="alignment"
            name={t("alignment")}
            type="monotone"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="riskLevel"
            name={t("riskLevel")}
            type="monotone"
            stroke="hsl(var(--chart-5))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "hsl(var(--chart-5))" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="criterio"
            name={t("criterio")}
            type="monotone"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--chart-3))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
