"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ProcessNode {
  id: string;
  name: string;
  owner: string | null;
  category: string | null;
  description: string | null;
}

interface FlowLink {
  id: string;
  from: string;
  to: string;
  type: string;
  description: string | null;
}

interface Props {
  processes: ProcessNode[];
  links: FlowLink[];
  organizationSlug: string;
}

const NODE_W = 160;
const NODE_H = 48;
const LANE_HEADER_W = 130;
const GAP_X = 40;
const GAP_Y = 16;
const LANE_PADDING = 20;

const linkTypeColors: Record<string, string> = {
  FEEDS: "#2563eb",
  TRIGGERS: "#16a34a",
  DEPENDS: "#d97706",
  HANDOFF: "#dc2626",
};

export function HorizontalFlowVisual({ processes, links, organizationSlug }: Props) {
  const t = useTranslations("deliverables");
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Group processes into swimlanes by owner (department)
  const lanes = new Map<string, ProcessNode[]>();
  for (const proc of processes) {
    // Only include processes that participate in at least one link
    const participates = links.some((l) => l.from === proc.id || l.to === proc.id);
    if (!participates) continue;
    const lane = proc.owner ?? t("noDepartment");
    if (!lanes.has(lane)) lanes.set(lane, []);
    lanes.get(lane)!.push(proc);
  }

  // Topological ordering: processes with no incoming links first
  const incoming = new Map<string, number>();
  for (const link of links) {
    incoming.set(link.to, (incoming.get(link.to) ?? 0) + 1);
  }

  // Simple position assignment: within each lane, order by incoming edges
  const laneEntries = Array.from(lanes.entries());
  const processPositions = new Map<string, { x: number; y: number; lane: number }>();

  let totalHeight = 0;
  for (let li = 0; li < laneEntries.length; li++) {
    const [, procs] = laneEntries[li];
    // Sort: fewer incoming = further left
    procs.sort((a, b) => (incoming.get(a.id) ?? 0) - (incoming.get(b.id) ?? 0));
    const laneY = totalHeight;
    for (let pi = 0; pi < procs.length; pi++) {
      processPositions.set(procs[pi].id, {
        x: LANE_HEADER_W + LANE_PADDING + pi * (NODE_W + GAP_X),
        y: laneY + LANE_PADDING + GAP_Y,
        lane: li,
      });
    }
    const laneHeight = (NODE_H + GAP_Y) + LANE_PADDING * 2;
    totalHeight += laneHeight;
  }

  const maxNodesInLane = Math.max(...laneEntries.map(([, p]) => p.length), 1);
  const svgWidth = LANE_HEADER_W + LANE_PADDING * 2 + maxNodesInLane * (NODE_W + GAP_X) + 40;
  const svgHeight = Math.max(totalHeight + 20, 200);

  // Lane heights
  const laneHeight = (NODE_H + GAP_Y) + LANE_PADDING * 2;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="min-w-full"
        >
          {/* Lane backgrounds */}
          {laneEntries.map(([laneName], li) => {
            const y = li * laneHeight;
            return (
              <g key={laneName}>
                <rect
                  x={0} y={y}
                  width={svgWidth} height={laneHeight}
                  fill={li % 2 === 0 ? "#f8fafc" : "#ffffff"}
                />
                {/* Lane divider */}
                <line x1={0} y1={y} x2={svgWidth} y2={y} stroke="#e2e8f0" strokeWidth={1} />
                {/* Lane label */}
                <text
                  x={12}
                  y={y + laneHeight / 2}
                  dominantBaseline="central"
                  className="text-xs font-semibold"
                  fill="#334155"
                >
                  {laneName.length > 16 ? laneName.slice(0, 14) + "…" : laneName}
                </text>
              </g>
            );
          })}

          {/* Connection arrows */}
          {links.map((link) => {
            const from = processPositions.get(link.from);
            const to = processPositions.get(link.to);
            if (!from || !to) return null;

            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;

            const color = linkTypeColors[link.type] ?? "#94a3b8";
            const isHovered = hoveredLink === link.id;
            const midX = (x1 + x2) / 2;

            return (
              <g
                key={link.id}
                onMouseEnter={() => setHoveredLink(link.id)}
                onMouseLeave={() => setHoveredLink(null)}
                className="cursor-pointer"
              >
                {/* Bezier curve */}
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 1.5}
                  strokeDasharray={link.type === "HANDOFF" ? "6 3" : undefined}
                  opacity={isHovered ? 1 : 0.6}
                />
                {/* Arrow head */}
                <circle cx={x2} cy={y2} r={3} fill={color} opacity={isHovered ? 1 : 0.6} />
                {/* Hover tooltip */}
                {isHovered && link.description && (
                  <g>
                    <rect
                      x={midX - 80} y={Math.min(y1, y2) - 28}
                      width={160} height={22}
                      rx={4} fill="#0f172a" opacity={0.9}
                    />
                    <text
                      x={midX} y={Math.min(y1, y2) - 17}
                      textAnchor="middle" dominantBaseline="central"
                      fill="white" className="text-[10px]"
                    >
                      {link.description.length > 30 ? link.description.slice(0, 28) + "…" : link.description}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Process nodes */}
          {Array.from(processPositions.entries()).map(([procId, pos]) => {
            const proc = processes.find((p) => p.id === procId);
            if (!proc) return null;
            return (
              <g key={procId} transform={`translate(${pos.x}, ${pos.y})`}>
                <rect
                  width={NODE_W} height={NODE_H} rx={6}
                  fill="white" stroke="#e2e8f0" strokeWidth={1}
                />
                <text
                  x={NODE_W / 2} y={18}
                  textAnchor="middle" dominantBaseline="central"
                  className="text-xs font-medium" fill="#0f172a"
                >
                  {proc.name.length > 20 ? proc.name.slice(0, 18) + "…" : proc.name}
                </text>
                <text
                  x={NODE_W / 2} y={34}
                  textAnchor="middle" dominantBaseline="central"
                  className="text-[10px]" fill="#94a3b8"
                >
                  {proc.category ?? "—"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        {Object.entries(linkTypeColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
            {type === "FEEDS" ? "Alimenta" : type === "TRIGGERS" ? "Dispara" : type === "DEPENDS" ? "Depende" : "Handoff"}
          </span>
        ))}
      </div>
    </div>
  );
}
