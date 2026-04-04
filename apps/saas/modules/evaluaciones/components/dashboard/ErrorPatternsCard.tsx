"use client";

import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorPatternsCardProps {
  errorPatterns: Array<{ pattern: string; count: number }>;
}

export function ErrorPatternsCard({ errorPatterns }: ErrorPatternsCardProps) {
  const t = useTranslations("evaluaciones.dashboard");

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangleIcon className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-medium text-slate-400">
          {t("errorPatternsTitle")}
        </h3>
      </div>

      {errorPatterns.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-800/50 bg-slate-800/30 px-4 py-6">
          <CheckCircle2Icon className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-slate-300">
              {t("noPatterns")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Los patrones de error aparecerán cuando se detecten decisiones
              recurrentes de alto riesgo.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {errorPatterns.map((item) => (
            <div
              key={item.pattern}
              className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-800/30 px-4 py-3 transition-colors hover:bg-slate-800/50"
            >
              <span className="text-sm text-slate-300">{item.pattern}</span>
              <span
                className="ml-3 shrink-0 rounded-full bg-amber-950/50 px-2.5 py-0.5 text-xs font-semibold text-amber-400"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {item.count}×
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
