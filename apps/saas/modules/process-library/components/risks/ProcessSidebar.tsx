"use client";

import { WorkflowIcon, ListIcon } from "lucide-react";
import { useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProcessSummary {
  id: string;
  name: string;
  riskCount: number;
}

interface ProcessSidebarProps {
  processes: ProcessSummary[];
  activeProcessId: string | null;
  onSelect: (processId: string | null) => void;
  totalRiskCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getScoreBg(count: number, maxCount: number): string {
  if (maxCount === 0) return "w-0";
  const pct = Math.round((count / maxCount) * 100);
  return `${pct}%`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProcessSidebar({
  processes,
  activeProcessId,
  onSelect,
  totalRiskCount,
}: ProcessSidebarProps) {
  const maxRiskCount = useMemo(
    () => Math.max(...processes.map((p) => p.riskCount), 1),
    [processes],
  );

  const sortedProcesses = useMemo(
    () => [...processes].sort((a, b) => b.riskCount - a.riskCount),
    [processes],
  );

  return (
    <div className="flex flex-col gap-1">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <WorkflowIcon className="h-3.5 w-3.5" />
        Procesos
      </h3>

      {/* All processes button */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
          activeProcessId === null
            ? "border border-primary/30 bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-chrome-hover hover:text-chrome-text-secondary"
        }`}
      >
        <ListIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate font-medium">Todos</span>
        <span className="shrink-0 tabular-nums text-xs">
          {totalRiskCount}
        </span>
      </button>

      {/* Process list */}
      {sortedProcesses.map((proc) => (
        <button
          key={proc.id}
          type="button"
          onClick={() => onSelect(proc.id)}
          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            activeProcessId === proc.id
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-chrome-hover hover:text-chrome-text-secondary"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{proc.name}</p>
            {/* Mini risk bar */}
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-chrome-hover">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
                style={{ width: getScoreBg(proc.riskCount, maxRiskCount) }}
              />
            </div>
          </div>
          <span className="shrink-0 tabular-nums text-xs font-medium">
            {proc.riskCount}
          </span>
        </button>
      ))}

      {processes.length === 0 && (
        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
          Sin procesos registrados
        </p>
      )}
    </div>
  );
}
