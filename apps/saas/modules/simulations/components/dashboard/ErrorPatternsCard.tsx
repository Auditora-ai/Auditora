"use client";

import { AlertTriangleIcon } from "lucide-react";

interface ErrorPatternsCardProps {
  errorPatterns: Array<{ pattern: string; count: number }>;
}

export function ErrorPatternsCard({ errorPatterns }: ErrorPatternsCardProps) {
  const maxCount = errorPatterns.length > 0 ? errorPatterns[0]!.count : 1;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangleIcon className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-medium text-slate-400">
          Patrones de Error Frecuentes
        </h3>
      </div>
      {errorPatterns.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Sin patrones detectados
        </p>
      ) : (
        <div className="space-y-3">
          {errorPatterns.map(({ pattern, count }) => (
            <div key={pattern}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-slate-300">{pattern}</span>
                <span
                  className="text-xs text-slate-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {count}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-red-950/30">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
