/**
 * Session Reset API
 *
 * POST /api/sessions/[sessionId]/reset
 * Body: { scope: "diagram" | "transcript" | "all" }
 *
 * Clears session data based on scope:
 * - diagram: delete all diagram nodes, clear bpmnXml
 * - transcript: delete all transcript entries
 * - all: diagram + transcript + teleprompter + procedures
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const { scope } = body as { scope: "diagram" | "transcript" | "all" };

		if (!["diagram", "transcript", "all"].includes(scope)) {
			return NextResponse.json({ error: "scope must be diagram, transcript, or all" }, { status: 400 });
		}

		const deleted: string[] = [];

		if (scope === "diagram" || scope === "all") {
			// Delete all diagram nodes (cascades to comments)
			const { count: nodeCount } = await db.diagramNode.deleteMany({ where: { sessionId } });
			// Clear saved BPMN XML
			await db.meetingSession.update({ where: { id: sessionId }, data: { bpmnXml: null } });
			deleted.push(`${nodeCount} nodos`);
		}

		if (scope === "transcript" || scope === "all") {
			const { count: transcriptCount } = await db.transcriptEntry.deleteMany({ where: { sessionId } });
			deleted.push(`${transcriptCount} transcripciones`);
		}

		if (scope === "all") {
			// Clear teleprompter questions
			const { count: questionCount } = await db.teleprompterLog.deleteMany({ where: { sessionId } });
			deleted.push(`${questionCount} preguntas`);

			// Clear correction logs
			await db.correctionLog.deleteMany({ where: { sessionId } });
		}

		console.log(`[Reset] Session ${sessionId} (${scope}): deleted ${deleted.join(", ")}`);

		return NextResponse.json({ ok: true, scope, deleted });
	} catch (error: any) {
		console.error("[Reset]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
