"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RiskPoint {
  severity: number;
  probability: number;
}

interface RiskHeatMatrixProps {
  risks: RiskPoint[];
  activeCell?: { severity: number; probability: number } | null;
  onCellClick: (severity: number, probability: number) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SEVERITY_LABELS = [
  "Negligible",
  "Menor",
  "Moderado",
  "Mayor",
  "Catastrófico",
];
const PROBABILITY_LABELS = [
  "Raro",
  "Improbable",
  "Posible",
  "Probable",
  "Casi Seguro",
];

function getScoreColor(score: number): string {
  if (score >= 20) return "#DC2626";
  if (score >= 12) return "#D97706";
  if (score >= 6) return "#0EA5E9";
  return "#16A34A";
}

function getScoreColorFill(score: number): string {
  if (score >= 20) return "rgba(220,38,38,0.7)";
  if (score >= 12) return "rgba(217,119,6,0.7)";
  if (score >= 6) return "rgba(14,165,233,0.7)";
  return "rgba(22,163,74,0.7)";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RiskHeatMatrix({
  risks,
  activeCell,
  onCellClick,
}: RiskHeatMatrixProps) {
  const [focusCell, setFocusCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const gridRef = useRef<SVGSVGElement>(null);

  // Build count map
  const countMap = new Map<string, number>();
  for (const r of risks) {
    const key = `${r.severity}-${r.probability}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const PADDING_LEFT = 90;
  const PADDING_BOTTOM = 60;
  const PADDING_TOP = 10;
  const PADDING_RIGHT = 10;
  const CELL_SIZE = 60;
  const GRID_W = 5 * CELL_SIZE;
  const GRID_H = 5 * CELL_SIZE;
  const SVG_W = PADDING_LEFT + GRID_W + PADDING_RIGHT;
  const SVG_H = PADDING_TOP + GRID_H + PADDING_BOTTOM;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusCell) {
        setFocusCell({ row: 0, col: 0 });
        return;
      }
      let { row, col } = focusCell;
      switch (e.key) {
        case "ArrowUp":
          row = Math.min(4, row + 1);
          e.preventDefault();
          break;
        case "ArrowDown":
          row = Math.max(0, row - 1);
          e.preventDefault();
          break;
        case "ArrowRight":
          col = Math.min(4, col + 1);
          e.preventDefault();
          break;
        case "ArrowLeft":
          col = Math.max(0, col - 1);
          e.preventDefault();
          break;
        case "Enter":
        case " ":
          onCellClick(row + 1, col + 1);
          e.preventDefault();
          return;
        default:
          return;
      }
      setFocusCell({ row, col });
    },
    [focusCell, onCellClick],
  );

  return (
    <div className="w-full">
      <svg
        ref={gridRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ maxHeight: 420 }}
        role="grid"
        aria-label="Matriz de riesgos 5x5"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Y-axis label */}
        <text
          x={14}
          y={PADDING_TOP + GRID_H / 2}
          fill="#94A3B8"
          fontSize={11}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${PADDING_TOP + GRID_H / 2})`}
        >
          Severidad
        </text>

        {/* X-axis label */}
        <text
          x={PADDING_LEFT + GRID_W / 2}
          y={SVG_H - 6}
          fill="#94A3B8"
          fontSize={11}
          textAnchor="middle"
        >
          Probabilidad
        </text>

        {/* Y-axis tick labels */}
        {SEVERITY_LABELS.map((label, i) => {
          const y = PADDING_TOP + GRID_H - (i + 0.5) * CELL_SIZE;
          return (
            <text
              key={`sev-${i}`}
              x={PADDING_LEFT - 6}
              y={y + 4}
              fill="#94A3B8"
              fontSize={9}
              textAnchor="end"
            >
              {label}
            </text>
          );
        })}

        {/* X-axis tick labels */}
        {PROBABILITY_LABELS.map((label, i) => {
          const x = PADDING_LEFT + (i + 0.5) * CELL_SIZE;
          return (
            <text
              key={`prob-${i}`}
              x={x}
              y={PADDING_TOP + GRID_H + 16}
              fill="#94A3B8"
              fontSize={9}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Grid cells */}
        {Array.from({ length: 5 }, (_, sevIdx) =>
          Array.from({ length: 5 }, (_, probIdx) => {
            const severity = sevIdx + 1;
            const probability = probIdx + 1;
            const score = severity * probability;
            const count = countMap.get(`${severity}-${probability}`) || 0;
            const x = PADDING_LEFT + probIdx * CELL_SIZE;
            const y = PADDING_TOP + GRID_H - severity * CELL_SIZE;
            const isActive =
              activeCell?.severity === severity &&
              activeCell?.probability === probability;
            const isFocused =
              focusCell?.row === sevIdx && focusCell?.col === probIdx;

            return (
              <g
                key={`${severity}-${probability}`}
                role="gridcell"
                aria-label={`Severidad ${severity}, Probabilidad ${probability}, ${count} riesgos, puntuación ${score}`}
                style={{ cursor: "pointer" }}
                onClick={() => onCellClick(severity, probability)}
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={count > 0 ? getScoreColorFill(score) : "transparent"}
                  stroke={
                    isActive || isFocused ? "#00E5C0" : "#334155"
                  }
                  strokeWidth={isActive || isFocused ? 3 : 1}
                  rx={4}
                />
                {count > 0 && (
                  <text
                    x={x + CELL_SIZE / 2}
                    y={y + CELL_SIZE / 2 + 5}
                    fill="#F1F5F9"
                    fontSize={16}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {count}
                  </text>
                )}
                {/* Score label top-right */}
                <text
                  x={x + CELL_SIZE - 6}
                  y={y + 14}
                  fill={count > 0 ? "#F1F5F9" : "#475569"}
                  fontSize={8}
                  textAnchor="end"
                  opacity={0.7}
                >
                  {score}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
