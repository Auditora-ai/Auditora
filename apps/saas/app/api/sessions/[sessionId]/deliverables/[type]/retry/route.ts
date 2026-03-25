/**
 * POST /api/sessions/[sessionId]/deliverables/[type]/retry
 *
 * Retries a failed deliverable pipeline. Resets status to "pending"
 * and re-runs the pipeline in fire-and-forget mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	generateSessionSummary,
	auditProcess,
	generateRaci,
	auditRisks,
} from "@repo/ai";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string; type: string }> },
) {
	const { sessionId, type } = await params;

	const authResult = await requireSessionAuth(sessionId);
	if (isAuthError(authResult)) return authResult;

	const validTypes = ["summary", "process_audit", "raci", "risk_audit"];
	if (!validTypes.includes(type)) {
		return NextResponse.json({ error: "Invalid deliverable type" }, { status: 400 });
	}

	// Find the deliverable
	const deliverable = await db.sessionDeliverable.findUnique({
		where: { sessionId_type: { sessionId, type } },
	});

	if (!deliverable) {
		return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
	}

	// Reset status to pending
	await db.sessionDeliverable.update({
		where: { sessionId_type: { sessionId, type } },
		data: { status: "pending", error: null },
	});

	// Fire-and-forget: re-run the pipeline
	retryPipeline(sessionId, type).catch((err) => {
		console.error(`[Retry] Pipeline ${type} failed for ${sessionId.substring(0, 8)}:`, err);
	});

	return NextResponse.json({ ok: true }, { status: 202 });
}

async function retryPipeline(sessionId: string, type: string) {
	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			transcriptEntries: { orderBy: { timestamp: "asc" } },
			diagramNodes: { where: { state: { not: "REJECTED" } } },
			processDefinition: true,
		},
	});
	if (!session) return;

	const transcript = session.transcriptEntries.map((t) => ({
		speaker: t.speaker,
		text: (t as any).correctedText ?? t.text,
		timestamp: t.timestamp,
	}));

	const nodes = session.diagramNodes.map((n) => ({
		id: n.id,
		type: n.nodeType.toLowerCase(),
		label: n.label,
		lane: n.lane || undefined,
		connections: n.connections,
		state: n.state.toLowerCase(),
	}));

	const lanes = [...new Set(nodes.map((n) => n.lane).filter(Boolean))] as string[];
	const confirmedNodes = nodes.filter((n) => n.state === "confirmed");
	const transcriptText = transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n");

	try {
		await db.sessionDeliverable.update({
			where: { sessionId_type: { sessionId, type } },
			data: { status: "running", startedAt: new Date() },
		});

		let result: any;

		switch (type) {
			case "summary":
				result = await generateSessionSummary(
					session.organizationId,
					session.type,
					confirmedNodes.map((n) => ({ id: n.id, type: n.type, label: n.label, lane: n.lane })),
					transcript,
				);
				break;

			case "process_audit":
				result = await auditProcess({
					organizationId: session.organizationId,
					mode: "initial",
					knowledgeSnapshot: {
						roles: lanes.map((l) => ({ name: l, responsibilities: [], confirmed: true })),
						triggers: [],
						steps: confirmedNodes.map((n) => ({ label: n.label, hasExceptionPath: false, hasDecisionCriteria: false, confirmed: true, role: n.lane })),
						decisions: nodes.filter((n) => n.type.includes("gateway")).map((n) => ({ label: n.label, outcomes: [], confirmed: true })),
						exceptions: [],
						outputs: [],
						systems: [],
						formats: [],
						slas: [],
						volumetrics: [],
						costs: [],
						interProcessLinks: [],
						contradictions: [],
					},
					confidenceScores: {},
					processDefinition: {
						name: session.processDefinition?.name || "Proceso",
						level: "PROCESS",
						goals: [],
						triggers: [],
						outputs: [],
						bpmnNodeCount: nodes.length,
						confirmedNodeCount: confirmedNodes.length,
					},
					newData: {
						transcriptExcerpts: [{ sessionId, text: transcriptText }],
						diagramNodes: nodes.map((n) => ({ label: n.label, type: n.type, lane: n.lane, state: n.state })),
					},
				});
				break;

			case "raci":
				if (lanes.length < 2) {
					await db.sessionDeliverable.update({
						where: { sessionId_type: { sessionId, type: "raci" } },
						data: { status: "skipped", error: "Se necesitan al menos 2 roles para generar RACI", completedAt: new Date() },
					});
					return;
				}
				result = await generateRaci(
					session.organizationId,
					lanes,
					confirmedNodes.filter((n) => n.type === "task" || n.type === "usertask").map((n) => n.label),
					transcriptText,
				);
				break;

			case "risk_audit":
				result = await auditRisks({
					organizationId: session.organizationId,
					mode: "risk",
					processDefinition: {
						name: session.processDefinition?.name || "Proceso",
						description: session.processDefinition?.description || "",
						level: "PROCESS",
						goals: [],
					},
					knowledgeSnapshot: {
						roles: lanes.map((l) => ({ name: l, responsibilities: [], confirmed: true })),
						triggers: [],
						steps: confirmedNodes.map((n) => ({ label: n.label, hasExceptionPath: false, hasDecisionCriteria: false, confirmed: true })),
						decisions: nodes.filter((n) => n.type.includes("gateway")).map((n) => ({ label: n.label, outcomes: [], confirmed: true })),
						exceptions: [],
						outputs: [],
						systems: [],
						formats: [],
						slas: [],
						volumetrics: [],
						costs: [],
						interProcessLinks: [],
						contradictions: [],
					},
					intelligenceItems: [],
					existingRisks: [],
					transcriptExcerpts: [{ text: transcriptText }],
				});
				break;
		}

		await db.sessionDeliverable.update({
			where: { sessionId_type: { sessionId, type } },
			data: { status: "completed", data: result as any, completedAt: new Date() },
		});
		console.log(`[Retry] ${type} completed for ${sessionId.substring(0, 8)}`);
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : "Unknown error";
		await db.sessionDeliverable.update({
			where: { sessionId_type: { sessionId, type } },
			data: { status: "failed", error: errorMsg, completedAt: new Date() },
		});
		console.error(`[Retry] ${type} failed for ${sessionId.substring(0, 8)}:`, errorMsg);
	}
}
