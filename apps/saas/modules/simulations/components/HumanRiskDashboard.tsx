"use client";

import { EmptyState } from "@shared/components/EmptyState";
import { ShieldAlertIcon, FileDownIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import type { DashboardData } from "@simulations/lib/dashboard-queries";
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
  if (data.insufficientData) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Datos insuficientes"
        description="Se necesitan al menos 3 simulaciones completadas para generar el dashboard de riesgo humano. Invita a tu equipo a completar simulaciones."
        actions={[
          {
            label: "Ir a Simulaciones",
            href: `/${organizationSlug}/simulations`,
            variant: "primary",
          },
        ]}
      />
    );
  }

  const handleExport = () => {
    window.open(`/api/evaluation/export-report`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard de Riesgo Humano
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evaluación del criterio de decisión de tu equipo basada en
            simulaciones.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <FileDownIcon className="mr-2 h-4 w-4" />
          Exportar PDF
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
