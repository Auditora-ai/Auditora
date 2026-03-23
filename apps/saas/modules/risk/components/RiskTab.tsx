"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  ClipboardListIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ControlMapping } from "./ControlMapping";
import { FmeaView } from "./FmeaView";
import { OpportunityRegister } from "./OpportunityRegister";
import { RiskHeatMatrix } from "./RiskHeatMatrix";
import { RiskRegister } from "./RiskRegister";
import { RiskTrendChart } from "./RiskTrendChart";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Risk {
  id: string;
  title: string;
  description: string | null;
  riskType: string;
  severity: number;
  probability: number;
  riskScore: number;
  affectedStep: string | null;
  status: string;
  isOpportunity: boolean;
  failureMode: string | null;
  failureEffect: string | null;
  detection: number | null;
  rpn: number | null;
  opportunityValue: number | null;
  residualSeverity: number | null;
  residualProbability: number | null;
  residualScore: number | null;
  mitigations: any[];
  controls: any[];
}

type SubTab = "registro" | "oportunidades" | "controles" | "fmea";

interface RiskTabProps {
  processId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getScoreBadge(score: number) {
  if (score >= 20) return "bg-red-600/20 text-red-400";
  if (score >= 12) return "bg-amber-600/20 text-amber-400";
  if (score >= 6) return "bg-sky-500/20 text-sky-400";
  return "bg-green-600/20 text-green-400";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskTab({ processId }: RiskTabProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("registro");
  const [activeCell, setActiveCell] = useState<{
    severity: number;
    probability: number;
  } | null>(null);
  const [showTrend, setShowTrend] = useState(false);

  const fetchRisks = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/processes/${processId}/risks`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setRisks(data.risks || []);
    } catch (err) {
      console.error("Failed to fetch risks:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  const handleAudit = async () => {
    setAuditing(true);
    try {
      await fetch(`/api/processes/${processId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });
      await fetchRisks();
    } catch (err) {
      console.error("Audit failed:", err);
      setError(true);
    } finally {
      setAuditing(false);
    }
  };

  const handleFmea = async () => {
    setAuditing(true);
    try {
      await fetch(`/api/processes/${processId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fmea" }),
      });
      await fetchRisks();
      setActiveSubTab("fmea");
    } catch (err) {
      console.error("FMEA failed:", err);
    } finally {
      setAuditing(false);
    }
  };

  const handleCellClick = (severity: number, probability: number) => {
    if (
      activeCell?.severity === severity &&
      activeCell?.probability === probability
    ) {
      setActiveCell(null);
    } else {
      setActiveCell({ severity, probability });
      setActiveSubTab("registro");
    }
  };

  // ─── Computed stats ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const actualRisks = risks.filter((r) => !r.isOpportunity);
    const opportunities = risks.filter((r) => r.isOpportunity);
    const totalScore =
      actualRisks.length > 0
        ? Math.round(
            actualRisks.reduce((sum, r) => sum + r.riskScore, 0) /
              actualRisks.length,
          )
        : 0;
    const critical = actualRisks.filter((r) => r.riskScore >= 20).length;
    const high = actualRisks.filter(
      (r) => r.riskScore >= 12 && r.riskScore < 20,
    ).length;

    return {
      avgScore: totalScore,
      critical,
      high,
      opportunities: opportunities.length,
      totalRisks: actualRisks.length,
    };
  }, [risks]);

  // ─── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────

  if (error && risks.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangleIcon className="mb-4 h-10 w-10 text-red-400" />
          <p className="mb-4 text-sm text-slate-300">
            Error al analizar. Intenta de nuevo.
          </p>
          <Button onClick={fetchRisks} variant="outline">
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────────

  if (risks.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlertIcon className="mb-4 h-12 w-12 text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold text-slate-100">
            Sin riesgos analizados
          </h3>
          <p className="mb-6 max-w-md text-sm text-slate-400">
            Sin riesgos analizados. Ejecuta el análisis para identificar
            riesgos.
          </p>
          <Button onClick={handleAudit} disabled={auditing}>
            {auditing ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <ShieldAlertIcon className="mr-2 h-4 w-4" />
                Analizar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Data State ───────────────────────────────────────────────────────

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "registro", label: "Registro" },
    { key: "oportunidades", label: "Oportunidades" },
    { key: "controles", label: "Controles" },
    { key: "fmea", label: "FMEA" },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Average score */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Riesgo promedio:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getScoreBadge(stats.avgScore)}`}
              >
                {stats.avgScore}
              </span>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-2">
              {stats.critical > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  {stats.critical} Crítico{stats.critical !== 1 ? "s" : ""}
                </span>
              )}
              {stats.high > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                  {stats.high} Alto{stats.high !== 1 ? "s" : ""}
                </span>
              )}
              {stats.opportunities > 0 && (
                <span className="inline-flex items-center rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-400">
                  {stats.opportunities} Oportunidad
                  {stats.opportunities !== 1 ? "es" : ""}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAudit}
                disabled={auditing}
                className="border-slate-600 text-slate-300"
              >
                {auditing ? (
                  <>
                    <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <ShieldAlertIcon className="mr-1 h-3 w-3" />
                    Analizar Riesgos
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFmea}
                disabled={auditing}
                className="border-slate-600 text-slate-300"
              >
                <ClipboardListIcon className="mr-1 h-3 w-3" />
                FMEA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Heat Matrix ──────────────────────────────────────────── */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-200">
            Matriz de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskHeatMatrix
            risks={risks
              .filter((r) => !r.isOpportunity)
              .map((r) => ({
                severity: r.severity,
                probability: r.probability,
              }))}
            activeCell={activeCell}
            onCellClick={handleCellClick}
          />
          {activeCell && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Filtro: Severidad {activeCell.severity}, Probabilidad{" "}
                {activeCell.probability}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-400"
                onClick={() => setActiveCell(null)}
              >
                Limpiar filtro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Sub-tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900/50 p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              activeSubTab === tab.key
                ? "bg-slate-700 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Sub-tab content ──────────────────────────────────────── */}
      <div>
        {activeSubTab === "registro" && (
          <RiskRegister
            risks={risks}
            onRiskUpdate={fetchRisks}
            processId={processId}
            filterSeverity={activeCell?.severity}
            filterProbability={activeCell?.probability}
          />
        )}

        {activeSubTab === "oportunidades" && (
          <OpportunityRegister
            risks={risks}
            onRiskUpdate={fetchRisks}
            processId={processId}
          />
        )}

        {activeSubTab === "controles" && (
          <div className="space-y-4">
            {risks
              .filter((r) => !r.isOpportunity)
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((risk) => (
                <Card
                  key={risk.id}
                  className="border-slate-700 bg-slate-800"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-200">
                      {risk.title}
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getScoreBadge(risk.riskScore)}`}
                      >
                        {risk.riskScore}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ControlMapping
                      riskId={risk.id}
                      risk={risk}
                      controls={risk.controls || []}
                      onUpdate={fetchRisks}
                    />
                  </CardContent>
                </Card>
              ))}
            {risks.filter((r) => !r.isOpportunity).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No hay riesgos para mapear controles.
              </p>
            )}
          </div>
        )}

        {activeSubTab === "fmea" && <FmeaView risks={risks} />}
      </div>

      {/* ─── Trend Chart (collapsible) ────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowTrend(!showTrend)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <TrendingUpIcon className="h-3.5 w-3.5" />
            Tendencia de Riesgo
          </span>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${showTrend ? "rotate-180" : ""}`}
          />
        </button>
        {showTrend && (
          <div className="mt-2">
            <RiskTrendChart processId={processId} />
          </div>
        )}
      </div>
    </div>
  );
}
