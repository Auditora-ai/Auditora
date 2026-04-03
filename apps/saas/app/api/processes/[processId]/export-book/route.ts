/**
 * Process Book Export API
 *
 * POST /api/processes/{processId}/export-book
 *
 * Generates a consolidated HTML report containing:
 * 1. Cover page (process name, org, date, owner)
 * 2. Context (description, goals, triggers, outputs)
 * 3. BPMN Diagram (inline SVG if provided via body)
 * 4. RACI Matrix
 * 5. Process Intelligence (completeness + gaps)
 * 6. Risk Register
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const authResult = await requireProcessAuth(processId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json().catch(() => ({}));
		const { svgDiagram } = body as { svgDiagram?: string };

		const processDef = await db.processDefinition.findUnique({
			where: { id: processId },
			include: {
				architecture: {
					include: { organization: { select: { name: true } } },
				},
				children: {
					select: { name: true, level: true, processStatus: true },
					orderBy: { priority: "asc" },
				},
				raciEntries: {
					orderBy: { activityName: "asc" },
				},
				intelligence: {
					include: {
						items: { orderBy: { priority: "desc" } },
					},
				},
				risks: {
					include: { mitigations: true },
					orderBy: { riskScore: "desc" },
				},
			},
		});

		if (!processDef) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const orgName = processDef.architecture?.organization?.name || "—";
		const date = new Date().toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		// Build RACI matrix data
		const raciMap = new Map<string, Map<string, string>>();
		const allRoles = new Set<string>();
		for (const entry of processDef.raciEntries) {
			if (!raciMap.has(entry.activityName)) {
				raciMap.set(entry.activityName, new Map());
			}
			raciMap.get(entry.activityName)!.set(entry.role, entry.assignment);
			allRoles.add(entry.role);
		}
		const roles = [...allRoles].sort();

		const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Process Book — ${esc(processDef.name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #0F172A; line-height: 1.6; }
  .page { max-width: 900px; margin: 0 auto; padding: 40px; }

  /* Cover */
  .cover { text-align: center; padding: 80px 40px; border-bottom: 3px solid #3B8FE8; margin-bottom: 40px; }
  .cover h1 { font-size: 32px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
  .cover .org { font-size: 18px; color: #64748B; margin-bottom: 24px; }
  .cover .meta { font-size: 14px; color: #94A3B8; }

  /* Sections */
  h2 { font-size: 20px; font-weight: 700; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin: 32px 0 16px; }
  h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; }

  /* Context */
  .context-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .context-item { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
  .context-item label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; }
  .context-item .value { font-size: 14px; margin-top: 4px; }
  .tag { display: inline-block; background: #ECFDF5; color: #3B8FE8; font-size: 12px; padding: 2px 8px; border-radius: 4px; margin: 2px; }

  /* Diagram */
  .diagram-container { text-align: center; margin: 16px 0; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; background: #fff; }
  .diagram-container svg { max-width: 100%; height: auto; }
  .no-data { color: #94A3B8; font-style: italic; font-size: 14px; padding: 24px; text-align: center; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
  th { background: #F1F5F9; text-align: left; padding: 8px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 8px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
  .raci-cell { text-align: center; font-weight: 700; font-size: 14px; }
  .raci-R { color: #16A34A; }
  .raci-A { color: #3B8FE8; }
  .raci-C { color: #D97706; }
  .raci-I { color: #9333EA; }

  /* Badges */
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
  .badge-critical { background: #FEE2E2; color: #DC2626; }
  .badge-high { background: #FEF3C7; color: #D97706; }
  .badge-medium { background: #FEF9C3; color: #CA8A04; }
  .badge-low { background: #DCFCE7; color: #16A34A; }
  .badge-info { background: #ECFDF5; color: #3B8FE8; }

  /* Intelligence */
  .score-ring { display: inline-flex; align-items: center; gap: 8px; font-size: 24px; font-weight: 700; }
  .gap-item { background: #F8FAFC; border-left: 3px solid #D97706; padding: 8px 12px; margin: 8px 0; border-radius: 0 4px 4px 0; }
  .gap-item .category { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; }
  .gap-item .question { font-size: 13px; margin-top: 2px; }

  /* Footer */
  .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; }

  @media print {
    .page { padding: 20px; }
    .cover { padding: 40px 20px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

<!-- Cover -->
<div class="cover">
  <h1>${esc(processDef.name)}</h1>
  <div class="org">${esc(orgName)}</div>
  <div class="meta">
    ${processDef.owner ? `Owner: ${esc(processDef.owner)} · ` : ""}${date}
  </div>
</div>

<!-- 1. Context -->
<h2>1. Contexto del Proceso</h2>
${processDef.description ? `<p style="margin-bottom:16px">${esc(processDef.description)}</p>` : ""}
<div class="context-grid">
  <div class="context-item">
    <label>Objetivos</label>
    <div class="value">${processDef.goals.length > 0 ? processDef.goals.map((g) => `<span class="tag">${esc(g)}</span>`).join(" ") : '<span class="no-data">—</span>'}</div>
  </div>
  <div class="context-item">
    <label>Triggers</label>
    <div class="value">${processDef.triggers.length > 0 ? processDef.triggers.map((t) => `<span class="tag">${esc(t)}</span>`).join(" ") : '<span class="no-data">—</span>'}</div>
  </div>
  <div class="context-item">
    <label>Outputs</label>
    <div class="value">${processDef.outputs.length > 0 ? processDef.outputs.map((o) => `<span class="tag">${esc(o)}</span>`).join(" ") : '<span class="no-data">—</span>'}</div>
  </div>
  <div class="context-item">
    <label>Sub-procesos</label>
    <div class="value">${processDef.children.length > 0 ? processDef.children.map((c) => `<span class="tag">${esc(c.name)}</span>`).join(" ") : '<span class="no-data">—</span>'}</div>
  </div>
</div>

<!-- 2. Diagram -->
<h2>2. Diagrama BPMN</h2>
${svgDiagram ? `<div class="diagram-container">${svgDiagram}</div>` : processDef.bpmnXml ? '<p class="no-data">Diagrama disponible en la plataforma (no incluido en este reporte)</p>' : '<p class="no-data">Sin diagrama</p>'}

<!-- 3. RACI Matrix -->
<h2>3. Matriz RACI</h2>
${raciMap.size > 0 ? `
<table>
  <thead>
    <tr>
      <th>Actividad</th>
      ${roles.map((r) => `<th style="text-align:center">${esc(r)}</th>`).join("")}
    </tr>
  </thead>
  <tbody>
    ${[...raciMap.entries()].map(([activity, assignments]) => `
    <tr>
      <td>${esc(activity)}</td>
      ${roles.map((r) => {
				const a = assignments.get(r) || "";
				return `<td class="raci-cell raci-${a}">${a}</td>`;
			}).join("")}
    </tr>`).join("")}
  </tbody>
</table>
` : '<p class="no-data">Matriz RACI no generada</p>'}

<!-- 4. Intelligence -->
<h2>4. Inteligencia del Proceso</h2>
${processDef.intelligence ? (() => {
			const intel = processDef.intelligence;
			const scores = intel.confidenceScores as Record<string, number> | null;
			const overall = scores && typeof scores === "object"
				? Math.round(Object.values(scores).reduce((a, b) => a + (b || 0), 0) / Math.max(1, Object.keys(scores).length))
				: null;
			const openItems = intel.items.filter((item) => !(item as any).resolvedAt);
			return `
<div class="score-ring">${overall != null ? `${overall}%` : "—"} <span style="font-size:14px;font-weight:400;color:#64748B">completitud</span></div>
${openItems.length > 0 ? `
<h3>${openItems.length} gaps abiertos</h3>
${openItems.slice(0, 15).map((item: any) => `
<div class="gap-item">
  <div class="category">${esc(item.category || "GENERAL")}</div>
  <div class="question">${esc(item.question || item.content || "—")}</div>
</div>`).join("")}
${openItems.length > 15 ? `<p style="color:#94A3B8;font-size:13px">... y ${openItems.length - 15} más</p>` : ""}
` : '<p style="color:#16A34A;font-size:14px;margin-top:8px">✓ Sin gaps abiertos</p>'}`;
		})() : '<p class="no-data">Análisis de inteligencia no generado</p>'}

<!-- 5. Risks -->
<h2>5. Registro de Riesgos</h2>
${processDef.risks.length > 0 ? `
<p style="margin-bottom:12px;font-size:14px;color:#64748B">
  ${processDef.risks.length} riesgo${processDef.risks.length !== 1 ? "s" : ""} identificado${processDef.risks.length !== 1 ? "s" : ""}
  · ${processDef.risks.filter((r) => r.riskScore >= 20).length} críticos
  · ${processDef.risks.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length} altos
</p>
<table>
  <thead>
    <tr><th>Riesgo</th><th>Tipo</th><th>Severidad</th><th>Probabilidad</th><th>Score</th><th>Estado</th></tr>
  </thead>
  <tbody>
    ${processDef.risks.map((r) => {
			const badge = r.riskScore >= 20 ? "critical" : r.riskScore >= 12 ? "high" : r.riskScore >= 6 ? "medium" : "low";
			return `<tr>
      <td><strong>${esc(r.title)}</strong><br><span style="font-size:12px;color:#64748B">${esc(r.description || "")}</span></td>
      <td>${esc(r.riskType)}</td>
      <td>${r.severity}</td>
      <td>${r.probability}</td>
      <td><span class="badge badge-${badge}">${r.riskScore}</span></td>
      <td>${esc(r.status)}</td>
    </tr>`;
		}).join("")}
  </tbody>
</table>
` : '<p class="no-data">Sin riesgos identificados</p>'}

<!-- Footer -->
<div class="footer">
  Generado por Auditora.ai · ${date}
</div>

</div>
</body>
</html>`;

		return new NextResponse(html, {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Content-Disposition": `inline; filename="process-book-${processDef.name.replace(/\s+/g, "-")}.html"`,
			},
		});
	} catch (error) {
		console.error("[ProcessBook] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

function esc(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
