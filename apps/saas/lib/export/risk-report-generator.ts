/**
 * Risk Report Generator
 *
 * Generates a consulting-grade HTML risk report that can be printed to PDF.
 * Includes heat matrix (inline SVG), risk register, FMEA table,
 * mitigation tracker, and control mapping.
 *
 * Same pattern as pdf-generator.ts — HTML generation for browser print.
 */

export interface RiskReportData {
  organizationName: string;
  processName: string;
  processDescription?: string;
  date: string;
  risks: Array<{
    title: string;
    description: string;
    riskType: string;
    severity: number;
    probability: number;
    riskScore: number;
    status: string;
    isOpportunity: boolean;
    affectedStep?: string | null;
    residualScore?: number | null;
    failureMode?: string | null;
    failureEffect?: string | null;
    rpn?: number | null;
    mitigations: Array<{
      action: string;
      owner?: string | null;
      status: string;
    }>;
    controls: Array<{
      name: string;
      controlType: string;
      effectiveness: string;
    }>;
  }>;
  summary: {
    totalRisks: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    opportunities: number;
    avgRiskScore: number;
  };
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(score: number): string {
  if (score >= 20) return "#DC2626";
  if (score >= 12) return "#D97706";
  if (score >= 6) return "#0EA5E9";
  return "#16A34A";
}

function scoreLabel(score: number): string {
  if (score >= 20) return "Critico";
  if (score >= 12) return "Alto";
  if (score >= 6) return "Medio";
  return "Bajo";
}

function riskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    OPERATIONAL: "Operacional",
    COMPLIANCE: "Cumplimiento",
    STRATEGIC: "Estrategico",
    FINANCIAL: "Financiero",
    TECHNOLOGY: "Tecnologia",
    HUMAN_RESOURCE: "RRHH",
    REPUTATIONAL: "Reputacional",
  };
  return map[type] || type;
}

function generateHeatMatrixSvg(
  risks: Array<{ severity: number; probability: number }>,
): string {
  const cellSize = 60;
  const padding = 50;
  const width = cellSize * 5 + padding + 20;
  const height = cellSize * 5 + padding + 20;

  // Count risks per cell
  const counts: Record<string, number> = {};
  for (const r of risks) {
    const key = `${r.severity}-${r.probability}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  let cells = "";
  for (let s = 1; s <= 5; s++) {
    for (let p = 1; p <= 5; p++) {
      const x = padding + (p - 1) * cellSize;
      const y = (5 - s) * cellSize;
      const score = s * p;
      const count = counts[`${s}-${p}`] || 0;
      const fill = count > 0 ? scoreColor(score) : "#F1F5F9";
      const textColor = count > 0 ? "#FFFFFF" : "#94A3B8";

      cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="#E2E8F0" stroke-width="1" rx="4"/>`;
      if (count > 0) {
        cells += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" text-anchor="middle" fill="${textColor}" font-size="16" font-weight="600">${count}</text>`;
      }
    }
  }

  // Y-axis labels (Severity)
  const sevLabels = ["Negligible", "Menor", "Moderado", "Mayor", "Catastrofico"];
  let yLabels = "";
  for (let s = 1; s <= 5; s++) {
    const y = (5 - s) * cellSize + cellSize / 2 + 4;
    yLabels += `<text x="${padding - 5}" y="${y}" text-anchor="end" fill="#64748B" font-size="9">${sevLabels[s - 1]}</text>`;
  }

  // X-axis labels (Probability)
  const probLabels = ["Raro", "Improbable", "Posible", "Probable", "Casi seguro"];
  let xLabels = "";
  for (let p = 1; p <= 5; p++) {
    const x = padding + (p - 1) * cellSize + cellSize / 2;
    xLabels += `<text x="${x}" y="${5 * cellSize + 18}" text-anchor="middle" fill="#64748B" font-size="9">${probLabels[p - 1]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 10}" width="${width}" height="${height + 10}">
    <text x="${padding / 2}" y="${height / 2 - padding}" text-anchor="middle" fill="#0F172A" font-size="11" font-weight="600" transform="rotate(-90, ${padding / 2 - 15}, ${height / 2 - padding})">Severidad</text>
    <text x="${width / 2 + padding / 2}" y="${5 * cellSize + 35}" text-anchor="middle" fill="#0F172A" font-size="11" font-weight="600">Probabilidad</text>
    ${cells}
    ${yLabels}
    ${xLabels}
  </svg>`;
}

