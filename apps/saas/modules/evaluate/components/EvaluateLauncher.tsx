"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import {
  CheckIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";
import type { EvaluationProcess, TeamMember } from "@evaluate/data/mock-evaluation";

// ─── Score color helper ────────────────────────────────────
function rpnColor(rpn: number): string {
  if (rpn >= 200) return "bg-red-500/15 text-red-500 border-red-500/30";
  if (rpn >= 150) return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
}

// ─── Avatar placeholder ────────────────────────────────────
function MemberAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
      {initials}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
interface EvaluateLauncherProps {
  process: EvaluationProcess;
}

export function EvaluateLauncher({ process }: EvaluateLauncherProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isSent, setIsSent] = useState(false);
  const [completedCount, setCompletedCount] = useState(3);

  const toggleMember = useCallback((memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedMembers.size === process.teamMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(process.teamMembers.map((m) => m.id)));
    }
  }, [selectedMembers.size, process.teamMembers]);

  const handleSend = useCallback(() => {
    if (selectedMembers.size === 0) return;
    setIsSent(true);
  }, [selectedMembers.size]);

  const allSelected = selectedMembers.size === process.teamMembers.length;

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:gap-6 md:p-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
          {process.processName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:text-sm">
          <span className="inline-flex items-center gap-1">
            <ClipboardListIcon className="h-3.5 w-3.5" />
            {process.stepCount} pasos
          </span>
          <span>&middot;</span>
          <span className="inline-flex items-center gap-1">
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            {process.riskCount} riesgos identificados
          </span>
        </div>
      </div>

      {/* ── Progress tracker (after sending) ───────────── */}
      {isSent && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progreso de evaluaciones</span>
            <span className="tabular-nums text-muted-foreground">
              {completedCount}/{selectedMembers.size} personas han completado
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / selectedMembers.size) * 100}%`,
                backgroundColor: "var(--palette-action, #3B8FE8)",
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {process.teamMembers
              .filter((m) => selectedMembers.has(m.id))
              .map((member, idx) => {
                const completed = idx < completedCount;
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                      completed
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-border/50 bg-card text-muted-foreground",
                    )}
                  >
                    <MemberAvatar initials={member.initials} />
                    <span>{member.name}</span>
                    {completed && <CheckIcon className="h-3.5 w-3.5" />}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Quien evaluas ──────────────────────────────── */}
      {!isSent && (
        <>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground md:text-base">
                <UsersIcon className="mr-1.5 inline h-4 w-4 align-text-bottom" />
                ¿Quien evaluas?
              </h2>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium transition-colors hover:text-foreground"
                style={{ color: "var(--palette-action, #3B8FE8)" }}
              >
                {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
            </div>

            <div className="grid gap-2">
              {process.teamMembers.map((member) => {
                const isSelected = selectedMembers.has(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.98] md:p-4",
                      isSelected
                        ? "border-[var(--palette-action,#3B8FE8)] bg-[var(--palette-action,#3B8FE8)]/5"
                        : "border-border/50 bg-card hover:border-border",
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                        isSelected
                          ? "border-[var(--palette-action,#3B8FE8)] bg-[var(--palette-action,#3B8FE8)]"
                          : "border-muted-foreground/40 bg-transparent",
                      )}
                    >
                      {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                    </div>

                    {/* Avatar */}
                    <MemberAvatar initials={member.initials} />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <span
                        className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "var(--palette-action, #3B8FE8)",
                          color: "white",
                          opacity: 0.85,
                        }}
                      >
                        {member.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Escenarios basados en (FMEA risks) ───────── */}
          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground md:text-base">
              <AlertTriangleIcon className="mr-1.5 inline h-4 w-4 align-text-bottom" />
              Escenarios basados en
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {process.risks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3"
                >
                  <span className="text-xs text-foreground leading-snug pr-2">
                    {risk.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                      rpnColor(risk.rpn),
                    )}
                  >
                    RPN {risk.rpn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Send button ────────────────────────────── */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSend}
            disabled={selectedMembers.size === 0}
            className="w-full rounded-xl text-base font-semibold"
            style={{
              backgroundColor:
                selectedMembers.size > 0
                  ? "var(--palette-action, #3B8FE8)"
                  : undefined,
            }}
          >
            <SendIcon className="mr-2 h-4 w-4" />
            Generar y enviar evaluacion
          </Button>

          {selectedMembers.size === 0 && (
            <p className="text-center text-xs text-muted-foreground -mt-3">
              Selecciona al menos una persona para continuar
            </p>
          )}
        </>
      )}
    </div>
  );
}
