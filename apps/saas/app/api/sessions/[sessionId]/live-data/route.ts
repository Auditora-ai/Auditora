/**
 * Live session data endpoint
 *
 * Polled by MeetingView every 3 seconds to get latest
 * transcript entries, diagram nodes, and teleprompter questions.
 *
 * Will be replaced by Supabase Realtime broadcast in Phase 2.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			select: { id: true, status: true },
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		// Fetch latest transcript entries
		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { createdAt: "asc" },
			take: 200,
			select: {
				id: true,
				speaker: true,
				text: true,
				timestamp: true,
			},
		});

		// Fetch diagram nodes
		const nodes = await db.diagramNode.findMany({
			where: { sessionId },
			select: {
				id: true,
				nodeType: true,
				label: true,
				state: true,
				lane: true,
				connections: true,
			},
		});

		// Fetch latest teleprompter question
		const latestQuestion = await db.teleprompterLog.findFirst({
			where: { sessionId },
			orderBy: { shownAt: "desc" },
			select: { question: true },
		});

		return NextResponse.json({
			status: session.status,
			transcript: transcript.map((t) => ({
				id: t.id,
				speaker: t.speaker,
				text: t.text,
				timestamp: t.timestamp,
			})),
			nodes: nodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				state: n.state.toLowerCase(),
				lane: n.lane,
				connections: n.connections,
			})),
			teleprompterQuestion: latestQuestion?.question || null,
		});
	} catch (error) {
		console.error("[LiveData] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
