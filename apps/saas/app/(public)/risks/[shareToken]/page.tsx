"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type SharedRisk = {
  id: string;
  title: string;
  description: string;
  riskType: string;
  severity: number;
  probability: number;
  riskScore: number;
  status: string;
  isOpportunity: boolean;
  affectedStep?: string | null;
  residualScore?: number | null;
  mitigations: Array<{ action: string; owner?: string | null; status: string }>;
  controls: Array<{ name: string; controlType: string; effectiveness: string }>;
};

type SharedData = {
  processName: string;
  orgName: string;
  orgLogo?: string | null;
  risks: SharedRisk[];
};

function scoreColor(score: number): string {
  if (score >= 20) return "bg-red-600";
  if (score >= 12) return "bg-amber-600";
  if (score >= 6) return "bg-sky-500";
  return "bg-green-600";
}

function scoreLabel(score: number): string {
  if (score >= 20) return "Critico";
  if (score >= 12) return "Alto";
  if (score >= 6) return "Medio";
  return "Bajo";
}

function riskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    OPERATIONAL: "Operacional",
    COMPLIANCE: "Cumplimiento",
    STRATEGIC: "Estrategico",
    FINANCIAL: "Financiero",
    TECHNOLOGY: "Tecnologia",
    HUMAN_RESOURCE: "RRHH",
    REPUTATIONAL: "Reputacional",
  };
  return map[type] || type;
}

export default function PublicRiskSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/risks/${shareToken}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "expired");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-2">
            {error === "not_found" ? "Link no encontrado" : "Link expirado"}
          </h1>
          <p className="text-muted-foreground">
            {error === "not_found"
              ? "Este enlace de riesgos no existe."
              : "Este enlace ha expirado. Solicita uno nuevo al consultor."}
          </p>
        </div>
      </div>
    );
  }

  const actualRisks = data.risks.filter((r) => !r.isOpportunity);
  const opportunities = data.risks.filter((r) => r.isOpportunity);
  const summary = {
    critical: actualRisks.filter((r) => r.riskScore >= 20).length,
    high: actualRisks.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length,
    medium: actualRisks.filter((r) => r.riskScore >= 6 && r.riskScore < 12).length,
    low: actualRisks.filter((r) => r.riskScore < 6).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          {data.orgLogo && (
            <img
              src={data.orgLogo}
              alt={data.orgName}
              className="h-10 mb-4"
            />
          )}
          <h1 className="text-3xl font-serif text-foreground">
            Analisis de Riesgos
          </h1>
          <p className="text-muted-foreground mt-1">
            {data.orgName} — {data.processName}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Criticos", count: summary.critical, color: "text-red-600" },
            { label: "Altos", count: summary.high, color: "text-amber-600" },
            { label: "Medios", count: summary.medium, color: "text-sky-500" },
            { label: "Bajos", count: summary.low, color: "text-green-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-muted border border-border rounded-md p-4 text-center"
            >
              <div className={`text-2xl font-semibold tabular-nums ${item.color}`}>
                {item.count}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Register */}
        <h2 className="text-xl font-serif text-foreground mb-4 border-b border-border pb-2">
          Registro de Riesgos
        </h2>
        <div className="space-y-3 mb-8">
          {actualRisks
            .sort((a, b) => b.riskScore - a.riskScore)
            .map((risk) => (
              <div
                key={risk.id}
                className={`border border-border rounded-md p-4 border-l-4`}
                style={{
                  borderLeftColor:
                    risk.riskScore >= 20
                      ? "#DC2626"
                      : risk.riskScore >= 12
                        ? "#D97706"
                        : risk.riskScore >= 6
                          ? "#0EA5E9"
                          : "#16A34A",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{risk.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full text-white ${scoreColor(risk.riskScore)}`}
                      >
                        {riskTypeLabel(risk.riskType)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {risk.description}
                    </p>
                    {risk.affectedStep && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actividad: {risk.affectedStep}
                      </p>
                    )}
                  </div>
                  <div className="text-center ml-4">
                    <div
                      className={`text-lg font-semibold tabular-nums px-3 py-1 rounded text-white ${scoreColor(risk.riskScore)}`}
                    >
                      {risk.riskScore}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {risk.severity}×{risk.probability}
                    </div>
                  </div>
                </div>

                {/* Mitigations */}
                {risk.mitigations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Mitigaciones:
                    </p>
                    <ul className="space-y-1">
                      {risk.mitigations.map((m, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              m.status === "COMPLETED"
                                ? "bg-green-500"
                                : m.status === "IN_PROGRESS"
                                  ? "bg-blue-500"
                                  : "bg-border"
                            }`}
                          />
                          {m.action}
                          {m.owner && (
                            <span className="text-xs text-muted-foreground">({m.owner})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          {actualRisks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Sin riesgos compartidos.
            </p>
          )}
        </div>

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <>
            <h2 className="text-xl font-serif text-foreground mb-4 border-b border-border pb-2">
              Oportunidades
            </h2>
            <div className="space-y-3 mb-8">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="border border-green-200 bg-green-50 rounded-md p-4"
                >
                  <h3 className="font-medium text-green-700">{opp.title}</h3>
                  <p className="text-sm text-green-600 mt-1">{opp.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border">
          Generado por Auditora.ai
        </div>
      </div>
    </div>
  );
}
