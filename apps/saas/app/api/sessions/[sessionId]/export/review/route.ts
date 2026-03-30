import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;

	const authResult = await requireSessionAuth(sessionId);
	if (isAuthError(authResult)) return authResult;

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			processDefinition: true,
			organization: { select: { name: true } },
			sessionDeliverables: true,
			transcriptEntries: { orderBy: { timestamp: "asc" } },
			diagramNodes: { where: { state: { not: "REJECTED" } }, orderBy: { formedAt: "asc" } },
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	const processName = session.processDefinition?.name ?? "Proceso";
	const orgName = session.organization.name;
	const date = session.startedAt
		? session.startedAt.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
		: new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
	const duration = formatDuration(session.startedAt, session.endedAt);

	// Group nodes by lane
	const lanes = new Map<string, typeof session.diagramNodes>();
	for (const node of session.diagramNodes) {
		const lane = node.lane || "General";
		if (!lanes.has(lane)) lanes.set(lane, []);
		lanes.get(lane)!.push(node);
	}

	// Nodes with procedures
	const nodesWithSop = session.diagramNodes.filter((n) => n.procedure);

	// Deliverables (may be empty during live session)
	const deliverableMap = new Map(session.sessionDeliverables.map((d) => [d.type, d]));
	const summary = deliverableMap.get("summary");
	const audit = deliverableMap.get("process_audit");

	const html = generateReportHtml({
		processName,
		orgName,
		date,
		duration,
		nodes: session.diagramNodes,
		lanes,
		transcript: session.transcriptEntries,
		nodesWithSop,
		summary: summary?.status === "completed" ? (summary.data as any) : null,
		audit: audit?.status === "completed" ? (audit.data as any) : null,
	});

	return new NextResponse(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

function formatDuration(start: Date | null, end: Date | null): string {
	if (!start) return "—";
	const endTime = end || new Date();
	const mins = Math.round((endTime.getTime() - start.getTime()) / 60_000);
	if (mins < 60) return `${mins} min`;
	return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function esc(s: string | null | undefined): string {
	if (!s) return "";
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface ReportInput {
	processName: string;
	orgName: string;
	date: string;
	duration: string;
	nodes: any[];
	lanes: Map<string, any[]>;
	transcript: any[];
	nodesWithSop: any[];
	summary: { summary: string; actionItems: string[] } | null;
	audit: { completenessScore: number; newGaps: any[] } | null;
}

function generateReportHtml(data: ReportInput): string {
	const nodeCount = data.nodes.length;
	const confirmedCount = data.nodes.filter((n) => n.state === "CONFIRMED").length;
	const sopCount = data.nodesWithSop.length;
	const laneCount = data.lanes.size;

	return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(data.processName)} — Reporte de Sesión</title>
<style>
	@page { margin: 1.5cm 2cm; size: A4; }
	* { box-sizing: border-box; margin: 0; padding: 0; }
	body { font-family: 'Inter', 'Geist', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; }

	/* Cover */
	.cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; page-break-after: always; }
	.cover-badge { display: inline-flex; align-items: center; gap: 6px; background: #ECFDF5; color: #00E5C0; padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: 600; margin-bottom: 32px; }
	.cover h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
	.cover .org { font-size: 16px; color: #64748B; margin-bottom: 40px; }
	.cover-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 480px; }
	.cover-stat { text-align: center; }
	.cover-stat .num { font-size: 28px; font-weight: 700; color: #00E5C0; }
	.cover-stat .lbl { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
	.cover-footer { margin-top: 60px; font-size: 11px; color: #CBD5E1; }

	/* Section headers */
	.section { margin-bottom: 32px; }
	h2 { font-size: 18px; font-weight: 700; color: #0F172A; padding-bottom: 8px; border-bottom: 2px solid #00E5C0; margin-bottom: 16px; }
	h3 { font-size: 14px; font-weight: 600; color: #334155; margin: 16px 0 8px; }

	/* Cards */
	.card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 12px; page-break-inside: avoid; }
	.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
	.card-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; }
	.card-title { font-size: 14px; font-weight: 600; color: #0F172A; }
	.card-subtitle { font-size: 11px; color: #94A3B8; }
	.card-body { font-size: 13px; color: #475569; line-height: 1.7; }

	/* Tags */
	.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin: 2px; }
	.tag-blue { background: #ECFDF5; color: #00E5C0; }
	.tag-green { background: #F0FDF4; color: #16A34A; }
	.tag-amber { background: #FFFBEB; color: #D97706; }
	.tag-gray { background: #F1F5F9; color: #475569; }

	/* SOP */
	.sop-step { display: flex; gap: 12px; margin: 8px 0; padding: 10px; background: white; border: 1px solid #E2E8F0; border-radius: 6px; }
	.step-num { width: 24px; height: 24px; border-radius: 50%; background: #00E5C0; color: #0A1428; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
	.step-body { flex: 1; }
	.step-action { font-size: 13px; font-weight: 600; color: #0F172A; }
	.step-desc { font-size: 12px; color: #64748B; margin-top: 2px; }
	.exception { background: #FEF9C3; border-radius: 4px; padding: 4px 8px; font-size: 11px; color: #92400E; margin-top: 4px; }

	/* Lane section */
	.lane-header { background: #1E293B; color: white; padding: 8px 16px; border-radius: 6px 6px 0 0; font-size: 13px; font-weight: 600; }
	.lane-body { border: 1px solid #E2E8F0; border-top: 0; border-radius: 0 0 6px 6px; padding: 12px; margin-bottom: 16px; }

	/* Transcript */
	.transcript-entry { padding: 4px 0; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
	.transcript-time { color: #94A3B8; font-size: 11px; font-variant-numeric: tabular-nums; }
	.transcript-speaker { font-weight: 600; color: #334155; }
	.transcript-text { color: #475569; }

	/* Summary box */
	.summary-box { background: #ECFDF5; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
	.summary-box p { font-size: 13px; color: #1E40AF; line-height: 1.7; }

	/* Print */
	@media print {
		body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
		.no-print { display: none; }
	}
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
	<div class="cover-badge">Auditora.ai</div>
	<h1>${esc(data.processName)}</h1>
	<p class="org">${esc(data.orgName)}</p>
	<div class="cover-stats">
		<div class="cover-stat"><div class="num">${nodeCount}</div><div class="lbl">Actividades</div></div>
		<div class="cover-stat"><div class="num">${laneCount}</div><div class="lbl">Roles</div></div>
		<div class="cover-stat"><div class="num">${sopCount}</div><div class="lbl">SOPs</div></div>
		<div class="cover-stat"><div class="num">${data.transcript.length}</div><div class="lbl">Transcript</div></div>
	</div>
	<div class="cover-footer">
		<p>${esc(data.date)} · Duración: ${esc(data.duration)}</p>
		<p style="margin-top:4px;">Generado por Auditora.ai</p>
	</div>
</div>

${data.summary ? `
<!-- Executive Summary -->
<div class="section">
	<h2>Resumen Ejecutivo</h2>
	<div class="summary-box"><p>${esc(data.summary.summary)}</p></div>
	${data.summary.actionItems.length > 0 ? `
	<h3>Acciones Pendientes</h3>
	<ul style="padding-left:20px;">
		${data.summary.actionItems.map((a) => `<li style="font-size:13px;color:#334155;margin:4px 0;">${esc(a)}</li>`).join("")}
	</ul>` : ""}
</div>` : ""}

<!-- Process Map -->
<div class="section">
	<h2>Mapa del Proceso</h2>
	<p style="font-size:13px;color:#64748B;margin-bottom:16px;">${confirmedCount} actividades confirmadas en ${laneCount} rol(es)</p>
	${Array.from(data.lanes.entries()).map(([lane, nodes]) => `
	<div>
		<div class="lane-header">${esc(lane)}</div>
		<div class="lane-body">
			${nodes.map((n) => {
				const props = (n.properties || {}) as any;
				const typeLabel = n.nodeType.replace(/_/g, " ").toLowerCase();
				return `<div class="card">
				<div class="card-header">
					<div class="card-icon" style="background:${n.nodeType.includes("GATEWAY") ? "#EAB308" : n.nodeType === "START_EVENT" ? "#16A34A" : n.nodeType === "END_EVENT" ? "#DC2626" : "#00E5C0"}">${n.label?.charAt(0) || "?"}</div>
					<div>
						<div class="card-title">${esc(n.label)}</div>
						<div class="card-subtitle">${esc(typeLabel)}${n.state === "CONFIRMED" ? " · Confirmado" : n.state === "FORMING" ? " · En formación" : ""}</div>
					</div>
				</div>
				${props.description ? `<div class="card-body">${esc(typeof props.description === "string" ? props.description : "")}</div>` : ""}
				<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
					${(props.systems || []).map((s: string) => `<span class="tag tag-blue">${esc(s)}</span>`).join("")}
					${props.responsable ? `<span class="tag tag-gray">${esc(props.responsable)}</span>` : ""}
					${props.slaValue ? `<span class="tag tag-amber">SLA: ${props.slaValue} ${props.slaUnit || ""}</span>` : ""}
					${(props.inputs || []).map((i: string) => `<span class="tag tag-green">↓ ${esc(i)}</span>`).join("")}
					${(props.outputs || []).map((o: string) => `<span class="tag tag-green">↑ ${esc(o)}</span>`).join("")}
				</div>
			</div>`;
			}).join("")}
		</div>
	</div>`).join("")}
</div>

${sopCount > 0 ? `
<!-- Procedures -->
<div class="section" style="page-break-before:always;">
	<h2>Procedimientos de Trabajo (SOPs)</h2>
	<p style="font-size:13px;color:#64748B;margin-bottom:16px;">${sopCount} procedimiento(s) documentados</p>
	${data.nodesWithSop.map((n) => {
		const proc = n.procedure as any;
		return `
		<div class="card" style="margin-bottom:24px;">
			<h3 style="margin:0 0 4px;">${esc(proc.activityName || n.label)}</h3>
			<div style="display:flex;gap:16px;font-size:11px;color:#94A3B8;margin-bottom:12px;">
				<span>Código: ${esc(proc.procedureCode || "—")}</span>
				<span>Responsable: ${esc(proc.responsible || "—")}</span>
				<span>Frecuencia: ${esc(proc.frequency || "—")}</span>
				${proc.overallConfidence != null ? `<span>Confianza: ${Math.round(proc.overallConfidence * 100)}%</span>` : ""}
			</div>
			${proc.objective ? `<p style="font-size:13px;color:#334155;margin-bottom:8px;"><strong>Objetivo:</strong> ${esc(proc.objective)}</p>` : ""}
			${proc.scope ? `<p style="font-size:13px;color:#334155;margin-bottom:8px;"><strong>Alcance:</strong> ${esc(proc.scope)}</p>` : ""}
			${proc.prerequisites?.length > 0 ? `
			<p style="font-size:12px;font-weight:600;color:#334155;margin:8px 0 4px;">Prerrequisitos</p>
			<ul style="padding-left:16px;">${proc.prerequisites.map((p: string) => `<li style="font-size:12px;color:#475569;">${esc(p)}</li>`).join("")}</ul>` : ""}
			${proc.steps?.length > 0 ? `
			<p style="font-size:12px;font-weight:600;color:#334155;margin:12px 0 8px;">Pasos (${proc.steps.length})</p>
			${proc.steps.map((s: any) => `
			<div class="sop-step">
				<div class="step-num">${s.stepNumber}</div>
				<div class="step-body">
					<div class="step-action">${esc(s.action)}</div>
					<div class="step-desc">${esc(s.description)}</div>
					${s.systems?.length > 0 ? `<div style="margin-top:4px;">${s.systems.map((sys: string) => `<span class="tag tag-blue">${esc(sys)}</span>`).join("")}</div>` : ""}
					${s.exceptions?.length > 0 ? s.exceptions.map((ex: any) => `<div class="exception">Si: ${esc(ex.condition)} → ${esc(ex.action)}</div>`).join("") : ""}
				</div>
			</div>`).join("")}` : ""}
			${proc.gaps?.length > 0 ? `
			<p style="font-size:12px;font-weight:600;color:#D97706;margin:12px 0 4px;">Información Pendiente</p>
			<ul style="padding-left:16px;">${proc.gaps.map((g: string) => `<li style="font-size:12px;color:#92400E;">${esc(g)}</li>`).join("")}</ul>` : ""}
		</div>`;
	}).join("")}
</div>` : ""}

${data.transcript.length > 0 ? `
<!-- Transcript -->
<div class="section" style="page-break-before:always;">
	<h2>Transcripción</h2>
	<p style="font-size:13px;color:#64748B;margin-bottom:12px;">${data.transcript.length} entradas</p>
	${data.transcript.map((t) => {
		const ts = t.timestamp ? new Date(t.timestamp).toLocaleTimeString("es", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
		return `<div class="transcript-entry">
			<span class="transcript-time">${esc(ts)}</span>
			<span class="transcript-speaker"> ${esc(t.speaker || "?")}</span>:
			<span class="transcript-text">${esc(t.text)}</span>
		</div>`;
	}).join("")}
</div>` : ""}

<div style="text-align:center;padding:32px 0;color:#CBD5E1;font-size:11px;">
	Generado por Auditora.ai · ${esc(data.date)}
</div>

</body>
</html>`;
}
