"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
} from "@repo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  ChevronDownIcon,
  ArrowUpDownIcon,
  CircleDotIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MitigationTracker } from "./MitigationTracker";

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
  mitigations?: any[];
  controls?: any[];
}

interface RiskRegisterProps {
  risks: Risk[];
  onRiskUpdate: () => void;
  processId: string;
  filterSeverity?: number;
  filterProbability?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  OPERATIONAL: "Operacional",
  COMPLIANCE: "Cumplimiento",
  FINANCIAL: "Financiero",
  STRATEGIC: "Estratégico",
  REPUTATIONAL: "Reputacional",
  TECHNOLOGY: "Tecnología",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  MITIGATING: "En Mitigación",
  ACCEPTED: "Aceptado",
  CLOSED: "Cerrado",
};

function getScoreColor(score: number) {
  if (score >= 20) return "border-l-destructive";
  if (score >= 12) return "border-l-orientation";
  if (score >= 6) return "border-l-info";
  return "border-l-success";
}

function getScoreBadgeClass(score: number) {
  if (score >= 20) return "bg-destructive/15 text-red-400";
  if (score >= 12) return "bg-orientation/15 text-amber-400";
  if (score >= 6) return "bg-info/15 text-sky-400";
  return "bg-success/15 text-green-400";
}

type SortKey = "riskScore" | "severity" | "probability" | "type";

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskRegister({
  risks,
  onRiskUpdate,
  processId,
  filterSeverity,
  filterProbability,
}: RiskRegisterProps) {
  const [sortBy, setSortBy] = useState<SortKey>("riskScore");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRisks = useMemo(() => {
    let result = risks.filter((r) => !r.isOpportunity);

    if (filterSeverity) {
      result = result.filter((r) => r.severity === filterSeverity);
    }
    if (filterProbability) {
      result = result.filter((r) => r.probability === filterProbability);
    }
    if (filterType !== "all") {
      result = result.filter((r) => r.riskType === filterType);
    }
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "riskScore":
          return b.riskScore - a.riskScore;
        case "severity":
          return b.severity - a.severity;
        case "probability":
          return b.probability - a.probability;
        case "type":
          return a.riskType.localeCompare(b.riskType);
        default:
          return 0;
      }
    });

    return result;
  }, [risks, filterSeverity, filterProbability, filterType, filterStatus, sortBy]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[160px] border-chrome-border bg-chrome-raised text-chrome-text">
            <ArrowUpDownIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="riskScore">Puntuación</SelectItem>
            <SelectItem value="severity">Severidad</SelectItem>
            <SelectItem value="probability">Probabilidad</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] border-chrome-border bg-chrome-raised text-chrome-text">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] border-chrome-border bg-chrome-raised text-chrome-text">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground">
          {filteredRisks.length} riesgo{filteredRisks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Risk cards */}
      {filteredRisks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay riesgos que coincidan con los filtros.
        </p>
      ) : (
        filteredRisks.map((risk) => {
          const isExpanded = expandedId === risk.id;
          return (
            <Card
              key={risk.id}
              className={`border-l-4 ${getScoreColor(risk.riskScore)} border-chrome-border bg-chrome-raised`}
            >
              <CardContent className="p-4">
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : risk.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-chrome-text">
                        {risk.title}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getScoreBadgeClass(risk.riskScore)}`}
                      >
                        {risk.riskScore}
                      </span>
                    </div>
                    {risk.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {risk.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-chrome-hover px-2 py-0.5 text-xs text-muted-foreground">
                        {TYPE_LABELS[risk.riskType] || risk.riskType}
                      </span>
                      {risk.affectedStep && (
                        <span className="text-xs text-muted-foreground">
                          Paso: {risk.affectedStep}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <CircleDotIcon
                              key={`s-${i}`}
                              className={`h-3.5 w-3.5 ${i < risk.severity ? "text-red-400" : "text-foreground"}`}
                            />
                          ))}
                        </span>
                        x
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <CircleDotIcon
                              key={`p-${i}`}
                              className={`h-3.5 w-3.5 ${i < risk.probability ? "text-amber-400" : "text-foreground"}`}
                            />
                          ))}
                        </span>
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-4 border-t border-chrome-border pt-4">
                    <MitigationTracker
                      riskId={risk.id}
                      mitigations={risk.mitigations || []}
                      onUpdate={onRiskUpdate}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
