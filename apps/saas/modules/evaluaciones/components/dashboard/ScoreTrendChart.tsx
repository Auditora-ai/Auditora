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
  score: { label: "Score", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export function ScoreTrendChart({ scoreTrend }: ScoreTrendChartProps) {
  const t = useTranslations("evaluaciones.dashboard");
  const hasEnoughData = scoreTrend.length >= 2;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("scoreTrend")}
      </h3>
      {!hasEnoughData ? (
        <div className="flex h-[180px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
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
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <ReferenceLine
              y={80}
              stroke="hsl(var(--chart-2))"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={60}
              stroke="hsl(var(--chart-4))"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
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
            <Area
              dataKey="score"
              type="monotone"
              fill="url(#eval-score-trend-fill)"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
