"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";

interface ScoreTrendChartProps {
  scoreTrend: Array<{ month: string; score: number }>;
}

const chartConfig = {
  score: { label: "Score", color: "#3B8FE8" },
} satisfies ChartConfig;

export function ScoreTrendChart({ scoreTrend }: ScoreTrendChartProps) {
  const t = useTranslations("evaluaciones.dashboard");
  const hasEnoughData = scoreTrend.length >= 2;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 text-sm font-medium text-slate-400">
        {t("scoreTrend")}
      </h3>
      {!hasEnoughData ? (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-slate-500">
            {t("needsTwoMonths")}
          </p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart
            data={scoreTrend}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="eval-score-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B8FE8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B8FE8" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <ReferenceLine
              y={80}
              stroke="#34d399"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={60}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
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
            <Area
              dataKey="score"
              type="monotone"
              fill="url(#eval-score-trend-fill)"
              stroke="#3B8FE8"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
