/**
 * Radiografía Report Generator
 *
 * Generates a "Reporte Ejecutivo de Radiografía" HTML document
 * for print-to-PDF export. Follows the same pattern as pdf-generator.ts.
 */

export interface RadiografiaReportData {
	companyName: string;
	industry: string;
	processName: string;
	processDescription: string;
	date: string;
	riskScore: number;
	criticalCount: number;
	highCount: number;
	mediumLowCount: number;
	topRiskArea: string;
	sipoc: {
		suppliers: string[];
		inputs: string[];
		processSteps: string[];
		outputs: string[];
		customers: string[];
	};
	risks: Array<{
		title: string;
		description: string;
		riskType: string;
		severity: number;
		probability: number;
		affectedStep?: string;
		suggestedMitigations: string[];
		isOpportunity: boolean;
	}>;
}

function escHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function riskScoreColor(score: number): string {
	if (score >= 20) return "#DC2626";
	if (score >= 12) return "#D97706";
	if (score >= 6) return "#3B82F6";
	return "#16A34A";
}

function riskScoreLabel(score: number): string {
	if (score >= 20) return "Crítico";
	if (score >= 12) return "Alto";
	if (score >= 6) return "Medio";
	return "Bajo";
}

export function generateRadiografiaReportHtml(data: RadiografiaReportData): string {
	const sipocHtml = `
    <table class="sipoc-table">
      <thead>
        <tr>
          <th>Proveedores</th>
          <th>Entradas</th>
          <th>Proceso</th>
          <th>Salidas</th>
          <th>Clientes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.sipoc.suppliers.map((s) => `<div class="sipoc-item">${escHtml(s)}</div>`).join("") || "—"}</td>
          <td>${data.sipoc.inputs.map((s) => `<div class="sipoc-item">${escHtml(s)}</div>`).join("") || "—"}</td>
          <td>${data.sipoc.processSteps.map((s) => `<div class="sipoc-item">${escHtml(s)}</div>`).join("") || "—"}</td>
          <td>${data.sipoc.outputs.map((s) => `<div class="sipoc-item">${escHtml(s)}</div>`).join("") || "—"}</td>
          <td>${data.sipoc.customers.map((s) => `<div class="sipoc-item">${escHtml(s)}</div>`).join("") || "—"}</td>
        </tr>
      </tbody>
    </table>`;

	const risksHtml = data.risks
		.sort((a, b) => b.severity * b.probability - a.severity * a.probability)
		.map((risk) => {
			const score = risk.severity * risk.probability;
			const color = riskScoreColor(score);
			const label = riskScoreLabel(score);
			return `
      <div class="risk-card">
        <div class="risk-header">
          <span class="risk-badge" style="background: ${color};">${escHtml(label)} (${score})</span>
          <span class="risk-type">${escHtml(risk.riskType)}</span>
          ${risk.isOpportunity ? '<span class="risk-opportunity">Oportunidad</span>' : ""}
        </div>
        <h4 class="risk-title">${escHtml(risk.title)}</h4>
        <p class="risk-desc">${escHtml(risk.description)}</p>
        ${risk.affectedStep ? `<p class="risk-step">Paso afectado: ${escHtml(risk.affectedStep)}</p>` : ""}
        ${
					risk.suggestedMitigations.length > 0
						? `<div class="risk-mitigations">
            <p class="mitigation-label">Mitigaciones sugeridas:</p>
            <ul>${risk.suggestedMitigations.map((m) => `<li>${escHtml(m)}</li>`).join("")}</ul>
          </div>`
						: ""
				}
      </div>`;
		})
		.join("\n");

	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte Ejecutivo de Radiografía - ${escHtml(data.companyName)}</title>
<style>
  @page { margin: 2cm; size: A4; }
  @page :first { margin-top: 0; }
  body { font-family: 'Geist', system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 14px; margin: 0; }

  /* Cover */
  .cover { text-align: center; padding-top: 140px; page-break-after: always; background: linear-gradient(180deg, #0A1428 0%, #111827 100%); margin: -2cm; padding-left: 2cm; padding-right: 2cm; padding-bottom: 2cm; min-height: 100vh; box-sizing: border-box; }
  .cover .brand-mark { display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #00E5C0; margin-bottom: 24px; }
  .cover .report-type { font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #00E5C0; margin-bottom: 8px; }
  .cover h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; margin: 0 0 8px; color: #F1F5F9; letter-spacing: -0.02em; }
  .cover .company { font-size: 24px; color: #94A3B8; font-weight: 300; margin-bottom: 8px; }
  .cover .industry { font-size: 14px; color: #64748B; margin-bottom: 48px; }
  .cover .accent-line { width: 60px; height: 3px; background: #00E5C0; margin: 24px auto; border-radius: 2px; }
  .cover .score-box { display: inline-block; background: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 12px; padding: 24px 48px; margin-top: 32px; }
  .cover .score-value { font-family: 'Instrument Serif', Georgia, serif; font-size: 64px; font-weight: bold; color: #DC2626; margin: 0; line-height: 1; }
  .cover .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-top: 4px; }
  .cover .date { font-size: 13px; color: #64748B; margin-top: 48px; }
  .cover .powered-by { color: #475569; font-size: 11px; margin-top: 40px; }

  /* Typography */
  h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; border-bottom: 2px solid #00E5C0; padding-bottom: 8px; color: #0F172A; letter-spacing: -0.01em; margin-top: 32px; }

  /* Executive summary */
  .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 20px 0; }
  .summary-item { background: #F8FAFC; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center; }
  .summary-item .value { font-size: 28px; font-weight: bold; color: #0F172A; }
  .summary-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin-top: 4px; }

  /* SIPOC */
  .sipoc-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
  .sipoc-table th { background: #0A1428; color: #F1F5F9; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; text-align: left; }
  .sipoc-table td { border: 1px solid #E2E8F0; padding: 10px 12px; vertical-align: top; }
  .sipoc-item { padding: 2px 0; }

  /* Risks */
  .risk-card { border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 12px 0; page-break-inside: avoid; }
  .risk-header { margin-bottom: 8px; }
  .risk-badge { display: inline-block; color: white; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 12px; margin-right: 8px; }
  .risk-type { display: inline-block; color: #64748B; font-size: 11px; border: 1px solid #E2E8F0; padding: 2px 8px; border-radius: 12px; }
  .risk-opportunity { display: inline-block; color: #16A34A; font-size: 11px; background: #F0FDF4; padding: 2px 8px; border-radius: 12px; margin-left: 4px; }
  .risk-title { font-size: 15px; font-weight: 600; color: #0F172A; margin: 4px 0; }
  .risk-desc { font-size: 13px; color: #475569; margin: 4px 0 8px; }
  .risk-step { font-size: 11px; color: #94A3B8; margin: 4px 0; }
  .risk-mitigations { margin-top: 8px; }
  .mitigation-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin-bottom: 4px; }
  .risk-mitigations ul { margin: 4px 0; padding-left: 20px; font-size: 12px; color: #475569; }
  .risk-mitigations li { margin: 3px 0; }

  /* Disclaimer */
  .disclaimer { margin-top: 48px; padding: 16px; border-top: 1px solid #E2E8F0; background: #F1F5F9; border-radius: 6px; font-size: 10px; color: #64748B; line-height: 1.6; page-break-before: auto; }
  .disclaimer strong { color: #0F172A; }
</style>
</head>
<body>

<div class="cover">
  <div class="brand-mark"></div>
  <p class="report-type">Reporte Ejecutivo</p>
  <h1>Radiografía Operativa</h1>
  <div class="accent-line"></div>
  <p class="company">${escHtml(data.companyName)}</p>
  <p class="industry">${escHtml(data.industry)} · ${escHtml(data.processName)}</p>
  <div class="score-box">
    <p class="score-value">${data.riskScore}</p>
    <p class="score-label">Score de riesgo total</p>
  </div>
  <p class="date">${escHtml(data.date)}</p>
  <p class="powered-by">Generado por Auditora.ai</p>
</div>

<h2>Resumen Ejecutivo</h2>
<p>${escHtml(data.processDescription)}</p>

<div class="summary">
  <div class="summary-item">
    <div class="value" style="color: #DC2626;">${data.criticalCount}</div>
    <div class="label">Riesgos críticos</div>
  </div>
  <div class="summary-item">
    <div class="value" style="color: #D97706;">${data.highCount}</div>
    <div class="label">Riesgos altos</div>
  </div>
  <div class="summary-item">
    <div class="value" style="color: #3B82F6;">${data.mediumLowCount}</div>
    <div class="label">Medio / bajo</div>
  </div>
</div>

<p style="font-size: 13px; color: #64748B;">Área de mayor riesgo: <strong style="color: #0F172A;">${escHtml(data.topRiskArea)}</strong></p>

<h2>Análisis SIPOC</h2>
${sipocHtml}

<h2 style="page-break-before: always;">Registro de Riesgos</h2>
<p style="font-size: 13px; color: #64748B;">${data.risks.length} riesgos identificados, ordenados por severidad.</p>
${risksHtml}

<div class="disclaimer">
  <strong>Aviso sobre Contenido Generado por IA</strong><br>
  Este reporte fue generado mediante inteligencia artificial por Auditora.ai. Los análisis, diagramas y recomendaciones aquí contenidos son puntos de partida analíticos y no constituyen asesoramiento profesional de consultoría, auditoría, legal ni financiero. Los resultados pueden contener errores, inexactitudes u omisiones inherentes a los sistemas de IA. Todo el contenido debe ser validado por profesionales calificados antes de tomar decisiones de negocio. Auditora.ai no asume responsabilidad por decisiones tomadas con base en el contenido de este reporte.<br><br>
  <strong>AI-Generated Content Disclaimer</strong><br>
  This report was generated using artificial intelligence by Auditora.ai. The analyses and recommendations contained herein are intended as analytical starting points and do not constitute professional consulting, auditing, legal, or financial advice. All content must be validated by qualified professionals before making business decisions.
</div>

</body>
</html>`;
}
