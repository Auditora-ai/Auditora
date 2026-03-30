"use client";

import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Button } from "@repo/ui/components/button";
import {
  SearchIcon,
  XIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@shared/components/EmptyState";
import { OrgRiskStatCards } from "./OrgRiskStatCards";
import { ProcessSidebar } from "./ProcessSidebar";
import { RiskHeatMatrix } from "./RiskHeatMatrix";
import { RiskRegister } from "./RiskRegister";
import { OrgFmeaView } from "./OrgFmeaView";
import { OpportunityRegister } from "./OpportunityRegister";
import { RiskDetailSheet } from "./RiskDetailSheet";

// ─── Types (exported for page.tsx) ──────────────────────────────────────────

export interface OrgRiskData {
  id: string;
  title: string;
  description: string | null;
  riskType: string;
  severity: number;
  probability: number;
  riskScore: number;
  affectedStep: string | null;
  affectedNode: { id: string; label: string; nodeType: string } | null;
  status: string;
  isOpportunity: boolean;
  failureMode: string | null;
  failureEffect: string | null;
  detectionDifficulty: number | null;
  rpn: number | null;
  opportunityValue: number | null;
  residualSeverity: number | null;
  residualProbability: number | null;
  residualScore: number | null;
  mitigations: Array<{
    id: string;
    action: string;
    owner: string | null;
    deadline: string | null;
    status: string;
  }>;
  controls: Array<{
    id: string;
    name: string;
    controlType: string;
    effectiveness: string;
    automated: boolean;
  }>;
  processId: string;
  processName: string;
}

export interface ProcessSummary {
  id: string;
  name: string;
  riskCount: number;
}

export interface RiskStats {
  total: number;
  critical: number;
  high: number;
  avgScore: number;
  opportunities: number;
}

type Tab = "registro" | "fmea" | "oportunidades";

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  OPERATIONAL: "Operacional",
  COMPLIANCE: "Cumplimiento",
  FINANCIAL: "Financiero",
  STRATEGIC: "Estratégico",
  REPUTATIONAL: "Reputacional",
  TECHNOLOGY: "Tecnología",
  HUMAN_RESOURCE: "Recurso Humano",
};

const STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identificado",
  ASSESSED: "Evaluado",
  MITIGATING: "En Mitigación",
  ACCEPTED: "Aceptado",
  CLOSED: "Cerrado",
};

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "registro", label: "Registro" },
  { key: "fmea", label: "FMEA" },
  { key: "oportunidades", label: "Oportunidades" },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface OrgRisksDashboardProps {
  risks: OrgRiskData[];
  processes: ProcessSummary[];
  stats: RiskStats;
  organizationSlug: string;
}

