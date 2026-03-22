/**
 * Recall.ai Webhook Handler
 *
 * Actual payload format from Recall.ai (transcript.data event):
 * {
 *   "event": "transcript.data",
 *   "data": {
 *     "data": {
 *       "words": [{ "text": "Hello", "start_timestamp": { "relative": 1.23 } }],
 *       "language_code": "en-US",
 *       "participant": { "id": 100, "name": "Oscar Nuñez" }
 *     },
 *     "transcript": { "id": "..." },
 *     "bot_id": "..."
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json();

		console.log(
			"[Recall Webhook] Event:",
			payload?.event,
			"Bot:",
			payload?.data?.bot_id,
		);

		// Only process transcript.data events
		if (payload?.event !== "transcript.data") {
			console.log("[Recall Webhook] Non-transcript event, skipping");
			return NextResponse.json({ ok: true });
		}

		// Extract from the ACTUAL Recall.ai payload structure
		const wordsData = payload?.data?.data?.words;
		const participant = payload?.data?.data?.participant;
		const botId = payload?.data?.bot_id;

		if (!wordsData || wordsData.length === 0) {
			console.log("[Recall Webhook] No words in payload");
			return NextResponse.json({ ok: true });
		}

		// Build text from words
		const text = wordsData.map((w: any) => w.text).join(" ").trim();
		const speaker = participant?.name || "Unknown";
		const timestamp =
			wordsData[0]?.start_timestamp?.relative || Date.now() / 1000;

		if (!text) {
			console.log("[Recall Webhook] Empty text after joining words");
			return NextResponse.json({ ok: true });
		}

		console.log(`[Recall Webhook] 📝 ${speaker}: "${text}"`);

		// Find session by bot ID
		if (!botId) {
			console.log("[Recall Webhook] No bot_id, can't match session");
			return NextResponse.json({ ok: true });
		}

		const session = await db.meetingSession.findFirst({
			where: { recallBotId: botId },
		});

		if (!session) {
			console.log(`[Recall Webhook] No session for bot ${botId}`);
			return NextResponse.json({ ok: true });
		}

		// Update session status to ACTIVE if still CONNECTING
		if (session.status === "CONNECTING") {
			await db.meetingSession.update({
				where: { id: session.id },
				data: { status: "ACTIVE", startedAt: new Date() },
			});
			console.log(
				`[Recall Webhook] ✅ Session ${session.id} now ACTIVE`,
			);
		}

		// Store transcript entry
		await db.transcriptEntry.create({
			data: {
				sessionId: session.id,
				speaker,
				text,
				timestamp,
			},
		});

		console.log(
			`[Recall Webhook] 💾 Stored: "${text.substring(0, 50)}..." for session ${session.id}`,
		);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Recall Webhook] Error:", error);
		return NextResponse.json({ ok: true });
	}
}
