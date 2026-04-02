"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { Badge } from "@repo/ui/components/badge";
import {
  AlertTriangleIcon,
  CircleDotIcon,
  ShieldCheckIcon,
  WorkflowIcon,
} from "lucide-react";
import { ControlMapping } from "./ControlMapping";
import { MitigationTracker } from "./MitigationTracker";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RiskData {
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

interface RiskDetailSheetProps {
  risk: RiskData | null;
  onClose: () => void;
  onUpdate: () => void;
}

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

function getScoreBadge(score: number) {
  if (score >= 20) return "bg-red-600/20 text-red-400";
  if (score >= 12) return "bg-amber-600/20 text-amber-400";
  if (score >= 6) return "bg-sky-500/20 text-sky-400";
  return "bg-green-600/20 text-green-400";
}

function getScoreLabel(score: number) {
  if (score >= 20) return "Crítico";
  if (score >= 12) return "Alto";
  if (score >= 6) return "Medio";
  return "Bajo";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskDetailSheet({
  risk,
  onClose,
  onUpdate,
}: RiskDetailSheetProps) {
  if (!risk) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent />
      </Sheet>
    );
  }

  return (
    <Sheet open={!!risk} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-chrome-border bg-chrome-base sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-chrome-text">{risk.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Score badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${getScoreBadge(risk.riskScore)}`}
            >
              <AlertTriangleIcon className="h-4 w-4" />
              {risk.riskScore} — {getScoreLabel(risk.riskScore)}
            </span>
            <span className="rounded-full bg-chrome-hover px-2 py-0.5 text-xs text-muted-foreground">
              {STATUS_LABELS[risk.status] || risk.status}
            </span>
          </div>

          {/* Description */}
          {risk.description && (
            <p className="text-sm leading-relaxed text-chrome-text-secondary">
              {risk.description}
            </p>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <p className="mt-1 text-sm font-medium text-chrome-text">
                {TYPE_LABELS[risk.riskType] || risk.riskType}
              </p>
            </div>
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3">
              <span className="text-xs text-muted-foreground">Proceso</span>
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-primary">
                <WorkflowIcon className="h-3.5 w-3.5" />
                {risk.processName}
              </p>
            </div>
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3">
              <span className="text-xs text-muted-foreground">Severidad</span>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <CircleDotIcon
                    key={i}
                    className={`h-4 w-4 ${i < risk.severity ? "text-red-400" : "text-chrome-hover"}`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium text-chrome-text tabular-nums">
                  {risk.severity}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3">
              <span className="text-xs text-muted-foreground">Probabilidad</span>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <CircleDotIcon
                    key={i}
                    className={`h-4 w-4 ${i < risk.probability ? "text-amber-400" : "text-chrome-hover"}`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium text-chrome-text tabular-nums">
                  {risk.probability}
                </span>
              </div>
            </div>
          </div>

          {/* Affected node */}
          {(risk.affectedNode || risk.affectedStep) && (
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3">
              <span className="text-xs text-muted-foreground">
                Nodo BPMN afectado
              </span>
              <p className="mt-1 flex items-center gap-2 text-sm text-chrome-text">
                {risk.affectedNode ? (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 border border-blue-500/20">
                    <CircleDotIcon className="h-3 w-3 text-blue-400" />
                    <span className="text-blue-300">
                      {risk.affectedNode.label}
                    </span>
                  </span>
                ) : (
                  <span>{risk.affectedStep}</span>
                )}
              </p>
            </div>
          )}

          {/* FMEA info */}
          {risk.failureMode && (
            <div className="rounded-lg border border-chrome-border bg-chrome-raised p-3 space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Análisis FMEA
              </span>
              <div>
                <span className="text-xs text-muted-foreground">
                  Modo de fallo:
                </span>
                <p className="text-sm text-chrome-text-secondary">
                  {risk.failureMode}
                </p>
              </div>
              {risk.failureEffect && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Efecto:
                  </span>
                  <p className="text-sm text-chrome-text-secondary">
                    {risk.failureEffect}
                  </p>
                </div>
              )}
              {risk.rpn != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">RPN:</span>
                  <span className="font-bold text-sm text-chrome-text">
                    {risk.rpn}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="border-t border-chrome-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-chrome-text">
                Controles
              </h3>
            </div>
            <ControlMapping
              riskId={risk.id}
              risk={{
                id: risk.id,
                severity: risk.severity,
                probability: risk.probability,
                riskScore: risk.riskScore,
                residualSeverity: risk.residualSeverity,
                residualProbability: risk.residualProbability,
                residualScore: risk.residualScore,
              }}
              controls={risk.controls}
              onUpdate={onUpdate}
            />
          </div>

          {/* Mitigations */}
          <div className="border-t border-chrome-border pt-4">
            <MitigationTracker
              riskId={risk.id}
              mitigations={risk.mitigations}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
