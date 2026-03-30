/**
 * PDF Export Generator
 *
 * Generates a consulting deliverable PDF from project data.
 * Uses server-side HTML generation + basic PDF structure.
 *
 * Architecture: Client sends pre-rendered SVGs via POST.
 * Server assembles them with metadata into a PDF.
 *
 * This uses a simple HTML-to-PDF approach rather than @react-pdf/renderer
 * to avoid additional dependencies. The output is a structured HTML document
 * that can be printed to PDF via the browser's print functionality.
 */

export interface PdfProcessData {
	id: string;
	name: string;
	description?: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	svgDiagram?: string;
	comments?: Array<{ content: string; authorName: string; createdAt: string }>;
}

export interface PdfProjectData {
	clientName: string;
	projectName: string;
	organizationName: string;
	date: string;
	processes: PdfProcessData[];
	raciEntries?: Array<{
		activityName: string;
		role: string;
		assignment: string;
	}>;
	actionItems?: string[];
	sessionHistory?: Array<{
		type: string;
		date: string;
		status: string;
	}>;
}

export function generateReportHtml(data: PdfProjectData): string {
	const processesHtml = data.processes
		.map(
			(p, i) => `
    <div class="process-section" ${i > 0 ? 'style="page-break-before: always;"' : ""}>
      <h2>${i + 1}. ${escHtml(p.name)}</h2>
      ${p.description ? `<p class="description">${escHtml(p.description)}</p>` : ""}

      ${p.svgDiagram ? `<div class="diagram">${p.svgDiagram}</div>` : '<p class="no-diagram">No diagram available</p>'}

      <div class="process-details">
        ${p.goals.length > 0 ? `<div class="detail-section"><h4>Goals</h4><ul>${p.goals.map((g) => `<li>${escHtml(g)}</li>`).join("")}</ul></div>` : ""}
        ${p.triggers.length > 0 ? `<div class="detail-section"><h4>Triggers</h4><ul>${p.triggers.map((t) => `<li>${escHtml(t)}</li>`).join("")}</ul></div>` : ""}
        ${p.outputs.length > 0 ? `<div class="detail-section"><h4>Outputs</h4><ul>${p.outputs.map((o) => `<li>${escHtml(o)}</li>`).join("")}</ul></div>` : ""}
      </div>

      ${
				p.comments && p.comments.length > 0
					? `<div class="comments">
          <h4>Notes</h4>
          ${p.comments.map((c) => `<p class="comment"><strong>${escHtml(c.authorName)}:</strong> ${escHtml(c.content)}</p>`).join("")}
        </div>`
					: ""
			}
    </div>`,
		)
		.join("\n");

	const raciHtml =
		data.raciEntries && data.raciEntries.length > 0
			? generateRaciTableHtml(data.raciEntries)
			: "";

	const actionItemsHtml =
		data.actionItems && data.actionItems.length > 0
			? `<div class="action-items" style="page-break-before: always;">
      <h2>Action Items</h2>
      <ul>${data.actionItems.map((a) => `<li>${escHtml(a)}</li>`).join("")}</ul>
    </div>`
			: "";

	const sessionHistoryHtml =
		data.sessionHistory && data.sessionHistory.length > 0
			? `<div class="session-history">
      <h2>Session History</h2>
      <table>
        <tr><th>Type</th><th>Date</th><th>Status</th></tr>
        ${data.sessionHistory.map((s) => `<tr><td>${escHtml(s.type)}</td><td>${escHtml(s.date)}</td><td>${escHtml(s.status)}</td></tr>`).join("")}
      </table>
    </div>`
			: "";

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escHtml(data.projectName)} - Process Report</title>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Geist', system-ui, sans-serif; color: #1a1a1a; line-height: 1.6; }
  .cover { text-align: center; padding-top: 200px; page-break-after: always; }
  .cover h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; margin-bottom: 8px; }
  .cover .client { font-size: 24px; color: #666; margin-bottom: 40px; }
  .cover .org { font-size: 14px; color: #999; }
  .cover .date { font-size: 14px; color: #999; margin-top: 60px; }
  h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 24px; border-bottom: 2px solid #00E5C0; padding-bottom: 8px; }
  h4 { color: #00E5C0; margin-bottom: 4px; }
  .diagram { margin: 20px 0; max-width: 100%; overflow: hidden; }
  .diagram svg { max-width: 100%; height: auto; }
  .no-diagram { color: #999; font-style: italic; }
  .process-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 16px 0; }
  .detail-section ul { margin: 4px 0; padding-left: 20px; }
  .comments { background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 12px; }
  .comment { font-size: 13px; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
  th { background: #00E5C0; color: #0A1428; }
  .toc { page-break-after: always; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { padding: 4px 0; border-bottom: 1px dotted #ccc; }
  .description { color: #555; }
  .raci-R { background: #dcfce7; font-weight: bold; }
  .raci-A { background: #dbeafe; font-weight: bold; }
  .raci-C { background: #fef9c3; }
  .raci-I { background: #f3e8ff; }
  .action-items li { margin: 8px 0; }
  .powered-by { text-align: center; color: #999; font-size: 11px; margin-top: 40px; }
  .legal-disclaimer { margin-top: 48px; padding: 16px; border-top: 1px solid #E7E5E4; background: #FAF9F7; border-radius: 6px; font-size: 10px; color: #78716C; line-height: 1.6; }
  .legal-disclaimer strong { color: #1C1917; }
</style>
</head>
<body>

<div class="cover">
  <h1>${escHtml(data.projectName)}</h1>
  <p class="client">${escHtml(data.clientName)}</p>
  <p class="org">${escHtml(data.organizationName)}</p>
  <p class="date">${escHtml(data.date)}</p>
  <p class="powered-by">Generated by Auditora.ai</p>
</div>

<div class="toc">
  <h2>Table of Contents</h2>
  <ul>
    ${data.processes.map((p, i) => `<li>${i + 1}. ${escHtml(p.name)}</li>`).join("\n    ")}
    ${raciHtml ? "<li>RACI Matrix</li>" : ""}
    ${actionItemsHtml ? "<li>Action Items</li>" : ""}
    ${sessionHistoryHtml ? "<li>Session History</li>" : ""}
  </ul>
</div>

${processesHtml}

${raciHtml}

${actionItemsHtml}

${sessionHistoryHtml}

<div class="legal-disclaimer">
  <strong>AI-Generated Content Disclaimer / Aviso sobre Contenido Generado por IA</strong><br>
  This report was generated using artificial intelligence by Auditora.ai. The analyses, diagrams, and recommendations contained herein are intended as analytical starting points and do not constitute professional consulting, auditing, legal, or financial advice. Results may contain errors, inaccuracies, or omissions inherent to AI systems. All content must be validated by qualified professionals before making business decisions. Auditora.ai assumes no liability for decisions made based on the content of this report.<br><br>
  Este reporte fue generado mediante inteligencia artificial por Auditora.ai. Los análisis, diagramas y recomendaciones aquí contenidos son puntos de partida analíticos y no constituyen asesoramiento profesional de consultoría, auditoría, legal ni financiero. Los resultados pueden contener errores, inexactitudes u omisiones inherentes a los sistemas de IA. Todo el contenido debe ser validado por profesionales calificados antes de tomar decisiones de negocio. Auditora.ai no asume responsabilidad por decisiones tomadas con base en el contenido de este reporte.
</div>

</body>
</html>`;
}

function generateRaciTableHtml(
	entries: Array<{ activityName: string; role: string; assignment: string }>,
): string {
	// Build RACI matrix: activities as rows, roles as columns
	const activities = [...new Set(entries.map((e) => e.activityName))];
	const roles = [...new Set(entries.map((e) => e.role))];

	const matrix = new Map<string, string>();
	for (const e of entries) {
		matrix.set(`${e.activityName}::${e.role}`, e.assignment);
	}

	const headerRow = `<tr><th>Activity</th>${roles.map((r) => `<th>${escHtml(r)}</th>`).join("")}</tr>`;
	const rows = activities
		.map((a) => {
			const cells = roles
				.map((r) => {
					const val = matrix.get(`${a}::${r}`) || "";
					const cls = val ? `raci-${val}` : "";
					return `<td class="${cls}">${val}</td>`;
				})
				.join("");
			return `<tr><td>${escHtml(a)}</td>${cells}</tr>`;
		})
		.join("\n");

	return `<div class="raci-section" style="page-break-before: always;">
    <h2>RACI Matrix</h2>
    <table>${headerRow}${rows}</table>
  </div>`;
}

function escHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
