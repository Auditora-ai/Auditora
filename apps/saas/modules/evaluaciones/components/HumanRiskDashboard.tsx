"use client";

import { EmptyState } from "@shared/components/EmptyState";
import { ShieldAlertIcon, FileDownIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import type { DashboardData } from "@evaluaciones/lib/dashboard-queries";
import { HeroScoreCard } from "./dashboard/HeroScoreCard";
import { KpiRow } from "./dashboard/KpiRow";
import { ScoreDistributionChart } from "./dashboard/ScoreDistributionChart";
import { ScoreTrendChart } from "./dashboard/ScoreTrendChart";
import { ProcessHeatmap } from "./dashboard/ProcessHeatmap";
import { ErrorPatternsCard } from "./dashboard/ErrorPatternsCard";
import { TeamTable } from "./dashboard/TeamTable";

interface HumanRiskDashboardProps {
  data: DashboardData;
  organizationSlug: string;
}

export function HumanRiskDashboard({
  data,
  organizationSlug,
}: HumanRiskDashboardProps) {
  const t = useTranslations("evaluaciones.dashboard");

  if (data.insufficientData) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled
          title="Próximamente"
          className="self-start sm:self-auto opacity-60 cursor-not-allowed"
        >
          <FileDownIcon className="mr-2 h-4 w-4" />
          {t("exportPdf")}
        </Button>
      </div>

      {/* Hero Score */}
      <HeroScoreCard score={data.orgAvgScore} />

      {/* KPIs */}
      <KpiRow
        totalSimulations={data.totalSimulations}
        membersEvaluated={data.membersEvaluated}
        completionRate={data.completionRate}
        avgDurationMinutes={data.avgDurationMinutes}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScoreDistributionChart
          dimensionAverages={data.dimensionAverages}
        />
        <ScoreTrendChart scoreTrend={data.scoreTrend} />
      </div>

      {/* Process Heatmap */}
      <ProcessHeatmap processHeatmap={data.processHeatmap} />

      {/* Error Patterns */}
      <ErrorPatternsCard errorPatterns={data.errorPatterns} />

      {/* Team Detail */}
      <TeamTable profiles={data.profiles} />
    </div>
  );
}
