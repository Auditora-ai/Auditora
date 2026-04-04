"use client";

import {
  UsersIcon,
  TargetIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

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
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 md:text-xs">
          {label}
        </p>
      </div>
      <p
        className="mt-2 text-2xl font-semibold text-foreground md:text-3xl"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
        {suffix && <span className="text-base text-slate-500 md:text-lg">{suffix}</span>}
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
  const t = useTranslations("evaluaciones.dashboard");

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <KpiCard
        icon={TargetIcon}
        label={t("totalSimulations")}
        value={totalSimulations}
      />
      <KpiCard
        icon={UsersIcon}
        label={t("membersEvaluated")}
        value={membersEvaluated}
      />
      <KpiCard
        icon={CheckCircle2Icon}
        label={t("completionRate")}
        value={completionRate}
        suffix="%"
      />
      <KpiCard
        icon={ClockIcon}
        label={t("avgDuration")}
        value={avgDurationMinutes}
        suffix=" min"
      />
    </div>
  );
}