export function OrgRisksDashboard({
  risks,
  processes,
  stats,
  organizationSlug,
}: OrgRisksDashboardProps) {
  const router = useRouter();

  // ─── State ──────────────────────────────────────────────────────────
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<{
    severity: number;
    probability: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("registro");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  // ─── Debounced search ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Filter chain ───────────────────────────────────────────────────
  const filteredRisks = useMemo(() => {
    let result = risks;

    if (activeProcessId) {
      result = result.filter((r) => r.processId === activeProcessId);
    }
    if (activeCell) {
      result = result.filter(
        (r) =>
          r.severity === activeCell.severity &&
          r.probability === activeCell.probability,
      );
    }
    if (filterType !== "all") {
      result = result.filter((r) => r.riskType === filterType);
    }
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.processName.toLowerCase().includes(q),
      );
    }

    return result;
  }, [
    risks,
    activeProcessId,
    activeCell,
    filterType,
    filterStatus,
    debouncedSearch,
  ]);

  // ─── Filtered stats (recalc when filters change) ───────────────────
  const filteredStats = useMemo(() => {
    const active = filteredRisks.filter((r) => r.status !== "CLOSED");
    return {
      total: active.length,
      critical: active.filter((r) => r.riskScore >= 20).length,
      high: active.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length,
      avgScore:
        active.length > 0
          ? Math.round(
              (active.reduce((s, r) => s + r.riskScore, 0) / active.length) *
                10,
            ) / 10
          : 0,
      opportunities: filteredRisks.filter((r) => r.isOpportunity).length,
    };
  }, [filteredRisks]);

  // ─── Heat map data ─────────────────────────────────────────────────
  const heatRisks = useMemo(
    () =>
      filteredRisks
        .filter((r) => !r.isOpportunity)
        .map((r) => ({ severity: r.severity, probability: r.probability })),
    [filteredRisks],
  );

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleCellClick = useCallback(
    (severity: number, probability: number) => {
      if (
        activeCell?.severity === severity &&
        activeCell?.probability === probability
      ) {
        setActiveCell(null);
      } else {
        setActiveCell({ severity, probability });
      }
    },
    [activeCell],
  );

  const clearFilters = useCallback(() => {
    setActiveProcessId(null);
    setActiveCell(null);
    setFilterType("all");
    setFilterStatus("all");
    setSearchInput("");
  }, []);

  const handleRiskUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  const selectedRisk = useMemo(
    () => risks.find((r) => r.id === selectedRiskId) ?? null,
    [risks, selectedRiskId],
  );

  const hasActiveFilters =
    activeProcessId !== null ||
    activeCell !== null ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    debouncedSearch !== "";

  // ─── Active process name for display ───────────────────────────────
  const activeProcessName = activeProcessId
    ? processes.find((p) => p.id === activeProcessId)?.name ?? null
    : null;

  return (
    <>
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Riesgos Operativos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista consolidada de riesgos en todos los procesos de la organización
        </p>
      </div>

      {/* Stat cards — always show global stats */}
      <OrgRiskStatCards stats={hasActiveFilters ? filteredStats : stats} />

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Process sidebar — desktop only */}
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-6">
            <ProcessSidebar
              processes={processes}
              activeProcessId={activeProcessId}
              onSelect={setActiveProcessId}
              totalRiskCount={risks.length}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Mobile process selector */}
          <div className="lg:hidden">
            <Select
              value={activeProcessId ?? "all"}
              onValueChange={(v) =>
                setActiveProcessId(v === "all" ? null : v)
              }
            >
              <SelectTrigger className="border-chrome-border bg-chrome-raised text-chrome-text">
                <SelectValue placeholder="Todos los procesos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los procesos</SelectItem>
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.riskCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Heat map */}
          <div className="rounded-xl border border-chrome-border bg-chrome-raised p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-chrome-text">
                Matriz de Riesgo
                {activeProcessName && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    — {activeProcessName}
                  </span>
                )}
              </h2>
              {activeCell && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => setActiveCell(null)}
                >
                  <XIcon className="mr-1 h-3 w-3" />
                  Limpiar celda
                </Button>
              )}
            </div>
            <RiskHeatMatrix
              risks={heatRisks}
              activeCell={activeCell}
              onCellClick={handleCellClick}
            />
          </div>

          {/* Search + filters toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar riesgos..."
                className="border-chrome-border bg-chrome-raised pl-9 text-sm text-chrome-text"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] border-chrome-border bg-chrome-raised text-sm text-chrome-text">
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
              <SelectTrigger className="w-[150px] border-chrome-border bg-chrome-raised text-sm text-chrome-text">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                <XIcon className="mr-1 h-3 w-3" />
                Limpiar filtros
              </Button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {filteredRisks.filter((r) => !r.isOpportunity).length} riesgo
              {filteredRisks.filter((r) => !r.isOpportunity).length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabs */}
          <div className="border-b border-chrome-border">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-chrome-text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {risks.length === 0 ? (
            <EmptyState
              icon={ShieldAlertIcon}
              title="Sin riesgos identificados"
              description="Los riesgos se identifican automáticamente durante las sesiones de descubrimiento, o puedes analizarlos desde cada proceso."
            />
          ) : (
            <>
              {activeTab === "registro" && (
                <RiskRegister
                  risks={filteredRisks.filter((r) => !r.isOpportunity)}
                  onRiskUpdate={handleRiskUpdate}
                  processId=""
                  processName={activeProcessId ? undefined : "show"}
                  onRiskClick={setSelectedRiskId}
                />
              )}

              {activeTab === "fmea" && (
                <OrgFmeaView
                  risks={filteredRisks}
                />
              )}

              {activeTab === "oportunidades" && (
                <OpportunityRegister
                  risks={filteredRisks.filter((r) => r.isOpportunity)}
                  onRiskUpdate={handleRiskUpdate}
                  processId=""
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Risk detail sheet */}
      <RiskDetailSheet
        risk={selectedRisk}
        onClose={() => setSelectedRiskId(null)}
        onUpdate={handleRiskUpdate}
      />
    </>
  );
}
