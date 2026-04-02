"use client";

import { ArrowUpDownIcon, AlertTriangleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@shared/components/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FmeaRisk {
  id: string;
  title: string;
  affectedStep: string | null;
  failureMode: string | null;
  failureEffect: string | null;
  severity: number;
  probability: number;
  detection: number | null;
  rpn: number | null;
}

interface FmeaViewProps {
  risks: FmeaRisk[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

type SortKey = "rpn" | "severity" | "probability" | "detection";

function getRpnBadge(rpn: number) {
  if (rpn >= 200) return "bg-destructive/15 text-red-400";
  if (rpn >= 120) return "bg-orientation/15 text-amber-400";
  if (rpn >= 60) return "bg-info/15 text-sky-400";
  return "bg-success/15 text-green-400";
}

function getRpnLabel(rpn: number) {
  if (rpn >= 200) return "Crítico";
  if (rpn >= 120) return "Alto";
  if (rpn >= 60) return "Medio";
  return "Bajo";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FmeaView({ risks }: FmeaViewProps) {
  const t = useTranslations("emptyStates.risks");
  const [sortBy, setSortBy] = useState<SortKey>("rpn");
  const [sortAsc, setSortAsc] = useState(false);

  const fmeaRisks = useMemo(() => {
    const filtered = risks.filter((r) => r.failureMode);
    filtered.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [risks, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  if (fmeaRisks.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangleIcon}
        title={t("noFmea")}
        description={t("noFmeaDesc")}
      />
    );
  }

  const SortHeader = ({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: SortKey;
    className?: string;
  }) => (
    <th
      className={`cursor-pointer select-none px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-chrome-text-secondary ${className || ""}`}
      onClick={() => toggleSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDownIcon
          className={`h-3.5 w-3.5 ${sortBy === sortKey ? "text-blue-400" : "text-muted-foreground"}`}
        />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-chrome-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Actividad
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Modo de Fallo
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Efecto
            </th>
            <SortHeader label="Severidad" sortKey="severity" />
            <SortHeader label="Probabilidad" sortKey="probability" />
            <SortHeader label="Detección" sortKey="detection" />
            <SortHeader label="RPN" sortKey="rpn" className="text-right" />
          </tr>
        </thead>
        <tbody>
          {fmeaRisks.map((risk) => {
            const rpn = risk.rpn ?? risk.severity * risk.probability * (risk.detection ?? 1);
            return (
              <tr
                key={risk.id}
                className="border-b border-chrome-border-subtle transition-colors hover:bg-chrome-raised/50"
              >
                <td className="max-w-[140px] truncate px-3 py-2.5 text-xs text-chrome-text-secondary">
                  {risk.affectedStep || "—"}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-chrome-text-secondary">
                  {risk.failureMode}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-muted-foreground">
                  {risk.failureEffect || "—"}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {risk.severity}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {risk.probability}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {risk.detection ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${getRpnBadge(rpn)}`}
                  >
                    {rpn}
                    <span className="font-normal opacity-70">
                      {getRpnLabel(rpn)}
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
