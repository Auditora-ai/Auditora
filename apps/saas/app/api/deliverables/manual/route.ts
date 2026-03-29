/**
 * Manual de Procesos — Compiled PDF Export
 *
 * GET /api/deliverables/manual?organizationId=xxx
 *
 * Generates a professional HTML document (for browser print → PDF) containing:
 * - Cover page with org branding
 * - Table of contents
 * - Executive summary (AI-generated from real data)
 * - Process landscape summary
 * - Process cards (one per process)
 * - Consolidated RACI matrix
 * - Risk register
 * - Appendices (roles, systems, glossary)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const authCtx = await getAuthContext();
  if (!authCtx || authCtx.org.id !== organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all data in parallel
  const [org, processes, raciEntries, risks, brain] = await Promise.all([
    db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, logo: true, industry: true },
    }),
    db.processDefinition.findMany({
      where: { architecture: { organizationId } },
      include: {
        raciEntries: true,
        risks: {
          include: {
            controls: { select: { description: true, controlType: true } },
            mitigations: { select: { action: true, owner: true, status: true } },
          },
        },
        intelligence: { select: { completenessScore: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.raciEntry.findMany({
      where: { process: { architecture: { organizationId } } },
      include: { process: { select: { name: true } } },
    }),
    db.processRisk.findMany({
      where: { processDefinition: { architecture: { organizationId } } },
      include: { processDefinition: { select: { name: true } } },
      orderBy: { riskScore: "desc" },
    }),
    db.companyBrain.findUnique({
      where: { organizationId },
      include: {
        globalRoles: { select: { name: true, department: true, title: true } },
        globalSystems: { select: { name: true, vendor: true, description: true } },
      },
    }),
  ]);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const orgName = org.name;
  const date = new Date().toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Stats for executive summary
  const totalProcesses = processes.length;
  const documented = processes.filter((p) =>
    p.processStatus === "MAPPED" || p.processStatus === "VALIDATED" || p.processStatus === "APPROVED",
  ).length;
  const coveragePct = totalProcesses > 0 ? Math.round((documented / totalProcesses) * 100) : 0;
  const totalRisks = risks.length;
  const criticalRisks = risks.filter((r) => r.riskScore >= 16).length;
  const highRisks = risks.filter((r) => r.riskScore >= 12 && r.riskScore < 16).length;
  const avgCompleteness = processes.length > 0
    ? Math.round(processes.reduce((s, p) => s + (p.intelligence?.completenessScore ?? 0), 0) / processes.length)
    : 0;

  const strategicCount = processes.filter((p) => p.category === "strategic").length;
  const coreCount = processes.filter((p) => p.category === "core").length;
  const supportCount = processes.filter((p) => p.category === "support").length;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Manual de Procesos — ${esc(orgName)}</title>
<style>
  @page { margin: 2cm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; margin: 0; padding: 0; font-size: 12px; }

  .cover { text-align: center; padding-top: 200px; page-break-after: always; min-height: 100vh; }
  .cover h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 42px; margin-bottom: 8px; }
  .cover .subtitle { font-size: 18px; color: #64748b; }
  .cover .meta { font-size: 13px; color: #94a3b8; margin-top: 60px; }
  .cover .powered { font-size: 10px; color: #cbd5e1; margin-top: 100px; }

  h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 28px; margin-top: 0; page-break-before: always; }
  h1:first-of-type { page-break-before: auto; }
  h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 14px; color: #334155; margin-top: 16px; margin-bottom: 4px; }

  .section { margin-bottom: 20px; }
  p { margin: 4px 0; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
  .stat .num { font-size: 24px; font-weight: 600; }
  .stat .lbl { font-size: 10px; color: #64748b; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
  th { background: #1e293b; color: white; padding: 6px 8px; text-align: left; font-weight: 500; }
  td { border: 1px solid #e2e8f0; padding: 5px 8px; }
  tr:nth-child(even) { background: #f8fafc; }

  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; }
  .badge-strategic { background: #f3e8ff; color: #7c3aed; }
  .badge-core { background: #dbeafe; color: #1e40af; }
  .badge-support { background: #f1f5f9; color: #475569; }

  .process-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; page-break-inside: avoid; }
  .process-card h3 { margin-top: 0; font-size: 16px; }
  .process-card .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
  .process-card .field-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
  .process-card .field-value { font-size: 12px; color: #334155; }
  .pill { display: inline-block; background: #f1f5f9; border-radius: 4px; padding: 1px 6px; margin: 1px; font-size: 10px; color: #475569; }

  .raci-R { background: #dbeafe; color: #1e40af; font-weight: 700; text-align: center; }
  .raci-A { background: #f3e8ff; color: #7c3aed; font-weight: 700; text-align: center; }
  .raci-C { background: #f1f5f9; color: #475569; text-align: center; }
  .raci-I { background: #f8fafc; color: #94a3b8; text-align: center; }

  .risk-critical { background: #fef2f2; }
  .risk-high { background: #fffbeb; }

  .toc { page-break-after: always; }
  .toc h2 { border: none; font-size: 16px; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { padding: 4px 0; border-bottom: 1px dotted #e2e8f0; font-size: 13px; }

  .appendix { page-break-before: always; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <h1>${esc(orgName)}</h1>
  <p class="subtitle">Manual de Procesos</p>
  <div class="meta">
    <p>${esc(date)}</p>
    <p>${totalProcesses} procesos · ${totalRisks} riesgos · ${coveragePct}% cobertura</p>
  </div>
  <p class="powered">Generado por Auditora.ai</p>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
  <h2>Indice</h2>
  <ul>
    <li>1. Resumen Ejecutivo</li>
    <li>2. Panorama de Procesos</li>
    ${processes.map((p, i) => `<li>3.${i + 1}. ${esc(p.name)}</li>`).join("\n    ")}
    <li>4. Matriz RACI Consolidada</li>
    <li>5. Registro de Riesgos</li>
    <li>6. Anexos: Roles y Sistemas</li>
  </ul>
</div>

<!-- 1. EXECUTIVE SUMMARY -->
<h1>1. Resumen Ejecutivo</h1>
<div class="section">
  <p>La organizacion <strong>${esc(orgName)}</strong> tiene <strong>${totalProcesses} procesos</strong> registrados, de los cuales <strong>${documented} (${coveragePct}%)</strong> estan documentados a nivel de diagrama BPMN.</p>
  <p>La distribucion por tipo es: ${strategicCount} estrategicos, ${coreCount} core, y ${supportCount} de soporte.</p>
  <p>El score de completitud promedio es <strong>${avgCompleteness}%</strong>.</p>
  ${totalRisks > 0 ? `<p>Se han identificado <strong>${totalRisks} riesgos</strong>, de los cuales ${criticalRisks} son criticos y ${highRisks} son de severidad alta.</p>` : ""}
  ${(brain?.globalRoles?.length ?? 0) > 0 ? `<p>Se han identificado <strong>${brain!.globalRoles.length} roles</strong> y <strong>${brain!.globalSystems.length} sistemas</strong> involucrados en los procesos.</p>` : ""}

  <div class="stats">
    <div class="stat"><p class="num">${totalProcesses}</p><p class="lbl">Procesos</p></div>
    <div class="stat"><p class="num" style="color:#16a34a">${documented}</p><p class="lbl">Documentados</p></div>
    <div class="stat"><p class="num" style="color:#dc2626">${criticalRisks}</p><p class="lbl">Riesgos Criticos</p></div>
    <div class="stat"><p class="num">${avgCompleteness}%</p><p class="lbl">Completitud Prom.</p></div>
  </div>
</div>

<!-- 2. PROCESS LANDSCAPE -->
<h1>2. Panorama de Procesos</h1>
<div class="section">
  <table>
    <thead>
      <tr><th>Proceso</th><th>Categoria</th><th>Responsable</th><th>Estado</th><th>Completitud</th><th>Riesgos</th></tr>
    </thead>
    <tbody>
      ${processes.map((p) => `<tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td><span class="badge badge-${p.category ?? "support"}">${esc(p.category ?? "—")}</span></td>
        <td>${esc(p.owner ?? "—")}</td>
        <td>${esc(p.processStatus)}</td>
        <td>${p.intelligence?.completenessScore ?? 0}%</td>
        <td>${p.risks.length}</td>
      </tr>`).join("\n      ")}
    </tbody>
  </table>
</div>

<!-- 3. PROCESS CARDS -->
${processes.map((p, i) => {
    const raci = p.raciEntries;
    const raciRoles = [...new Set(raci.map((r) => r.role))];
    const raciActivities = [...new Set(raci.map((r) => r.activityName))];
    const raciMap = new Map<string, string>();
    for (const r of raci) raciMap.set(`${r.activityName}|${r.role}`, r.assignment);

    return `
<h1>3.${i + 1}. ${esc(p.name)}</h1>
<div class="process-card">
  <div class="meta-grid">
    <div><p class="field-label">Responsable</p><p class="field-value">${esc(p.owner ?? "Sin asignar")}</p></div>
    <div><p class="field-label">Categoria</p><p class="field-value">${esc(p.category ?? "—")}</p></div>
    <div><p class="field-label">Estado</p><p class="field-value">${esc(p.processStatus)}</p></div>
    <div><p class="field-label">Completitud</p><p class="field-value">${p.intelligence?.completenessScore ?? 0}%</p></div>
  </div>
  ${p.description ? `<p>${esc(p.description)}</p>` : ""}
  ${p.goals.length > 0 ? `<h3>Objetivos</h3><ul>${p.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
  ${p.triggers.length > 0 ? `<h3>Triggers</h3><p>${p.triggers.map((t) => `<span class="pill">${esc(t)}</span>`).join(" ")}</p>` : ""}
  ${p.outputs.length > 0 ? `<h3>Outputs</h3><p>${p.outputs.map((o) => `<span class="pill">${esc(o)}</span>`).join(" ")}</p>` : ""}
  ${raciActivities.length > 0 ? `
  <h3>RACI</h3>
  <table>
    <thead><tr><th>Actividad</th>${raciRoles.map((r) => `<th style="text-align:center">${esc(r)}</th>`).join("")}</tr></thead>
    <tbody>${raciActivities.map((act) => `<tr><td>${esc(act)}</td>${raciRoles.map((role) => {
      const val = raciMap.get(`${act}|${role}`);
      return `<td class="${val ? `raci-${val}` : ""}">${val ?? "—"}</td>`;
    }).join("")}</tr>`).join("")}</tbody>
  </table>` : ""}
  ${p.risks.length > 0 ? `
  <h3>Riesgos (${p.risks.length})</h3>
  <table>
    <thead><tr><th>Riesgo</th><th>Tipo</th><th>Sev.</th><th>Prob.</th><th>RPN</th></tr></thead>
    <tbody>${p.risks.map((r) => `<tr class="${r.riskScore >= 16 ? "risk-critical" : r.riskScore >= 12 ? "risk-high" : ""}">
      <td>${esc(r.title)}</td><td>${esc(r.riskType.replace(/_/g, " "))}</td>
      <td style="text-align:center">${r.severity}</td><td style="text-align:center">${r.probability}</td>
      <td style="text-align:center;font-weight:600">${r.riskScore}</td>
    </tr>`).join("")}</tbody>
  </table>` : ""}
</div>`;
  }).join("\n")}

<!-- 4. CONSOLIDATED RACI -->
<h1>4. Matriz RACI Consolidada</h1>
${(() => {
    const allRoles = [...new Set(raciEntries.map((e) => e.role))].sort();
    const byProcess = new Map<string, Map<string, Map<string, string>>>();
    for (const e of raciEntries) {
      if (!byProcess.has(e.process.name)) byProcess.set(e.process.name, new Map());
      const proc = byProcess.get(e.process.name)!;
      if (!proc.has(e.activityName)) proc.set(e.activityName, new Map());
      proc.get(e.activityName)!.set(e.role, e.assignment);
    }
    if (allRoles.length === 0) return "<p>No hay asignaciones RACI registradas.</p>";
    let html = `<table><thead><tr><th>Actividad</th>${allRoles.map((r) => `<th style="text-align:center">${esc(r)}</th>`).join("")}</tr></thead><tbody>`;
    for (const [procName, activities] of byProcess) {
      html += `<tr><td colspan="${allRoles.length + 1}" style="background:#f1f5f9;font-weight:600;font-size:11px;">${esc(procName)}</td></tr>`;
      for (const [act, roleMap] of activities) {
        html += `<tr><td>${esc(act)}</td>${allRoles.map((r) => {
          const v = roleMap.get(r);
          return `<td class="${v ? `raci-${v}` : ""}">${v ?? "—"}</td>`;
        }).join("")}</tr>`;
      }
    }
    html += "</tbody></table>";
    return html;
  })()}

<!-- 5. RISK REGISTER -->
<h1>5. Registro de Riesgos</h1>
${risks.length === 0 ? "<p>No hay riesgos registrados.</p>" : `
<table>
  <thead><tr><th>Riesgo</th><th>Proceso</th><th>Tipo</th><th>Sev.</th><th>Prob.</th><th>RPN</th><th>Estado</th></tr></thead>
  <tbody>
    ${risks.map((r) => `<tr class="${r.riskScore >= 16 ? "risk-critical" : r.riskScore >= 12 ? "risk-high" : ""}">
      <td><strong>${esc(r.title)}</strong><br><span style="font-size:10px;color:#64748b">${esc(r.description).slice(0, 80)}</span></td>
      <td>${esc(r.processDefinition.name)}</td>
      <td>${esc(r.riskType.replace(/_/g, " "))}</td>
      <td style="text-align:center">${r.severity}</td>
      <td style="text-align:center">${r.probability}</td>
      <td style="text-align:center;font-weight:600">${r.riskScore}</td>
      <td>${esc(r.status.replace(/_/g, " "))}</td>
    </tr>`).join("")}
  </tbody>
</table>`}

<!-- 6. APPENDICES -->
<h1 class="appendix">6. Anexos</h1>
${(brain?.globalRoles?.length ?? 0) > 0 ? `
<h2>Roles Identificados</h2>
<table>
  <thead><tr><th>Rol</th><th>Departamento</th><th>Titulo</th></tr></thead>
  <tbody>
    ${brain!.globalRoles.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.department ?? "—")}</td><td>${esc(r.title ?? "—")}</td></tr>`).join("")}
  </tbody>
</table>` : ""}

${(brain?.globalSystems?.length ?? 0) > 0 ? `
<h2>Sistemas</h2>
<table>
  <thead><tr><th>Sistema</th><th>Proveedor</th><th>Descripcion</th></tr></thead>
  <tbody>
    ${brain!.globalSystems.map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.vendor ?? "—")}</td><td>${esc(s.description ?? "—")}</td></tr>`).join("")}
  </tbody>
</table>` : ""}

<!-- Footer -->
<div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8;">
  Generado por Auditora.ai · ${esc(date)}
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
