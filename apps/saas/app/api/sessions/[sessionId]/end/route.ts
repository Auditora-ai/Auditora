import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider } from "@repo/ai";

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

		return NextResponse.json({ ok: true, sessionId });
	} catch (error) {
		console.error("[EndSession] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
