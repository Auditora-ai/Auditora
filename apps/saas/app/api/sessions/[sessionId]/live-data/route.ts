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
// WARNING: This import works because both route files run in the same
// Node.js process on Railway. See webhook route for deployment assumptions.
import { sessionActivity } from "../../../webhook/recall/route";
import { recordEvent } from "@meeting/lib/session-timeline";

// One-time guards to avoid spamming diagnostic events
const firstTranscriptPollRecorded = new Set<string>();
const firstEmptyPollRecorded = new Set<string>();

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

		// Diagnostic: record first poll events
		const transcript0 = await db.transcriptEntry.count({ where: { sessionId } });
		if (transcript0 > 0 && !firstTranscriptPollRecorded.has(sessionId)) {
			firstTranscriptPollRecorded.add(sessionId);
			recordEvent(sessionId, "first_poll_with_transcript", `entries=${transcript0}`);
		} else if (transcript0 === 0 && !firstEmptyPollRecorded.has(sessionId)) {
			firstEmptyPollRecorded.add(sessionId);
			recordEvent(sessionId, "first_poll_empty");
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

		// Bot activity state from in-memory Map
		const activity = sessionActivity.get(sessionId);
		const STALE_THRESHOLD = 60_000; // 60s

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
			botActivity: {
				type: activity?.type ?? "listening",
				detail: activity?.detail ?? null,
				updatedAt: activity?.updatedAt ?? null,
				stale: activity
					? Date.now() - activity.updatedAt > STALE_THRESHOLD
					: true,
			},
		});
	} catch (error) {
		console.error("[LiveData] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}
