/**
 * Disconnect Bot API
 *
 * POST /api/sessions/[sessionId]/disconnect-bot
 *
 * Removes the bot from the call and returns to local mode.
 * The session stays active for manual diagram work.
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

		// Leave the meeting if there's an active bot
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already be disconnected
			}
		}

		// Clear bot reference, keep session active
		await db.meetingSession.update({
			where: { id: sessionId },
			data: {
				recallBotId: null,
				recallBotStatus: null,
				status: "ACTIVE",
			},
		});

		console.log(`[DisconnectBot] Session ${sessionId}: bot removed, back to local mode`);

		return NextResponse.json({ ok: true, message: "Bot disconnected, session in local mode" });
	} catch (error: any) {
		console.error("[DisconnectBot] Error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to disconnect bot" },
			{ status: 500 },
		);
	}
}
