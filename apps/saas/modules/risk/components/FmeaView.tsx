"use client";

import { ArrowUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

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
  if (rpn >= 200) return "bg-red-600/20 text-red-400";
  if (rpn >= 120) return "bg-amber-600/20 text-amber-400";
  if (rpn >= 60) return "bg-sky-500/20 text-sky-400";
  return "bg-green-600/20 text-green-400";
}

function getRpnLabel(rpn: number) {
  if (rpn >= 200) return "Crítico";
  if (rpn >= 120) return "Alto";
  if (rpn >= 60) return "Medio";
  return "Bajo";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FmeaView({ risks }: FmeaViewProps) {
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-400">
          No hay datos FMEA disponibles. El análisis FMEA identifica modos de
          fallo en cada actividad.
        </p>
      </div>
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
      className={`cursor-pointer select-none px-3 py-2 text-left text-xs font-medium text-slate-400 hover:text-slate-200 ${className || ""}`}
      onClick={() => toggleSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDownIcon
          className={`h-3 w-3 ${sortBy === sortKey ? "text-blue-400" : "text-slate-600"}`}
        />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">
              Actividad
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">
              Modo de Fallo
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">
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
                className="border-b border-slate-800 transition-colors hover:bg-slate-800/50"
              >
                <td className="max-w-[140px] truncate px-3 py-2.5 text-xs text-slate-200">
                  {risk.affectedStep || "—"}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-slate-200">
                  {risk.failureMode}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-slate-400">
                  {risk.failureEffect || "—"}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-300">
                  {risk.severity}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-300">
                  {risk.probability}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-300">
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
