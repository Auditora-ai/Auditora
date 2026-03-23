"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  PlusIcon,
  XIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Mitigation {
  id: string;
  action: string;
  owner: string | null;
  deadline: string | null;
  status: string;
}

interface MitigationTrackerProps {
  riskId: string;
  mitigations: Mitigation[];
  onUpdate: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_FLOW = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PLANNED: {
    label: "Planeado",
    className: "bg-slate-700 text-slate-300",
  },
  IN_PROGRESS: {
    label: "En Progreso",
    className: "bg-blue-600/20 text-blue-400",
  },
  COMPLETED: {
    label: "Completado",
    className: "bg-green-600/20 text-green-400",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-600/20 text-red-400",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function MitigationTracker({
  riskId,
  mitigations,
  onUpdate,
}: MitigationTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newAction, setNewAction] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cycleStatus = async (mitigation: Mitigation) => {
    const currentIdx = STATUS_FLOW.indexOf(
      mitigation.status as (typeof STATUS_FLOW)[number],
    );
    const nextIdx = (currentIdx + 1) % STATUS_FLOW.length;
    const nextStatus = STATUS_FLOW[nextIdx];

    try {
      await fetch(`/api/risks/${riskId}/mitigations/${mitigation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      onUpdate();
    } catch (error) {
      console.error("Failed to update mitigation status:", error);
    }
  };

  const handleAdd = async () => {
    if (!newAction.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/risks/${riskId}/mitigations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: newAction.trim(),
          owner: newOwner.trim() || null,
          deadline: newDeadline || null,
        }),
      });
      setNewAction("");
      setNewOwner("");
      setNewDeadline("");
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to add mitigation:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mitigationId: string) => {
    try {
      await fetch(`/api/risks/${riskId}/mitigations/${mitigationId}`, {
        method: "DELETE",
      });
      setConfirmDeleteId(null);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete mitigation:", error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-medium text-slate-300">Mitigaciones</h5>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-slate-400 hover:text-slate-200"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>

      {/* Existing mitigations */}
      {mitigations.length === 0 && !showForm && (
        <p className="text-xs text-slate-500">Sin mitigaciones definidas.</p>
      )}

      {mitigations.map((m) => {
        const config = STATUS_CONFIG[m.status] || STATUS_CONFIG.PLANNED;
        return (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded bg-slate-900/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-200">{m.action}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                {m.owner && <span>{m.owner}</span>}
                {m.deadline && (
                  <span>
                    {new Date(m.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => cycleStatus(m)}
              className={`shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${config.className}`}
              title="Click para cambiar estado"
            >
              {config.label}
            </button>
            {confirmDeleteId === m.id ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-xs text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(m.id)}
                >
                  Sí
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-xs text-slate-400"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  No
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(m.id)}
                className="shrink-0 text-slate-600 transition-colors hover:text-red-400"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {showForm && (
        <div className="space-y-2 rounded border border-slate-700 bg-slate-900/50 p-3">
          <Input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Acción de mitigación..."
            className="border-slate-700 bg-slate-800 text-sm text-slate-100"
          />
          <div className="flex gap-2">
            <Input
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="Responsable"
              className="border-slate-700 bg-slate-800 text-sm text-slate-100"
            />
            <Input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="border-slate-700 bg-slate-800 text-sm text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setNewAction("");
                setNewOwner("");
                setNewDeadline("");
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newAction.trim() || saving}
            >
              {saving ? (
                <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
