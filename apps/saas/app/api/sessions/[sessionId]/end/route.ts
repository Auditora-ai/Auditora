import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider, generateSessionSummary } from "@repo/ai";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				diagramNodes: { where: { state: { not: "REJECTED" } } },
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		// Auto-confirm all forming nodes
		await db.diagramNode.updateMany({
			where: { sessionId, state: "FORMING" },
			data: { state: "CONFIRMED", confirmedAt: new Date() },
		});

		// Leave the call if bot is active
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already have left
			}
		}

		// Mark session as ended
		await db.meetingSession.update({
			where: { id: sessionId },
			data: { status: "ENDED", endedAt: new Date() },
		});

		// Generate session summary async (non-blocking)
		generateSummaryInBackground(sessionId, session.type).catch((err) =>
			console.error("[EndSession] Summary generation failed:", err),
		);

		return NextResponse.json({ ok: true, sessionId });
	} catch (error) {
		console.error("[EndSession] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

async function generateSummaryInBackground(
	sessionId: string,
	sessionType: string,
) {
	const [nodes, transcriptEntries] = await Promise.all([
		db.diagramNode.findMany({
			where: { sessionId, state: "CONFIRMED" },
		}),
		db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "asc" },
		}),
	]);

	const result = await generateSessionSummary(
		sessionType,
		nodes.map((n) => ({
			id: n.id,
			type: n.nodeType,
			label: n.label,
			lane: n.lane || undefined,
		})),
		transcriptEntries.map((e) => ({
			speaker: e.speaker,
			text: e.text,
			timestamp: e.timestamp,
		})),
	);

	await db.sessionSummary.upsert({
		where: { sessionId },
		create: {
			sessionId,
			summary: result.summary,
			actionItems: result.actionItems,
		},
		update: {
			summary: result.summary,
			actionItems: result.actionItems,
		},
	});
}