export function generateRiskReportHtml(data: RiskReportData): string {
  const actualRisks = data.risks.filter((r) => !r.isOpportunity);
  const opportunities = data.risks.filter((r) => r.isOpportunity);
  const fmeaRisks = data.risks.filter((r) => r.failureMode);

  const heatMatrixSvg = generateHeatMatrixSvg(
    actualRisks.map((r) => ({
      severity: r.severity,
      probability: r.probability,
    })),
  );

  const riskRowsHtml = actualRisks
    .sort((a, b) => b.riskScore - a.riskScore)
    .map(
      (r) => `
    <tr>
      <td><strong>${escHtml(r.title)}</strong><br><span style="color:#64748B;font-size:12px">${escHtml(r.description).substring(0, 120)}${r.description.length > 120 ? "..." : ""}</span></td>
      <td><span style="background:${scoreColor(r.riskScore)};color:white;padding:2px 8px;border-radius:4px;font-size:12px">${riskTypeLabel(r.riskType)}</span></td>
      <td style="text-align:center">${r.severity}</td>
      <td style="text-align:center">${r.probability}</td>
      <td style="text-align:center;font-weight:600"><span style="background:${scoreColor(r.riskScore)};color:white;padding:2px 8px;border-radius:4px">${r.riskScore}</span></td>
      <td style="text-align:center">${r.residualScore != null ? r.residualScore : "—"}</td>
      <td>${r.affectedStep ? escHtml(r.affectedStep) : "—"}</td>
    </tr>`,
    )
    .join("");

  const mitigationRowsHtml = actualRisks
    .filter((r) => r.mitigations.length > 0)
    .map(
      (r) => `
    <tr style="background:#F8FAFC"><td colspan="4" style="font-weight:600;padding-top:12px">${escHtml(r.title)} (Score: ${r.riskScore})</td></tr>
    ${r.mitigations
      .map(
        (m) => `
    <tr>
      <td style="padding-left:20px">${escHtml(m.action)}</td>
      <td>${m.owner || "—"}</td>
      <td><span style="font-size:12px">${m.status}</span></td>
      <td></td>
    </tr>`,
      )
      .join("")}`,
    )
    .join("");

  const fmeaRowsHtml = fmeaRisks
    .sort((a, b) => (b.rpn || 0) - (a.rpn || 0))
    .map(
      (r) => `
    <tr>
      <td>${r.affectedStep ? escHtml(r.affectedStep) : "—"}</td>
      <td>${r.failureMode ? escHtml(r.failureMode) : "—"}</td>
      <td>${r.failureEffect ? escHtml(r.failureEffect) : "—"}</td>
      <td style="text-align:center">${r.severity}</td>
      <td style="text-align:center">${r.probability}</td>
      <td style="text-align:center">${r.rpn ? Math.round(r.rpn / (r.severity * r.probability)) : "—"}</td>
      <td style="text-align:center;font-weight:600"><span style="background:${scoreColor(r.rpn || 0)};color:white;padding:2px 8px;border-radius:4px">${r.rpn || "—"}</span></td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Riesgos — ${escHtml(data.processName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Geist', -apple-system, sans-serif; color: #0F172A; line-height: 1.5; padding: 40px; max-width: 1100px; margin: 0 auto; }
    h1 { font-family: 'Instrument Serif', serif; font-size: 32px; margin-bottom: 4px; }
    h2 { font-family: 'Instrument Serif', serif; font-size: 24px; margin: 32px 0 16px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
    h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; }
    .meta { color: #64748B; font-size: 14px; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0 32px; }
    .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; text-align: center; }
    .summary-card .number { font-size: 28px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .summary-card .label { font-size: 12px; color: #64748B; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #0F172A; color: #F1F5F9; padding: 8px 12px; text-align: left; font-weight: 500; }
    td { padding: 8px 12px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
    tr:hover { background: #F8FAFC; }
    .heat-matrix { text-align: center; margin: 16px 0; }
    .opp-card { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 12px 16px; margin: 8px 0; }
    .opp-title { font-weight: 600; color: #16A34A; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Reporte de Riesgos</h1>
  <p class="meta">${escHtml(data.organizationName)} — ${escHtml(data.processName)} — ${escHtml(data.date)}</p>
  ${data.processDescription ? `<p style="color:#64748B;margin-bottom:24px">${escHtml(data.processDescription)}</p>` : ""}

  <h2>Resumen Ejecutivo</h2>
  <div class="summary-grid">
    <div class="summary-card"><div class="number" style="color:#DC2626">${data.summary.criticalCount}</div><div class="label">Criticos</div></div>
    <div class="summary-card"><div class="number" style="color:#D97706">${data.summary.highCount}</div><div class="label">Altos</div></div>
    <div class="summary-card"><div class="number" style="color:#0EA5E9">${data.summary.mediumCount}</div><div class="label">Medios</div></div>
    <div class="summary-card"><div class="number" style="color:#16A34A">${data.summary.lowCount}</div><div class="label">Bajos</div></div>
  </div>

  <h2>Matriz de Calor</h2>
  <div class="heat-matrix">${heatMatrixSvg}</div>

  <h2>Registro de Riesgos</h2>
  <table>
    <thead><tr><th>Riesgo</th><th>Tipo</th><th>Sev.</th><th>Prob.</th><th>Score</th><th>Residual</th><th>Actividad</th></tr></thead>
    <tbody>${riskRowsHtml || '<tr><td colspan="7" style="text-align:center;color:#94A3B8">Sin riesgos identificados</td></tr>'}</tbody>
  </table>

  ${
    mitigationRowsHtml
      ? `<h2>Plan de Mitigacion</h2>
  <table>
    <thead><tr><th>Accion</th><th>Responsable</th><th>Estado</th><th></th></tr></thead>
    <tbody>${mitigationRowsHtml}</tbody>
  </table>`
      : ""
  }

  ${
    opportunities.length > 0
      ? `<h2>Oportunidades</h2>
  ${opportunities.map((o) => `<div class="opp-card"><div class="opp-title">${escHtml(o.title)}</div><p style="font-size:13px;color:#64748B;margin-top:4px">${escHtml(o.description)}</p></div>`).join("")}`
      : ""
  }

  ${
    fmeaRowsHtml
      ? `<h2>Analisis FMEA</h2>
  <table>
    <thead><tr><th>Actividad</th><th>Modo de Fallo</th><th>Efecto</th><th>Sev.</th><th>Prob.</th><th>Det.</th><th>RPN</th></tr></thead>
    <tbody>${fmeaRowsHtml}</tbody>
  </table>`
      : ""
  }

  <div style="margin-top:48px;padding:16px;border-top:1px solid #334155;background:#1E293B;border-radius:6px;font-size:10px;color:#94A3B8;line-height:1.6">
    <strong style="color:#E2E8F0">Aviso sobre Contenido Generado por IA / AI-Generated Content Disclaimer</strong><br>
    Este reporte fue generado mediante inteligencia artificial por Auditora.ai. Los análisis, evaluaciones de riesgo y recomendaciones aquí contenidos son puntos de partida analíticos y no constituyen asesoramiento profesional de consultoría, auditoría, legal ni financiero. Los resultados pueden contener errores, inexactitudes u omisiones inherentes a los sistemas de IA. Todo el contenido debe ser validado por profesionales calificados antes de tomar decisiones de negocio. Auditora.ai no asume responsabilidad por decisiones tomadas con base en el contenido de este reporte.<br><br>
    This report was generated using artificial intelligence by Auditora.ai. The analyses, risk assessments, and recommendations herein are analytical starting points and do not constitute professional consulting, auditing, legal, or financial advice. Results may contain errors, inaccuracies, or omissions inherent to AI systems. All content must be validated by qualified professionals before making business decisions. Auditora.ai assumes no liability for decisions made based on this report.<br><br>
    <span style="color:#64748B">Generado por Auditora.ai — ${escHtml(data.date)}</span>
  </div>
</body>
</html>`;
}
