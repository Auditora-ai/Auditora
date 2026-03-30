import type { DashboardData, ProfileItem, ProcessHeatmapRow } from "@simulations/lib/dashboard-queries";

export interface HumanRiskReportInput {
  organizationName: string;
  date: string;
  data: DashboardData;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColorHex(score: number | null): string {
  if (score === null) return "#64748b";
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function riskColorHex(riskLevel: number | null): string {
  if (riskLevel === null) return "#64748b";
  if (riskLevel <= 30) return "#34d399";
  if (riskLevel <= 60) return "#fbbf24";
  return "#f87171";
}

function scoreBgHex(score: number | null): string {
  if (score === null) return "#1e293b";
  if (score >= 80) return "#064e3b";
  if (score >= 60) return "#78350f";
  return "#7f1d1d";
}

export function generateHumanRiskReportHtml(input: HumanRiskReportInput): string {
  const { organizationName, date, data } = input;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte de Riesgo Humano — ${escHtml(organizationName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #f1f5f9;
      background: #0a1428;
      font-size: 14px;
      line-height: 1.6;
    }

    @page { size: A4; margin: 20mm; }
    @media print {
      body { background: white; color: #0f172a; }
      .cover { page-break-after: always; }
      .section { page-break-inside: avoid; }
      .page-break { page-break-before: always; }
      table { font-size: 11px; }
    }

    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px 60px;
      background: #0a1428;
      color: #f1f5f9;
    }
    .cover .accent-line {
      width: 60px;
      height: 4px;
      background: #00E5C0;
      margin-bottom: 40px;
    }
    .cover h1 {
      font-size: 42px;
      font-weight: 700;
      line-height: 1.15;
      margin-bottom: 16px;
    }
    .cover .subtitle {
      font-size: 18px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .cover .date {
      font-size: 14px;
      color: #64748b;
    }

    .content {
      padding: 40px 60px;
      max-width: 900px;
      margin: 0 auto;
    }
    @media print {
      .content { padding: 0; }
    }

    .section { margin-bottom: 40px; }
    .section h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1e293b;
    }
    @media print {
      .section h2 { border-bottom-color: #e2e8f0; color: #0f172a; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    @media print {
      .kpi-card { background: #f8fafc; border-color: #e2e8f0; }
    }
    .kpi-card .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .kpi-card .value {
      font-size: 28px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .score-hero {
      text-align: center;
      margin-bottom: 32px;
    }
    .score-hero .big-score {
      font-size: 64px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .score-hero .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 10px 12px;
      border-bottom: 1px solid #1e293b;
    }
    @media print { th { border-bottom-color: #e2e8f0; } }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #1e293b;
    }
    @media print { td { border-bottom-color: #f1f5f9; } }

    .score-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      font-size: 13px;
    }

    .pattern-row {
      margin-bottom: 12px;
    }
    .pattern-name {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 4px;
    }
    @media print { .pattern-name { color: #334155; } }
    .pattern-bar-track {
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
    }
    @media print { .pattern-bar-track { background: #e2e8f0; } }
    .pattern-bar-fill {
      height: 100%;
      background: #f87171;
      border-radius: 4px;
    }

    .disclaimer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    @media print { .disclaimer { border-top-color: #e2e8f0; } }
  </style>
</head>
<body>
  <!-- Cover -->
  <div class="cover">
    <div class="accent-line"></div>
    <h1>Reporte de<br/>Riesgo Humano</h1>
    <p class="subtitle">${escHtml(organizationName)}</p>
    <p class="date">${escHtml(date)}</p>
  </div>

  <div class="content">
    <!-- Executive Summary -->
    <div class="section">
      <h2>Resumen Ejecutivo</h2>

      <div class="score-hero">
        <div class="big-score" style="color: ${scoreColorHex(data.orgAvgScore)}">
          ${data.orgAvgScore}<span style="font-size: 28px; color: #64748b">/100</span>
        </div>
        <div class="label">Puntaje de Riesgo Humano</div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="label">Total Simulaciones</div>
          <div class="value" style="color: #f1f5f9">${data.totalSimulations}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Miembros Evaluados</div>
          <div class="value" style="color: #f1f5f9">${data.membersEvaluated}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Tasa de Completado</div>
          <div class="value" style="color: #f1f5f9">${data.completionRate}%</div>
        </div>
        <div class="kpi-card">
          <div class="label">Tiempo Promedio</div>
          <div class="value" style="color: #f1f5f9">${data.avgDurationMinutes} min</div>
        </div>
      </div>
    </div>

    <!-- Score Distribution -->
    <div class="section">
      <h2>Distribución de Puntajes</h2>
      <table>
        <thead>
          <tr>
            <th>Dimensión</th>
            <th style="text-align:center">Puntaje</th>
            <th style="text-align:center">Nivel</th>
          </tr>
        </thead>
        <tbody>
          ${renderDimensionRow("Alineamiento", data.dimensionAverages.alignment)}
          ${renderDimensionRow("Nivel de Control", Math.max(0, 100 - data.dimensionAverages.riskLevel))}
          ${renderDimensionRow("Criterio", data.dimensionAverages.criterio)}
        </tbody>
      </table>
    </div>

    <!-- Process Heatmap -->
    ${data.processHeatmap.length > 0 ? `
    <div class="section page-break">
      <h2>Mapa de Calor por Proceso</h2>
      <table>
        <thead>
          <tr>
            <th>Proceso</th>
            <th style="text-align:center">Alineamiento</th>
            <th style="text-align:center">Nivel de Riesgo</th>
            <th style="text-align:center">Criterio</th>
            <th style="text-align:center">Simulaciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.processHeatmap.map((row) => renderProcessRow(row)).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Error Patterns -->
    ${data.errorPatterns.length > 0 ? `
    <div class="section">
      <h2>Patrones de Error Frecuentes</h2>
      ${renderErrorPatterns(data.errorPatterns)}
    </div>
    ` : ""}

    <!-- Team Detail -->
    ${data.profiles.length > 0 ? `
    <div class="section page-break">
      <h2>Detalle por Miembro</h2>
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th style="text-align:center">Puntaje</th>
            <th style="text-align:center">Simulaciones</th>
            <th>Fortalezas</th>
            <th>Áreas de Riesgo</th>
          </tr>
        </thead>
        <tbody>
          ${data.profiles.map((p) => renderProfileRow(p)).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Disclaimer -->
    <div class="disclaimer">
      <p><strong>Aviso legal:</strong> Este reporte es generado automáticamente por Auditora.ai con base en simulaciones completadas por el personal de la organización. Los puntajes reflejan patrones de decisión observados en escenarios simulados y no constituyen una evaluación definitiva del desempeño laboral. Los resultados deben interpretarse como indicadores de tendencia, no como métricas absolutas.</p>
      <p style="margin-top: 8px"><strong>Legal notice:</strong> This report is automatically generated by Auditora.ai based on simulations completed by the organization's personnel. Scores reflect decision-making patterns observed in simulated scenarios and do not constitute a definitive job performance evaluation. Results should be interpreted as trend indicators, not absolute metrics.</p>
    </div>
  </div>
</body>
</html>`;
}

function renderDimensionRow(label: string, value: number): string {
  const color = scoreColorHex(value);
  const bg = scoreBgHex(value);
  const nivel = value >= 80 ? "Óptimo" : value >= 60 ? "Aceptable" : "En Riesgo";
  return `
    <tr>
      <td>${escHtml(label)}</td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${color}; background: ${bg}">${value}</span>
      </td>
      <td style="text-align:center; color: ${color}">${nivel}</td>
    </tr>`;
}

function renderProcessRow(row: ProcessHeatmapRow): string {
  return `
    <tr>
      <td>${escHtml(row.processName)}</td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(row.avgAlignment)}; background: ${scoreBgHex(row.avgAlignment)}">${row.avgAlignment}</span>
      </td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${riskColorHex(row.avgRiskLevel)}; background: ${scoreBgHex(100 - row.avgRiskLevel)}">${row.avgRiskLevel}</span>
      </td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(row.avgCriterio)}; background: ${scoreBgHex(row.avgCriterio)}">${row.avgCriterio}</span>
      </td>
      <td style="text-align:center; font-variant-numeric: tabular-nums">${row.simulationCount}</td>
    </tr>`;
}

function renderErrorPatterns(patterns: Array<{ pattern: string; count: number }>): string {
  const max = patterns[0]?.count ?? 1;
  return patterns
    .map(
      ({ pattern, count }) => `
    <div class="pattern-row">
      <div class="pattern-name">${escHtml(pattern)} <span style="color: #64748b; font-size: 11px">(${count})</span></div>
      <div class="pattern-bar-track">
        <div class="pattern-bar-fill" style="width: ${(count / max) * 100}%"></div>
      </div>
    </div>`,
    )
    .join("");
}

function renderProfileRow(p: ProfileItem): string {
  const name = escHtml(p.user.name || p.user.email);
  const color = scoreColorHex(p.overallScore);
  const bg = scoreBgHex(p.overallScore);
  const strengths = ((p.strengthAreas as string[]) || []).slice(0, 3).map(escHtml).join(", ");
  const risks = ((p.riskAreas as string[]) || []).slice(0, 3).map(escHtml).join(", ");
  return `
    <tr>
      <td>${name}</td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${color}; background: ${bg}">${p.overallScore ?? "—"}</span>
      </td>
      <td style="text-align:center; font-variant-numeric: tabular-nums">${p.totalSimulations}</td>
      <td style="font-size: 12px; color: #34d399">${strengths || "—"}</td>
      <td style="font-size: 12px; color: #f87171">${risks || "—"}</td>
    </tr>`;
}
