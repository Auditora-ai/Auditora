"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { ShieldAlertIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon } from "lucide-react";

type ProcessRiskSummary = {
  id: string;
  name: string;
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  avgRiskScore: number;
  topRisk?: { title: string; riskScore: number } | null;
};

type OrgSummary = {
  totalRisks: number;
  avgScore: number;
  heatMatrix: number[][];
  topRiskTypes: Array<{ type: string; count: number }>;
};

function scoreColor(score: number): string {
  if (score >= 20) return "bg-red-600";
  if (score >= 12) return "bg-amber-600";
  if (score >= 6) return "bg-sky-500";
  return "bg-green-600";
}

function scoreBorderColor(score: number): string {
  if (score >= 20) return "border-red-600";
  if (score >= 12) return "border-amber-600";
  if (score >= 6) return "border-sky-500";
  return "border-green-600";
}

export function CrossProcessRiskDashboard() {
  const t = useTranslations("riskTab");
  const tc = useTranslations("common");
  const [processes, setProcesses] = useState<ProcessRiskSummary[]>([]);
  const [orgSummary, setOrgSummary] = useState<OrgSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/organization/risks")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProcesses(data.processes || []);
        setOrgSummary(data.orgSummary || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="h-5 w-5" />
            Riesgos por Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="h-5 w-5" />
            Riesgos por Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Error cargando datos de riesgos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const processesWithRisks = processes.filter((p) => p.totalRisks > 0);

  if (processesWithRisks.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="h-5 w-5" />
            Riesgos por Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("noRisks")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlertIcon className="h-5 w-5" />
          Riesgos por Proceso
          {orgSummary && (
            <Badge status="info" className="ml-2 font-normal">
              {orgSummary.totalRisks} riesgos totales
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary row */}
        {orgSummary && (
          <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: AlertTriangleIcon,
                label: "Criticos",
                count: processes.reduce((s, p) => s + p.criticalCount, 0),
                color: "text-red-600",
              },
              {
                icon: AlertTriangleIcon,
                label: "Altos",
                count: processes.reduce((s, p) => s + p.highCount, 0),
                color: "text-amber-600",
              },
              {
                icon: InfoIcon,
                label: "Score Promedio",
                count: orgSummary.avgScore,
                color: "text-sky-500",
              },
              {
                icon: CheckCircleIcon,
                label: tc("process"),
                count: processesWithRisks.length,
                color: "text-green-600",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-muted border border-border rounded-md p-3 text-center"
              >
                <div className={`text-xl font-semibold tabular-nums ${item.color}`}>
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Process risk bars */}
        <div className="space-y-2">
          {processesWithRisks
            .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
            .map((process) => (
              <div
                key={process.id}
                className={`flex items-center gap-3 p-3 border rounded-md border-l-4 ${scoreBorderColor(process.avgRiskScore)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{process.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {process.totalRisks} riesgos
                    {process.criticalCount > 0 && (
                      <span className="text-red-600 ml-1">
                        ({process.criticalCount} criticos)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mini risk distribution bar */}
                  <div className="flex h-3 w-20 rounded-full overflow-hidden bg-muted">
                    {process.criticalCount > 0 && (
                      <div
                        className="bg-red-600"
                        style={{
                          width: `${(process.criticalCount / process.totalRisks) * 100}%`,
                        }}
                      />
                    )}
                    {process.highCount > 0 && (
                      <div
                        className="bg-amber-600"
                        style={{
                          width: `${(process.highCount / process.totalRisks) * 100}%`,
                        }}
                      />
                    )}
                    <div className="bg-sky-500 flex-1" />
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums px-2 py-0.5 rounded text-white ${scoreColor(process.avgRiskScore)}`}
                  >
                    {process.avgRiskScore}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Top risk types */}
        {orgSummary && orgSummary.topRiskTypes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Tipos de riesgo mas frecuentes:
            </p>
            <div className="flex flex-wrap gap-2">
              {orgSummary.topRiskTypes.slice(0, 5).map((rt) => (
                <Badge key={rt.type} status="info">
                  {rt.type} ({rt.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
