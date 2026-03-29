"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  PlusIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Control {
  id: string;
  name: string;
  controlType: string;
  effectiveness: string;
  automated: boolean;
}

interface RiskData {
  id: string;
  severity: number;
  probability: number;
  riskScore: number;
  residualSeverity: number | null;
  residualProbability: number | null;
  residualScore: number | null;
}

interface ControlMappingProps {
  riskId: string;
  risk: RiskData;
  controls: Control[];
  onUpdate: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CONTROL_TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PREVENTIVE: {
    label: "Preventivo",
    className: "bg-blue-600/20 text-blue-400",
  },
  DETECTIVE: {
    label: "Detectivo",
    className: "bg-amber-600/20 text-amber-400",
  },
  CORRECTIVE: {
    label: "Correctivo",
    className: "bg-red-600/20 text-red-400",
  },
};

const EFFECTIVENESS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  HIGH: {
    label: "Alta",
    className: "bg-green-600/20 text-green-400",
  },
  MEDIUM: {
    label: "Media",
    className: "bg-amber-600/20 text-amber-400",
  },
  LOW: {
    label: "Baja",
    className: "bg-red-600/20 text-red-400",
  },
};

function getScoreClass(score: number) {
  if (score >= 20) return "text-red-400";
  if (score >= 12) return "text-amber-400";
  if (score >= 6) return "text-sky-400";
  return "text-green-400";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ControlMapping({
  riskId,
  risk,
  controls,
  onUpdate,
}: ControlMappingProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("PREVENTIVE");
  const [newEffectiveness, setNewEffectiveness] = useState<string>("MEDIUM");
  const [newAutomated, setNewAutomated] = useState(false);
  const [saving, setSaving] = useState(false);

  const inherentScore = risk.severity * risk.probability;
  const resSev = risk.residualSeverity ?? risk.severity;
  const resProb = risk.residualProbability ?? risk.probability;
  const resScore = risk.residualScore ?? resSev * resProb;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/risks/${riskId}/controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          controlType: newType,
          effectiveness: newEffectiveness,
          automated: newAutomated,
        }),
      });
      setNewName("");
      setNewType("PREVENTIVE");
      setNewEffectiveness("MEDIUM");
      setNewAutomated(false);
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to add control:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="rounded-lg border border-chrome-border bg-chrome-base/50 p-4">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Riesgo Inherente:</span>
          <span className={`font-bold ${getScoreClass(inherentScore)}`}>
            {risk.severity}x{risk.probability}={inherentScore}
          </span>
          <span className="text-muted-foreground mx-2">&rarr;</span>
          <span className="text-muted-foreground">Residual:</span>
          <span className={`font-bold ${getScoreClass(resScore)}`}>
            {resSev}x{resProb}={resScore}
          </span>
        </div>
        {controls.length > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-chrome-hover">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-600 to-blue-600 transition-all"
              style={{
                width: `${Math.max(0, Math.min(100, ((inherentScore - resScore) / inherentScore) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Controls list */}
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-medium text-muted-foreground">
          Controles ({controls.length})
        </h5>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground hover:text-chrome-text-secondary"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusIcon className="mr-1 h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>

      {controls.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">
          Sin controles definidos. Agrega controles para reducir el riesgo
          residual.
        </p>
      )}

      {controls.map((ctrl) => {
        const typeConfig =
          CONTROL_TYPE_CONFIG[ctrl.controlType] ||
          CONTROL_TYPE_CONFIG.PREVENTIVE;
        const effConfig =
          EFFECTIVENESS_CONFIG[ctrl.effectiveness] ||
          EFFECTIVENESS_CONFIG.MEDIUM;

        return (
          <div
            key={ctrl.id}
            className="flex items-center gap-3 rounded bg-chrome-base/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-chrome-text-secondary">
                {ctrl.name}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.className}`}
            >
              {typeConfig.label}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${effConfig.className}`}
            >
              {effConfig.label}
            </span>
            {ctrl.automated && (
              <span
                className="shrink-0 text-blue-400"
                title="Automatizado"
              >
                <ZapIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showForm && (
        <div className="space-y-2 rounded border border-chrome-border bg-chrome-base/50 p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del control..."
            className="border-chrome-border bg-chrome-raised text-sm text-chrome-text"
          />
          <div className="flex gap-2">
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger className="border-chrome-border bg-chrome-raised text-sm text-chrome-text">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTROL_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newEffectiveness} onValueChange={setNewEffectiveness}>
              <SelectTrigger className="border-chrome-border bg-chrome-raised text-sm text-chrome-text">
                <SelectValue placeholder="Efectividad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EFFECTIVENESS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={newAutomated}
              onChange={(e) => setNewAutomated(e.target.checked)}
              className="rounded border-chrome-border"
            />
            Control automatizado
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setNewName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || saving}
            >
              {saving ? (
                <RefreshCwIcon className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
