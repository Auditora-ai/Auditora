"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

interface ScoreDistributionChartProps {
  dimensionAverages: {
    alignment: number;
    riskLevel: number;
    criterio: number;
  };
}

const chartConfig = {
  value: { label: "Puntaje" },
} satisfies ChartConfig;

function barColor(value: number): string {
  if (value >= 80) return "#34d399"; // emerald-400
  if (value >= 60) return "#fbbf24"; // amber-400
  return "#f87171"; // red-400
}

export function ScoreDistributionChart({
  dimensionAverages,
}: ScoreDistributionChartProps) {
  const data = [
    {
      dimension: "Alineamiento",
      value: dimensionAverages.alignment,
    },
    {
      dimension: "Nivel de Control",
      value: Math.max(0, 100 - dimensionAverages.riskLevel),
    },
    {
      dimension: "Criterio",
      value: dimensionAverages.criterio,
    },
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-slate-400">
        Distribución de Puntajes
      </h3>
      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 110 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="dimension"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 13 }}
            width={105}
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
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={index} fill={barColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
