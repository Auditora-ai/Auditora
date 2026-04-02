"use client";

import { EmptyState } from "@shared/components/EmptyState";
import { TrendingUpIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import type { ProgressData, MemberProgress, ProcessProgress } from "@evaluaciones/lib/dashboard-queries";
import { scoreColor, scoreBg } from "@evaluaciones/lib/score-utils";
import { DimensionTrendChart } from "./dashboard/DimensionTrendChart";

interface ProgressDashboardProps {
  data: ProgressData;
  organizationSlug: string;
}

/* ── Delta badge ── */
function DeltaBadge({ delta, size = "md" }: { delta: number; size?: "sm" | "md" | "lg" }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  const Icon = isPositive ? ArrowUpIcon : isNeutral ? MinusIcon : ArrowDownIcon;
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-lg px-3 py-1.5 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        sizeClasses[size],
        isPositive && "bg-emerald-950/50 text-emerald-400",
        isNeutral && "bg-slate-800 text-slate-400",
        !isPositive && !isNeutral && "bg-red-950/50 text-red-400",
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-5 w-5")} />
      {isPositive ? "+" : ""}{delta} pts
    </span>
  );
}

/* ── Overall improvement hero ── */
function OverallImprovementHero({
  firstScore,
  latestScore,
  delta,
  totalMonths,
}: {
  firstScore: number;
  latestScore: number;
  delta: number;
  totalMonths: number;
}) {
  const t = useTranslations("evaluaciones.progress");

  return (
    <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/80 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUpIcon className="h-5 w-5 text-teal-400" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("overallProgress")}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
        {/* First Period */}
        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
            {t("firstEvaluations")}
          </p>
          <p
            className={cn("text-4xl font-bold", scoreColor(firstScore))}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {firstScore}
          </p>
          <p className="text-xs text-slate-500">/100</p>
        </div>

        {/* Arrow + Delta */}
        <div className="flex flex-col items-center gap-2">
          <DeltaBadge delta={delta} size="lg" />
          {totalMonths > 0 && (
            <p className="text-xs text-slate-500">
              {t("overMonths", { count: totalMonths })}
            </p>
          )}
        </div>

        {/* Latest Period */}
        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
            {t("latestEvaluations")}
          </p>
          <p
            className={cn("text-4xl font-bold", scoreColor(latestScore))}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {latestScore}
          </p>
          <p className="text-xs text-slate-500">/100</p>
        </div>
      </div>
    </div>
  );
}

/* ── Per-process comparison table ── */
function ProcessProgressTable({
  processes,
}: {
  processes: ProcessProgress[];
}) {
  const t = useTranslations("evaluaciones.progress");

  if (processes.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="px-5 py-4">
        <h3 className="text-sm font-medium text-slate-400">
          {t("byProcess")}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">{t("process")}</th>
              <th className="px-4 py-3 text-center">{t("firstPeriod")}</th>
              <th className="px-4 py-3 text-center">{t("latestPeriod")}</th>
              <th className="px-4 py-3 text-center">{t("change")}</th>
              <th className="px-4 py-3 text-center">{t("runs")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {processes.map((proc) => (
              <tr
                key={proc.processId}
                className="transition-colors hover:bg-slate-800/50"
              >
                <td className="px-5 py-3 text-sm font-medium text-foreground">
                  {proc.processName}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
                      scoreBg(proc.first.overall),
                      scoreColor(proc.first.overall),
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {proc.first.overall}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
                      scoreBg(proc.latest.overall),
                      scoreColor(proc.latest.overall),
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {proc.latest.overall}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <DeltaBadge delta={proc.delta} size="sm" />
                </td>
                <td
                  className="px-4 py-3 text-center text-sm text-slate-400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {proc.runCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Per-member progress ── */
function MemberProgressTable({
  members,
}: {
  members: MemberProgress[];
}) {
  const t = useTranslations("evaluaciones.progress");

  if (members.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="px-5 py-4">
        <h3 className="text-sm font-medium text-slate-400">
          {t("byMember")}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">{t("member")}</th>
              <th className="px-4 py-3 text-center">{t("firstScore")}</th>
              <th className="px-4 py-3 text-center">{t("latestScore")}</th>
              <th className="px-4 py-3 text-center">{t("change")}</th>
              <th className="px-4 py-3 text-center">{t("runs")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((member) => (
              <tr
                key={member.userId}
                className="transition-colors hover:bg-slate-800/50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {member.userImage ? (
                      <img
                        src={member.userImage}
                        alt={member.userName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.userName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.userEmail}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
                      scoreBg(member.firstScore),
                      scoreColor(member.firstScore),
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {member.firstScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex min-w-[3rem] items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold",
                      scoreBg(member.latestScore),
                      scoreColor(member.latestScore),
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {member.latestScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <DeltaBadge delta={member.delta} size="sm" />
                </td>
                <td
                  className="px-4 py-3 text-center text-sm text-slate-400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {member.totalRuns}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Dimension comparison cards ── */
function DimensionComparisonCards({
  first,
  latest,
}: {
  first: { alignment: number; riskLevel: number; criterio: number };
  latest: { alignment: number; riskLevel: number; criterio: number };
}) {
  const t = useTranslations("evaluaciones.progress");

  const dimensions = [
    { key: "alignment" as const, label: t("alignment"), inverted: false },
    { key: "riskLevel" as const, label: t("riskLevel"), inverted: true },
    { key: "criterio" as const, label: t("criterio"), inverted: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {dimensions.map((dim) => {
        const firstVal = first[dim.key];
        const latestVal = latest[dim.key];
        // For risk level, improvement means going DOWN (inverted)
        const rawDelta = latestVal - firstVal;
        const displayDelta = dim.inverted ? -rawDelta : rawDelta;

        return (
          <div
            key={dim.key}
            className="rounded-lg border border-slate-800 bg-slate-900 p-5"
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              {dim.label}
            </p>
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl font-bold",
                    dim.inverted
                      ? latestVal <= 30 ? "text-emerald-400" : latestVal <= 60 ? "text-amber-400" : "text-red-400"
                      : scoreColor(latestVal),
                  )}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {latestVal}
                </span>
                <span className="text-xs text-slate-500">
                  {t("from")} {firstVal}
                </span>
              </div>
              <DeltaBadge delta={displayDelta} size="sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main ProgressDashboard ── */
export function ProgressDashboard({
  data,
  organizationSlug,
}: ProgressDashboardProps) {
  const t = useTranslations("evaluaciones.progress");

  if (data.insufficientData) {
    return (
      <EmptyState
        icon={TrendingUpIcon}
        title={t("insufficientTitle")}
        description={t("insufficientDescription")}
        actions={[
          {
            label: t("goToEvaluations"),
            href: `/${organizationSlug}/evaluaciones`,
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Overall Improvement Hero */}
      <OverallImprovementHero
        firstScore={data.overallFirst.overall}
        latestScore={data.overallLatest.overall}
        delta={data.overallDelta}
        totalMonths={data.totalMonths}
      />

      {/* Dimension Comparison Cards */}
      <DimensionComparisonCards
        first={data.overallFirst}
        latest={data.overallLatest}
      />

      {/* Dimension Trend Chart */}
      {data.dimensionTrends.length >= 2 && (
        <DimensionTrendChart dimensionTrends={data.dimensionTrends} />
      )}

      {/* Per-Process Progress */}
      <ProcessProgressTable processes={data.processProgress} />

      {/* Per-Member Progress */}
      <MemberProgressTable members={data.memberProgress} />
    </div>
  );
}
