"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
} from "@repo/ui/components/card";
import {
  ChevronDownIcon,
  TrendingUpIcon,
  SparklesIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  riskType: string;
  opportunityValue: number | null;
  affectedStep: string | null;
  status: string;
  isOpportunity: boolean;
  mitigations?: any[];
}

interface OpportunityRegisterProps {
  risks: Opportunity[];
  onRiskUpdate: () => void;
  processId: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VALUE_LABELS: Record<number, string> = {
  1: "Muy Bajo",
  2: "Bajo",
  3: "Moderado",
  4: "Alto",
  5: "Muy Alto",
};

function getValueColor(value: number) {
  if (value >= 4) return "bg-green-600/20 text-green-400 border-l-green-600";
  if (value >= 3) return "bg-emerald-600/20 text-emerald-400 border-l-emerald-500";
  return "bg-teal-600/20 text-teal-400 border-l-teal-500";
}

function getValueBadge(value: number) {
  if (value >= 4) return "bg-green-600/20 text-green-400";
  if (value >= 3) return "bg-emerald-600/20 text-emerald-400";
  return "bg-teal-600/20 text-teal-400";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function OpportunityRegister({
  risks,
  onRiskUpdate,
  processId,
}: OpportunityRegisterProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opportunities = useMemo(() => {
    return risks
      .filter((r) => r.isOpportunity)
      .sort((a, b) => (b.opportunityValue ?? 0) - (a.opportunityValue ?? 0));
  }, [risks]);

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SparklesIcon className="mb-4 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">
          No se han identificado oportunidades en este proceso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {opportunities.length} oportunidad
          {opportunities.length !== 1 ? "es" : ""}
        </span>
      </div>

      {opportunities.map((opp) => {
        const isExpanded = expandedId === opp.id;
        const value = opp.opportunityValue ?? 1;

        return (
          <Card
            key={opp.id}
            className={`border-l-4 border-slate-700 bg-slate-800 ${value >= 4 ? "border-l-green-600" : value >= 3 ? "border-l-emerald-500" : "border-l-teal-500"}`}
          >
            <CardContent className="p-4">
              <div
                className="flex cursor-pointer items-start justify-between gap-3"
                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4 text-green-400" />
                    <h4 className="truncate text-sm font-semibold text-slate-100">
                      {opp.title}
                    </h4>
                    <span className="inline-flex items-center rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-400">
                      Oportunidad
                    </span>
                  </div>
                  {opp.description && (
                    <p className="line-clamp-2 text-xs text-slate-400">
                      {opp.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getValueBadge(value)}`}
                    >
                      Valor: {VALUE_LABELS[value] || value}
                    </span>
                    {opp.affectedStep && (
                      <span className="text-xs text-slate-500">
                        Paso: {opp.affectedStep}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>

              {/* Expanded: mitigations as actions */}
              {isExpanded && opp.mitigations && opp.mitigations.length > 0 && (
                <div className="mt-4 border-t border-slate-700 pt-4">
                  <h5 className="mb-2 text-xs font-medium text-slate-300">
                    Acciones para capturar
                  </h5>
                  <div className="space-y-2">
                    {opp.mitigations.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded bg-slate-900/50 px-3 py-2 text-xs"
                      >
                        <span className="text-slate-200">{m.action}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            m.status === "COMPLETED"
                              ? "bg-green-600/20 text-green-400"
                              : m.status === "IN_PROGRESS"
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
