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

		// Fetch last 6 teleprompter questions (latest = current, rest = queue)
		const recentQuestions = await db.teleprompterLog.findMany({
			where: { sessionId },
			orderBy: { shownAt: "desc" },
			take: 6,
			select: { question: true },
		});

		const teleprompterQuestion = recentQuestions[0]?.question || null;
		const questionQueue = recentQuestions.slice(1).map((q) => q.question);

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
			teleprompterQuestion,
			questionQueue,
		});
	} catch (error) {
		console.error("[LiveData] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
