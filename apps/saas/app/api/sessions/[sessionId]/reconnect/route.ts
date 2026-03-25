/**
 * Reconnect Bot API
 *
 * POST /api/sessions/[sessionId]/reconnect
 *
 * Reconnects the Recall.ai bot to the same or a new meeting link.
 * Handles: bot kicked, call ended, link changed, connection failure.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider } from "@repo/ai";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;
		const { session } = authResult;

		const body = await request.json().catch(() => ({}));
		const newMeetingUrl = body.meetingUrl as string | undefined;

		const meetingUrl = newMeetingUrl || session.meetingUrl;

		if (!meetingUrl) {
			return NextResponse.json(
				{ error: "No meeting URL available. Provide a meetingUrl in the request body." },
				{ status: 400 },
			);
		}

		// If there's an existing bot, try to leave it first
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already be disconnected — that's fine
			}
		}

		// Join with new or existing meeting URL
		const callBot = createCallBotProvider();
		const { botId } = await callBot.joinMeeting(meetingUrl);

		// Update session with new bot ID and URL
		await db.meetingSession.update({
			where: { id: sessionId },
			data: {
				recallBotId: botId,
				recallBotStatus: "joining",
				meetingUrl: meetingUrl,
				status: "CONNECTING",
			},
		});

		console.log(`[Reconnect] Session ${sessionId}: new bot ${botId} joining ${meetingUrl}`);

		return NextResponse.json({
			ok: true,
			botId,
			meetingUrl,
			message: newMeetingUrl ? "Bot joining new meeting link" : "Bot reconnecting to same meeting",
		});
	} catch (error: any) {
		console.error("[Reconnect] Error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to reconnect" },
			{ status: 500 },
		);
	}
}
