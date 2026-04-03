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
  @page :first { margin-top: 0; }
  body { font-family: 'Geist', system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 14px; }

  /* Cover page */
  .cover { text-align: center; padding-top: 160px; page-break-after: always; background: linear-gradient(180deg, #0A1428 0%, #111827 100%); margin: -2cm; padding-left: 2cm; padding-right: 2cm; padding-bottom: 2cm; min-height: 100vh; box-sizing: border-box; }
  .cover .brand-mark { display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #3B8FE8; margin-bottom: 32px; }
  .cover h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 40px; margin-bottom: 8px; color: #F1F5F9; letter-spacing: -0.02em; }
  .cover .client { font-size: 22px; color: #94A3B8; margin-bottom: 48px; font-weight: 300; }
  .cover .org { font-size: 14px; color: #64748B; }
  .cover .date { font-size: 13px; color: #64748B; margin-top: 48px; }
  .cover .powered-by { color: #475569; font-size: 11px; margin-top: 80px; }
  .cover .accent-line { width: 60px; height: 3px; background: #3B8FE8; margin: 24px auto; border-radius: 2px; }

  /* Typography */
  h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 24px; border-bottom: 2px solid #3B8FE8; padding-bottom: 8px; color: #0F172A; letter-spacing: -0.01em; }
  h4 { color: #0A1428; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Diagrams */
  .diagram { margin: 20px 0; max-width: 100%; overflow: hidden; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; background: #F8FAFC; }
  .diagram svg { max-width: 100%; height: auto; }
  .no-diagram { color: #94A3B8; font-style: italic; }

  /* Process details */
  .process-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 16px 0; }
  .detail-section { background: #F8FAFC; padding: 12px; border-radius: 6px; border: 1px solid #E2E8F0; }
  .detail-section ul { margin: 4px 0; padding-left: 20px; font-size: 13px; }

  /* Comments */
  .comments { background: #F1F5F9; padding: 12px 16px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #3B8FE8; }
  .comment { font-size: 13px; margin: 4px 0; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th, td { border: 1px solid #E2E8F0; padding: 8px 12px; text-align: left; }
  th { background: #0A1428; color: #F1F5F9; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
  tr:nth-child(even) td { background: #F8FAFC; }

  /* TOC */
  .toc { page-break-after: always; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { padding: 8px 0; border-bottom: 1px dotted #CBD5E1; font-size: 15px; }

  .description { color: #64748B; }
  .raci-R { background: #dcfce7; font-weight: bold; }
  .raci-A { background: #dbeafe; font-weight: bold; }
  .raci-C { background: #fef9c3; }
  .raci-I { background: #f3e8ff; }
  .action-items li { margin: 8px 0; }
  .legal-disclaimer { margin-top: 48px; padding: 16px; border-top: 1px solid #E2E8F0; background: #F1F5F9; border-radius: 6px; font-size: 10px; color: #64748B; line-height: 1.6; }
  .legal-disclaimer strong { color: #0F172A; }
</style>
</head>
<body>

<div class="cover">
  <div class="brand-mark"></div>
  <h1>${escHtml(data.projectName)}</h1>
  <div class="accent-line"></div>
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
