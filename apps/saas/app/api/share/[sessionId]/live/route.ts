/**
 * Public Share Live Data API
 *
 * GET /api/share/[sessionId]/live
 *
 * Returns the latest BPMN diagram state for the share viewer.
 * No auth required — but only returns data for ACTIVE sessions.
 * Once session ends, returns { ended: true }.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			select: {
				id: true,
				status: true,
				bpmnXml: true,
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		// Session ended — tell viewer to stop polling
		if (session.status === "ENDED" || session.status === "FAILED") {
			return NextResponse.json({ ended: true, bpmnXml: session.bpmnXml });
		}

		// Get latest nodes
		const nodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
			select: {
				id: true,
				nodeType: true,
				label: true,
				state: true,
				lane: true,
				connections: true,
			},
		});

		return NextResponse.json({
			ended: false,
			bpmnXml: session.bpmnXml,
			nodes: nodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				state: n.state.toLowerCase(),
				lane: n.lane || undefined,
				connections: n.connections || [],
			})),
		});
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
