import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			organization: { select: { name: true } },
			sessionDeliverables: true,
			_count: { select: { transcriptEntries: true } },
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	const deliverableMap = new Map(
		session.sessionDeliverables.map((d) => [d.type, d]),
	);

	const processName = session.processDefinition?.name ?? "Proceso";
	const orgName = session.organization.name;
	const date = session.startedAt
		? session.startedAt.toLocaleDateString("es-MX", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "--";
	const duration = formatDuration(session.startedAt, session.endedAt);

	const summary = deliverableMap.get("summary");
	const audit = deliverableMap.get("process_audit");
	const raci = deliverableMap.get("raci");
	const risk = deliverableMap.get("risk_audit");

	const html = generateReviewReportHtml({
		processName,
		orgName,
		date,
		duration,
		transcriptCount: session._count.transcriptEntries,
		summary: summary?.status === "completed" ? (summary.data as any) : null,
		audit: audit?.status === "completed" ? (audit.data as any) : null,
		raci: raci?.status === "completed" ? (raci.data as any) : null,
		risk: risk?.status === "completed" ? (risk.data as any) : null,
	});

	return new NextResponse(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

function formatDuration(start: Date | null, end: Date | null): string {
	if (!start || !end) return "--";
	const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
	if (mins < 60) return `${mins} min`;
	return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function esc(s: string | null | undefined): string {
	if (!s) return "";
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

interface ReviewReportInput {
	processName: string;
	orgName: string;
	date: string;
	duration: string;
	transcriptCount: number;
	summary: { summary: string; actionItems: string[] } | null;
	audit: {
		completenessScore: number;
		newGaps: Array<{
			category: string;
			question: string;
			context: string;
			priority: number;
		}>;
		contradictions?: Array<{
			topic: string;
			claim1: string;
			claim2: string;
		}>;
	} | null;
	raci: {
		assignments: Array<{
			activityName: string;
			role: string;
			assignment: string;
		}>;
	} | null;
	risk: {
		newRisks: Array<{
			title: string;
			description: string;
			riskType: string;
			severity: number;
			probability: number;
			isOpportunity: boolean;
			affectedStep?: string;
			suggestedMitigations: string[];
		}>;
		riskSummary: {
			totalRiskScore: number;
			criticalCount: number;
			highCount: number;
			topRiskArea: string;
		};
	} | null;
}

function generateReviewReportHtml(data: ReviewReportInput): string {
	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(data.processName)} — Session Review</title>
<style>
  @page { margin: 2cm; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: 'Geist', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; margin: 0; padding: 0; }

  .cover { text-align: center; padding-top: 180px; page-break-after: always; }
  .cover h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; margin-bottom: 8px; color: #0f172a; }
  .cover .subtitle { font-size: 16px; color: #64748b; margin-bottom: 4px; }
  .cover .meta { font-size: 13px; color: #94a3b8; margin-top: 48px; }
  .cover .meta span { margin: 0 8px; }
  .cover .powered { font-size: 11px; color: #cbd5e1; margin-top: 80px; }

  h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-top: 32px; }
  h3 { font-size: 14px; color: #334155; margin-bottom: 8px; }

  .section { margin-bottom: 28px; }
  .section:not(:first-child) { page-break-inside: avoid; }

  p { font-size: 13px; color: #334155; }

  /* Summary */
  .summary-text { white-space: pre-wrap; font-size: 13px; color: #334155; line-height: 1.7; }
  .action-items { margin-top: 16px; }
  .action-items li { font-size: 13px; color: #334155; margin: 6px 0; }

  /* Audit */
  .score-bar { height: 8px; border-radius: 4px; background: #f1f5f9; margin: 8px 0 16px; }
  .score-fill { height: 100%; border-radius: 4px; }
  .gap-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin: 6px 0; }
  .gap-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .badge-p5, .badge-p4 { background: #fee2e2; color: #b91c1c; }
  .badge-p3 { background: #fef3c7; color: #92400e; }
  .badge-p2, .badge-p1 { background: #f1f5f9; color: #475569; }
  .gap-cat { font-size: 11px; color: #94a3b8; }
  .gap-q { font-size: 13px; color: #334155; margin: 0; }
  .gap-ctx { font-size: 11px; color: #94a3b8; margin: 4px 0 0; }

  .contradiction { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin: 6px 0; }
  .contradiction-topic { font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 4px; }
  .contradiction-claim { font-size: 12px; color: #a16207; margin: 2px 0; }

  /* RACI */
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th { background: #1e293b; color: white; padding: 8px; text-align: center; font-weight: 500; }
  th:first-child { text-align: left; }
  td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
  td:first-child { text-align: left; color: #334155; }
  .raci-R { background: #dbeafe; color: #1e40af; font-weight: 700; }
  .raci-A { background: #f3e8ff; color: #7c3aed; font-weight: 700; }
  .raci-C { background: #f1f5f9; color: #475569; }
  .raci-I { background: #f8fafc; color: #94a3b8; }
  .raci-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: #64748b; }

  /* Risk */
  .risk-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
  .risk-stat { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
  .risk-stat .num { font-size: 22px; font-weight: 600; }
  .risk-stat .lbl { font-size: 11px; color: #64748b; }
  .risk-stat.critical { border-color: #fecaca; }
  .risk-stat.critical .num { color: #dc2626; }
  .risk-stat.high { border-color: #fed7aa; }
  .risk-stat.high .num { color: #d97706; }

  .risk-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin: 6px 0; }
  .risk-title { font-size: 13px; font-weight: 600; color: #0f172a; }
  .risk-desc { font-size: 12px; color: #475569; margin: 4px 0; }
  .risk-meta { font-size: 11px; color: #94a3b8; display: flex; gap: 12px; margin-top: 6px; }
  .sev-critical { background: #fef2f2; color: #b91c1c; }
  .sev-high { background: #fffbeb; color: #92400e; }
  .sev-medium { background: #fefce8; color: #854d0e; }
  .sev-low { background: #f0fdf4; color: #166534; }
  .mitigations { margin-top: 6px; padding-left: 16px; }
  .mitigations li { font-size: 11px; color: #64748b; margin: 2px 0; }

  .empty { color: #94a3b8; font-style: italic; font-size: 13px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>${esc(data.processName)}</h1>
  <p class="subtitle">Session Review</p>
  <p class="subtitle" style="font-size:14px; color:#94a3b8;">${esc(data.orgName)}</p>
  <div class="meta">
    <span>${esc(data.date)}</span>
    <span>·</span>
    <span>Duración: ${esc(data.duration)}</span>
    <span>·</span>
    <span>${data.transcriptCount} entradas de transcripción</span>
  </div>
  <p class="powered">Generated by aiprocess.me</p>
</div>

${renderSummarySection(data.summary)}
${renderAuditSection(data.audit)}
${renderRaciSection(data.raci)}
${renderRiskSection(data.risk)}

</body>
</html>`;
}

function renderSummarySection(
	data: ReviewReportInput["summary"],
): string {
	if (!data) return `<div class="section"><h2>Executive Summary</h2><p class="empty">No summary data available.</p></div>`;
	return `<div class="section">
  <h2>Executive Summary</h2>
  <p class="summary-text">${esc(data.summary)}</p>
  ${
		data.actionItems.length > 0
			? `<div class="action-items"><h3>Action Items</h3><ol>${data.actionItems.map((a) => `<li>${esc(a)}</li>`).join("")}</ol></div>`
			: ""
	}
</div>`;
}

function renderAuditSection(
	data: ReviewReportInput["audit"],
): string {
	if (!data) return `<div class="section"><h2>Process Audit</h2><p class="empty">No audit data available.</p></div>`;

	const scoreColor =
		data.completenessScore >= 80
			? "#22c55e"
			: data.completenessScore >= 50
				? "#f59e0b"
				: "#ef4444";

	const gapsHtml =
		data.newGaps.length > 0
			? `<h3>Knowledge Gaps (${data.newGaps.length})</h3>
      ${data.newGaps
				.map(
					(g) => `<div class="gap-card">
        <div class="gap-header">
          <span class="badge badge-p${g.priority}">P${g.priority}</span>
          <span class="gap-cat">${esc(g.category)}</span>
        </div>
        <p class="gap-q">${esc(g.question)}</p>
        ${g.context ? `<p class="gap-ctx">${esc(g.context)}</p>` : ""}
      </div>`,
				)
				.join("")}`
			: "";

	const contradictionsHtml =
		data.contradictions && data.contradictions.length > 0
			? `<h3>Contradictions (${data.contradictions.length})</h3>
      ${data.contradictions
				.map(
					(c) => `<div class="contradiction">
        <p class="contradiction-topic">${esc(c.topic)}</p>
        <p class="contradiction-claim"><strong>Claim 1:</strong> ${esc(c.claim1)}</p>
        <p class="contradiction-claim"><strong>Claim 2:</strong> ${esc(c.claim2)}</p>
      </div>`,
				)
				.join("")}`
			: "";

	return `<div class="section">
  <h2>Process Audit</h2>
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
    <span style="font-size:13px; color:#475569;">Completeness Score</span>
    <span style="font-size:13px; font-weight:600;">${data.completenessScore}%</span>
  </div>
  <div class="score-bar"><div class="score-fill" style="width:${data.completenessScore}%; background:${scoreColor};"></div></div>
  ${gapsHtml}
  ${contradictionsHtml}
</div>`;
}

function renderRaciSection(
	data: ReviewReportInput["raci"],
): string {
	if (!data || !data.assignments || data.assignments.length === 0) {
		return `<div class="section" style="page-break-before:always;"><h2>RACI Matrix</h2><p class="empty">No RACI data available.</p></div>`;
	}

	const activities: string[] = [];
	const roles: string[] = [];
	const matrix: Record<string, Record<string, string>> = {};

	for (const a of data.assignments) {
		if (!activities.includes(a.activityName)) activities.push(a.activityName);
		if (!roles.includes(a.role)) roles.push(a.role);
		if (!matrix[a.activityName]) matrix[a.activityName] = {};
		matrix[a.activityName][a.role] = a.assignment;
	}

	const headerRow = `<tr><th>Activity</th>${roles.map((r) => `<th>${esc(r)}</th>`).join("")}</tr>`;
	const rows = activities
		.map((act) => {
			const cells = roles
				.map((r) => {
					const val = matrix[act]?.[r] || "";
					return `<td class="${val ? `raci-${val}` : ""}">${val || "-"}</td>`;
				})
				.join("");
			return `<tr><td>${esc(act)}</td>${cells}</tr>`;
		})
		.join("");

	return `<div class="section" style="page-break-before:always;">
  <h2>RACI Matrix</h2>
  <table>${headerRow}${rows}</table>
  <div class="raci-legend">
    <span><strong>R</strong> Responsible</span>
    <span><strong>A</strong> Accountable</span>
    <span><strong>C</strong> Consulted</span>
    <span><strong>I</strong> Informed</span>
  </div>
</div>`;
}

function renderRiskSection(
	data: ReviewReportInput["risk"],
): string {
	if (!data) return `<div class="section"><h2>Risk Audit</h2><p class="empty">No risk data available.</p></div>`;

	const sevLabel = (s: number) =>
		s >= 4 ? "Critical" : s >= 3 ? "High" : s >= 2 ? "Medium" : "Low";
	const sevClass = (s: number) =>
		s >= 4
			? "sev-critical"
			: s >= 3
				? "sev-high"
				: s >= 2
					? "sev-medium"
					: "sev-low";

	const risksHtml =
		data.newRisks.length > 0
			? data.newRisks
					.map(
						(r) => `<div class="risk-card">
      <div class="gap-header">
        <span class="badge ${sevClass(r.severity)}">${sevLabel(r.severity)}</span>
        <span class="gap-cat">${esc(r.riskType.replace(/_/g, " "))}</span>
        ${r.isOpportunity ? '<span class="badge" style="background:#dcfce7;color:#166534;">Opportunity</span>' : ""}
      </div>
      <p class="risk-title">${esc(r.title)}</p>
      <p class="risk-desc">${esc(r.description)}</p>
      ${r.affectedStep ? `<p style="font-size:11px;color:#94a3b8;margin:2px 0;">Affected step: ${esc(r.affectedStep)}</p>` : ""}
      ${
				r.suggestedMitigations.length > 0
					? `<ul class="mitigations">${r.suggestedMitigations.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`
					: ""
			}
      <div class="risk-meta">
        <span>Severity: ${r.severity}/5</span>
        <span>Probability: ${r.probability}/5</span>
        <span>RPN: ${r.severity * r.probability}</span>
      </div>
    </div>`,
					)
					.join("")
			: "";

	return `<div class="section" style="page-break-before:always;">
  <h2>Risk Audit</h2>
  <div class="risk-grid">
    <div class="risk-stat"><p class="num">${data.riskSummary.totalRiskScore}</p><p class="lbl">Risk Score</p></div>
    <div class="risk-stat critical"><p class="num">${data.riskSummary.criticalCount}</p><p class="lbl">Critical</p></div>
    <div class="risk-stat high"><p class="num">${data.riskSummary.highCount}</p><p class="lbl">High</p></div>
    <div class="risk-stat"><p class="num" style="font-size:13px;">${esc(data.riskSummary.topRiskArea.replace(/_/g, " "))}</p><p class="lbl">Top Risk Area</p></div>
  </div>
  ${risksHtml}
</div>`;
}
