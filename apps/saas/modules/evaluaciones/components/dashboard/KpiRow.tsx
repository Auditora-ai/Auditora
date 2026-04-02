"use client";

import {
  UsersIcon,
  TargetIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiRowProps {
  totalSimulations: number;
  membersEvaluated: number;
  completionRate: number;
  avgDurationMinutes: number;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p
        className="mt-2 text-3xl font-semibold text-foreground"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
        {suffix && <span className="text-lg text-slate-500">{suffix}</span>}
      </p>
    </div>
  );
}

export function KpiRow({
  totalSimulations,
  membersEvaluated,
  completionRate,
  avgDurationMinutes,
}: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        icon={TargetIcon}
        label="Total Simulaciones"
        value={totalSimulations}
      />
      <KpiCard
        icon={UsersIcon}
        label="Miembros Evaluados"
        value={membersEvaluated}
      />
      <KpiCard
        icon={CheckCircle2Icon}
        label="Tasa de Completado"
        value={completionRate}
        suffix="%"
      />
      <KpiCard
        icon={ClockIcon}
        label="Tiempo Promedio"
        value={avgDurationMinutes}
        suffix=" min"
      />
    </div>
  );
}
