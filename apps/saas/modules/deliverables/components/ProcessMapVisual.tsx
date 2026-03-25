"use client";

import { useState } from "react";
import Link from "next/link";

interface ProcessNode {
  id: string;
  name: string;
  category: string | null;
  owner: string | null;
  status: string;
  description: string | null;
  sessions: number;
  risks: number;
  raciEntries: number;
}

interface ProcessLink {
  fromProcessId: string;
  toProcessId: string;
  linkType: string;
}

interface Props {
  processes: ProcessNode[];
  links: ProcessLink[];
  organizationSlug: string;
}

const NODE_W = 180;
const NODE_H = 56;
const GAP_X = 32;
const GAP_Y = 20;
const BAND_PADDING = 24;
const BAND_LABEL_W = 120;

const statusColors: Record<string, { fill: string; stroke: string }> = {
  APPROVED: { fill: "#dcfce7", stroke: "#16a34a" },
  VALIDATED: { fill: "#dbeafe", stroke: "#2563eb" },
  MAPPED: { fill: "#e0e7ff", stroke: "#4f46e5" },
  DRAFT: { fill: "#f8fafc", stroke: "#cbd5e1" },
};

const bandConfig = [
  { key: "strategic", label: "Estrategicos", color: "#a855f7", bg: "#faf5ff" },
  { key: "core", label: "Core", color: "#2563eb", bg: "#eff6ff" },
  { key: "support", label: "Soporte", color: "#64748b", bg: "#f8fafc" },
] as const;

export function ProcessMapVisual({ processes, links, organizationSlug }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Group processes by band
  const bands = bandConfig.map((band) => {
    const procs = processes.filter((p) => p.category === band.key);
    // Also include uncategorized in "core" as fallback
    if (band.key === "core") {
      const uncategorized = processes.filter(
        (p) => !p.category || !["strategic", "core", "support"].includes(p.category),
      );
      procs.push(...uncategorized);
    }
    return { ...band, processes: procs };
  });

  // Calculate layout
  const maxPerBand = Math.max(...bands.map((b) => b.processes.length), 1);
  const svgWidth = BAND_LABEL_W + maxPerBand * (NODE_W + GAP_X) + BAND_PADDING * 2;
  const bandHeights = bands.map((b) => Math.max(1, b.processes.length > 0 ? 1 : 0) * (NODE_H + GAP_Y) + BAND_PADDING * 2);
  const svgHeight = bandHeights.reduce((s, h) => s + h, 0) + GAP_Y * 2;

  // Position nodes
  const nodePositions = new Map<string, { x: number; y: number }>();
  let bandY = GAP_Y;
  for (let bi = 0; bi < bands.length; bi++) {
    const band = bands[bi];
    const startX = BAND_LABEL_W + BAND_PADDING;
    for (let i = 0; i < band.processes.length; i++) {
      const col = i % maxPerBand;
      const row = Math.floor(i / maxPerBand);
      nodePositions.set(band.processes[i].id, {
        x: startX + col * (NODE_W + GAP_X),
        y: bandY + BAND_PADDING + row * (NODE_H + GAP_Y),
      });
    }
    bandY += bandHeights[bi];
  }

  // Connected process IDs for hover highlight
  const connectedIds = new Set<string>();
  if (hoveredId) {
    for (const link of links) {
      if (link.fromProcessId === hoveredId) connectedIds.add(link.toProcessId);
      if (link.toProcessId === hoveredId) connectedIds.add(link.fromProcessId);
    }
  }

  const selectedProcess = selectedId ? processes.find((p) => p.id === selectedId) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
        >
          {/* Band backgrounds */}
          {(() => {
            let y = GAP_Y;
            return bands.map((band, bi) => {
              const bandEl = (
                <g key={band.key}>
                  {/* Band background */}
                  <rect
                    x={0}
                    y={y}
                    width={svgWidth}
                    height={bandHeights[bi]}
                    fill={band.bg}
                    rx={0}
                  />
                  {/* Band left border accent */}
                  <rect
                    x={0}
                    y={y}
                    width={4}
                    height={bandHeights[bi]}
                    fill={band.color}
                  />
                  {/* Band label */}
                  <text
                    x={16}
                    y={y + bandHeights[bi] / 2}
                    dominantBaseline="central"
                    className="text-xs font-semibold"
                    fill={band.color}
                  >
                    {band.label}
                  </text>
                  {/* Process count */}
                  <text
                    x={16}
                    y={y + bandHeights[bi] / 2 + 16}
                    dominantBaseline="central"
                    className="text-[10px]"
                    fill="#94a3b8"
                  >
                    {band.processes.length} procesos
                  </text>
                </g>
              );
              y += bandHeights[bi];
              return bandEl;
            });
          })()}

          {/* Connection lines */}
          {links.map((link, i) => {
            const from = nodePositions.get(link.fromProcessId);
            const to = nodePositions.get(link.toProcessId);
            if (!from || !to) return null;
            const isHighlighted = hoveredId === link.fromProcessId || hoveredId === link.toProcessId;
            return (
              <line
                key={i}
                x1={from.x + NODE_W / 2}
                y1={from.y + NODE_H / 2}
                x2={to.x + NODE_W / 2}
                y2={to.y + NODE_H / 2}
                stroke={isHighlighted ? "#2563eb" : "#e2e8f0"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={link.linkType === "HANDOFF" ? "6 3" : undefined}
                opacity={hoveredId && !isHighlighted ? 0.2 : 1}
              />
            );
          })}

          {/* Process nodes */}
          {processes.map((proc) => {
            const pos = nodePositions.get(proc.id);
            if (!pos) return null;
            const st = statusColors[proc.status] ?? statusColors.DRAFT;
            const isHovered = hoveredId === proc.id;
            const isConnected = connectedIds.has(proc.id);
            const dimmed = hoveredId && !isHovered && !isConnected;

            return (
              <g
                key={proc.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(proc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(selectedId === proc.id ? null : proc.id)}
                opacity={dimmed ? 0.3 : 1}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isHovered ? "#eff6ff" : st.fill}
                  stroke={isHovered ? "#2563eb" : st.stroke}
                  strokeWidth={isHovered || selectedId === proc.id ? 2 : 1}
                />
                <text
                  x={NODE_W / 2}
                  y={20}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-medium"
                  fill="#0f172a"
                >
                  {proc.name.length > 22 ? proc.name.slice(0, 20) + "…" : proc.name}
                </text>
                <text
                  x={NODE_W / 2}
                  y={38}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px]"
                  fill="#94a3b8"
                >
                  {proc.owner ?? "Sin owner"} · {proc.sessions}s · {proc.risks}r
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected process detail popup */}
      {selectedProcess && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{selectedProcess.name}</h3>
              {selectedProcess.description && (
                <p className="text-xs text-slate-500 mt-1">{selectedProcess.description}</p>
              )}
              <div className="flex gap-4 mt-2 text-xs text-slate-600">
                <span>Owner: {selectedProcess.owner ?? "—"}</span>
                <span>{selectedProcess.sessions} sesiones</span>
                <span>{selectedProcess.raciEntries} RACI</span>
                <span>{selectedProcess.risks} riesgos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/${organizationSlug}/procesos/${selectedProcess.id}`}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver proceso →
              </Link>
              <button
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        {Object.entries(statusColors).map(([status, colors]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: colors.fill, border: `1px solid ${colors.stroke}` }} />
            {status === "APPROVED" ? "Aprobado" : status === "VALIDATED" ? "Validado" : status === "MAPPED" ? "Mapeado" : "Borrador"}
          </span>
        ))}
      </div>
    </div>
  );
}
