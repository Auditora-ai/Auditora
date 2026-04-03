import type {
  DashboardData,
  ProfileItem,
  ProcessHeatmapRow,
  ProgressData,
  ProcessProgress,
  MemberProgress,
} from "@evaluaciones/lib/dashboard-queries";

export interface HumanRiskReportInput {
  organizationName: string;
  date: string;
  data: DashboardData;
  progressData?: ProgressData;
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

function deltaColorHex(delta: number): string {
  if (delta > 0) return "#34d399";
  if (delta === 0) return "#64748b";
  return "#f87171";
}

function deltaSign(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function generateHumanRiskReportHtml(input: HumanRiskReportInput): string {
  const { organizationName, date, data, progressData } = input;
  const hasProgress = progressData && !progressData.insufficientData;

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
      background: #3B8FE8;
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
    .cover .report-type {
      margin-top: 40px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #3B8FE8;
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
    .section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 12px;
      margin-top: 24px;
    }
    @media print {
      .section h3 { color: #475569; }
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

    .delta-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      font-size: 12px;
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

    .progress-comparison {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 24px;
      align-items: center;
      text-align: center;
      margin: 24px 0;
      padding: 24px;
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
    }
    @media print {
      .progress-comparison { background: #f8fafc; border-color: #e2e8f0; }
    }
    .progress-period .period-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .progress-period .period-score {
      font-size: 36px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .progress-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .progress-arrow .arrow-icon {
      font-size: 24px;
      color: #64748b;
    }

    .insight-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    @media print {
      .insight-card { background: #f8fafc; border-color: #e2e8f0; }
    }
    .insight-card .insight-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .insight-card .insight-body {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
    }
    @media print { .insight-card .insight-body { color: #475569; } }

    .rec-list {
      list-style: none;
      padding: 0;
    }
    .rec-list li {
      padding: 12px 16px;
      border-bottom: 1px solid #1e293b;
      font-size: 13px;
    }
    .rec-list li:last-child { border-bottom: none; }
    @media print { .rec-list li { border-bottom-color: #e2e8f0; } }
    .rec-member {
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    @media print { .rec-member { color: #0f172a; } }
    .rec-items {
      color: #94a3b8;
      font-size: 12px;
    }
    @media print { .rec-items { color: #475569; } }

    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 16px 0;
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
    <p class="report-type">Reporte Ejecutivo</p>
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

      <!-- Executive Insights -->
      ${renderExecutiveInsights(data, progressData)}
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

    <!-- Progress / Improvement (Before vs After) -->
    ${hasProgress ? renderProgressSection(progressData!) : ""}

    <!-- Score Trend Chart -->
    ${data.scoreTrend.length >= 2 ? `
    <div class="section">
      <h2>Tendencia de Puntaje</h2>
      ${renderScoreTrendSvg(data.scoreTrend)}
    </div>
    ` : ""}

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

    <!-- Recommendations -->
    ${renderRecommendationsSection(data.profiles)}

    <!-- Disclaimer -->
    <div class="disclaimer">
      <p><strong>Aviso legal:</strong> Este reporte es generado automáticamente por Auditora.ai con base en simulaciones completadas por el personal de la organización. Los puntajes reflejan patrones de decisión observados en escenarios simulados y no constituyen una evaluación definitiva del desempeño laboral. Los resultados deben interpretarse como indicadores de tendencia, no como métricas absolutas.</p>
      <p style="margin-top: 8px"><strong>Legal notice:</strong> This report is automatically generated by Auditora.ai based on simulations completed by the organization's personnel. Scores reflect decision-making patterns observed in simulated scenarios and do not constitute a definitive job performance evaluation. Results should be interpreted as trend indicators, not absolute metrics.</p>
    </div>
  </div>
</body>
</html>`;
}

/* ── Helper Renderers ── */

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

/* ── Executive Insights ── */

function renderExecutiveInsights(data: DashboardData, progressData?: ProgressData): string {
  const insights: string[] = [];

  // Score interpretation
  const scoreLevel = data.orgAvgScore >= 80 ? "óptimo" : data.orgAvgScore >= 60 ? "aceptable" : "en riesgo";
  insights.push(`El puntaje promedio de la organización es <strong>${data.orgAvgScore}/100</strong>, clasificado como <strong style="color: ${scoreColorHex(data.orgAvgScore)}">${scoreLevel}</strong>.`);

  // Weakest dimension
  const dims = [
    { name: "Alineamiento", value: data.dimensionAverages.alignment },
    { name: "Control de Riesgo", value: 100 - data.dimensionAverages.riskLevel },
    { name: "Criterio", value: data.dimensionAverages.criterio },
  ];
  dims.sort((a, b) => a.value - b.value);
  if (dims[0] && dims[0].value < 70) {
    insights.push(`La dimensión más débil es <strong>${dims[0].name}</strong> con ${dims[0].value} pts. Se recomienda enfocarse en esta área.`);
  }

  // Progress insight
  if (progressData && !progressData.insufficientData && progressData.overallDelta !== 0) {
    const direction = progressData.overallDelta > 0 ? "mejorado" : "disminuido";
    insights.push(`El equipo ha <strong style="color: ${deltaColorHex(progressData.overallDelta)}">${direction} ${Math.abs(progressData.overallDelta)} puntos</strong> entre las primeras y últimas evaluaciones.`);
  }

  // Top error pattern
  if (data.errorPatterns.length > 0) {
    insights.push(`El patrón de error más frecuente es "<em>${escHtml(data.errorPatterns[0]!.pattern)}</em>" con ${data.errorPatterns[0]!.count} ocurrencias.`);
  }

  if (insights.length === 0) return "";

  return `
    <div class="insight-card">
      <div class="insight-title">📊 Hallazgos Clave</div>
      <div class="insight-body">
        <ul style="list-style: disc; padding-left: 20px;">
          ${insights.map((i) => `<li style="margin-bottom: 6px">${i}</li>`).join("")}
        </ul>
      </div>
    </div>`;
}

/* ── Progress / Improvement Section ── */

function renderProgressSection(progress: ProgressData): string {
  let html = `
    <div class="section page-break">
      <h2>Progreso y Mejora</h2>

      <!-- Overall Before/After -->
      <div class="progress-comparison">
        <div class="progress-period">
          <div class="period-label">Primeras Evaluaciones</div>
          <div class="period-score" style="color: ${scoreColorHex(progress.overallFirst.overall)}">${progress.overallFirst.overall}</div>
        </div>
        <div class="progress-arrow">
          <div class="arrow-icon">→</div>
          <span class="delta-badge" style="color: ${deltaColorHex(progress.overallDelta)}; background: ${progress.overallDelta > 0 ? "#064e3b" : progress.overallDelta < 0 ? "#7f1d1d" : "#1e293b"}">${deltaSign(progress.overallDelta)} pts</span>
          ${progress.totalMonths > 0 ? `<span style="font-size: 11px; color: #64748b">en ${progress.totalMonths} meses</span>` : ""}
        </div>
        <div class="progress-period">
          <div class="period-label">Últimas Evaluaciones</div>
          <div class="period-score" style="color: ${scoreColorHex(progress.overallLatest.overall)}">${progress.overallLatest.overall}</div>
        </div>
      </div>

      <!-- Dimension Comparison -->
      <h3>Progreso por Dimensión</h3>
      <div class="dimension-grid">
        ${renderDimensionProgressCard("Alineamiento", progress.overallFirst.alignment, progress.overallLatest.alignment)}
        ${renderDimensionProgressCard("Nivel de Riesgo", progress.overallFirst.riskLevel, progress.overallLatest.riskLevel, true)}
        ${renderDimensionProgressCard("Criterio", progress.overallFirst.criterio, progress.overallLatest.criterio)}
      </div>`;

  // Per-process progress
  if (progress.processProgress.length > 0) {
    html += `
      <h3>Progreso por Proceso</h3>
      <table>
        <thead>
          <tr>
            <th>Proceso</th>
            <th style="text-align:center">Primer Periodo</th>
            <th style="text-align:center">Periodo Reciente</th>
            <th style="text-align:center">Cambio</th>
            <th style="text-align:center">Ejecuciones</th>
          </tr>
        </thead>
        <tbody>
          ${progress.processProgress.map((p) => renderProcessProgressRow(p)).join("")}
        </tbody>
      </table>`;
  }

  // Per-member progress
  if (progress.memberProgress.length > 0) {
    html += `
      <h3 style="margin-top: 32px">Progreso por Miembro</h3>
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th style="text-align:center">Puntaje Inicial</th>
            <th style="text-align:center">Puntaje Actual</th>
            <th style="text-align:center">Cambio</th>
            <th style="text-align:center">Ejecuciones</th>
          </tr>
        </thead>
        <tbody>
          ${progress.memberProgress.map((m) => renderMemberProgressRow(m)).join("")}
        </tbody>
      </table>`;
  }

  html += `\n    </div>`;
  return html;
}

function renderDimensionProgressCard(label: string, first: number, latest: number, inverted = false): string {
  const rawDelta = latest - first;
  const displayDelta = inverted ? -rawDelta : rawDelta;
  const color = deltaColorHex(displayDelta);
  return `
    <div class="kpi-card">
      <div class="label">${escHtml(label)}</div>
      <div style="font-size: 24px; font-weight: 700; color: ${inverted ? riskColorHex(latest) : scoreColorHex(latest)}; font-variant-numeric: tabular-nums">${latest}</div>
      <div style="margin-top: 4px">
        <span style="font-size: 11px; color: #64748b">de ${first}</span>
        <span class="delta-badge" style="color: ${color}; background: ${displayDelta > 0 ? "#064e3b" : displayDelta < 0 ? "#7f1d1d" : "#1e293b"}; margin-left: 6px">${deltaSign(displayDelta)}</span>
      </div>
    </div>`;
}

function renderProcessProgressRow(p: ProcessProgress): string {
  const color = deltaColorHex(p.delta);
  return `
    <tr>
      <td>${escHtml(p.processName)}</td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(p.first.overall)}; background: ${scoreBgHex(p.first.overall)}">${p.first.overall}</span>
      </td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(p.latest.overall)}; background: ${scoreBgHex(p.latest.overall)}">${p.latest.overall}</span>
      </td>
      <td style="text-align:center">
        <span class="delta-badge" style="color: ${color}; background: ${p.delta > 0 ? "#064e3b" : p.delta < 0 ? "#7f1d1d" : "#1e293b"}">${deltaSign(p.delta)}</span>
      </td>
      <td style="text-align:center; font-variant-numeric: tabular-nums">${p.runCount}</td>
    </tr>`;
}

function renderMemberProgressRow(m: MemberProgress): string {
  const color = deltaColorHex(m.delta);
  return `
    <tr>
      <td>${escHtml(m.userName)}</td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(m.firstScore)}; background: ${scoreBgHex(m.firstScore)}">${m.firstScore}</span>
      </td>
      <td style="text-align:center">
        <span class="score-badge" style="color: ${scoreColorHex(m.latestScore)}; background: ${scoreBgHex(m.latestScore)}">${m.latestScore}</span>
      </td>
      <td style="text-align:center">
        <span class="delta-badge" style="color: ${color}; background: ${m.delta > 0 ? "#064e3b" : m.delta < 0 ? "#7f1d1d" : "#1e293b"}">${deltaSign(m.delta)}</span>
      </td>
      <td style="text-align:center; font-variant-numeric: tabular-nums">${m.totalRuns}</td>
    </tr>`;
}

/* ── Score Trend SVG ── */

function renderScoreTrendSvg(scoreTrend: Array<{ month: string; score: number }>): string {
  const W = 750;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 40;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const points = scoreTrend.map((d, i) => ({
    x: PAD_L + (i / Math.max(1, scoreTrend.length - 1)) * chartW,
    y: PAD_T + chartH - (d.score / 100) * chartH,
    month: d.month,
    score: d.score,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Area path (close at bottom)
  const areaPath = `${linePath} L${points[points.length - 1]!.x.toFixed(1)},${PAD_T + chartH} L${points[0]!.x.toFixed(1)},${PAD_T + chartH} Z`;

  // Y-axis labels
  const yLabels = [0, 20, 40, 60, 80, 100];
  const yGrid = yLabels.map((v) => ({
    y: PAD_T + chartH - (v / 100) * chartH,
    label: v.toString(),
  }));

  // Reference lines
  const refY80 = PAD_T + chartH - (80 / 100) * chartH;
  const refY60 = PAD_T + chartH - (60 / 100) * chartH;

  return `
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width: 750px; font-family: Inter, sans-serif;">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3B8FE8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#3B8FE8" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Grid -->
      ${yGrid.map((g) => `
        <line x1="${PAD_L}" y1="${g.y.toFixed(1)}" x2="${W - PAD_R}" y2="${g.y.toFixed(1)}" stroke="#1e293b" stroke-width="0.5"/>
        <text x="${PAD_L - 8}" y="${(g.y + 4).toFixed(1)}" fill="#64748b" font-size="10" text-anchor="end">${g.label}</text>
      `).join("")}

      <!-- Reference lines -->
      <line x1="${PAD_L}" y1="${refY80.toFixed(1)}" x2="${W - PAD_R}" y2="${refY80.toFixed(1)}" stroke="#34d399" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.5"/>
      <line x1="${PAD_L}" y1="${refY60.toFixed(1)}" x2="${W - PAD_R}" y2="${refY60.toFixed(1)}" stroke="#fbbf24" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.5"/>

      <!-- Area -->
      <path d="${areaPath}" fill="url(#trendFill)"/>

      <!-- Line -->
      <path d="${linePath}" fill="none" stroke="#3B8FE8" stroke-width="2"/>

      <!-- Dots + labels -->
      ${points.map((p) => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#3B8FE8"/>
        <text x="${p.x.toFixed(1)}" y="${(PAD_T + chartH + 20).toFixed(1)}" fill="#64748b" font-size="9" text-anchor="middle">${escHtml(p.month)}</text>
        <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" fill="#f1f5f9" font-size="10" text-anchor="middle" font-weight="600">${p.score}</text>
      `).join("")}
    </svg>`;
}

/* ── Recommendations Section ── */

function renderRecommendationsSection(profiles: ProfileItem[]): string {
  const profilesWithRecs = profiles.filter(
    (p) => ((p.recommendedTraining as string[]) || []).length > 0,
  );

  if (profilesWithRecs.length === 0) return "";

  return `
    <div class="section page-break">
      <h2>Recomendaciones de Formación</h2>
      <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px">Basado en los patrones de decisión observados en las evaluaciones, se recomiendan las siguientes áreas de formación por miembro del equipo.</p>
      <ul class="rec-list">
        ${profilesWithRecs.map((p) => {
          const name = escHtml(p.user.name || p.user.email);
          const recs = ((p.recommendedTraining as string[]) || []).map(escHtml);
          const scoreLabel = p.overallScore !== null ? ` (${p.overallScore}/100)` : "";
          return `
        <li>
          <div class="rec-member">${name}${scoreLabel}</div>
          <div class="rec-items">${recs.join(" · ")}</div>
        </li>`;
        }).join("")}
      </ul>
    </div>`;
}
