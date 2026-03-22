/**
 * Recall.ai Webhook Handler
 *
 * Receives real-time transcription events from Recall.ai and:
 * 1. Logs the raw payload for debugging
 * 2. Stores the transcript entry in the database
 * 3. Triggers the AI process extraction pipeline (throttled)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json();

		// Log EVERY webhook call for debugging
		console.log("[Recall Webhook] Received:", JSON.stringify(payload).substring(0, 500));

		// Recall.ai sends different event types - extract transcript data
		const transcriptData = payload?.data?.transcript;
		const botId = payload?.data?.bot_id || payload?.bot_id;

		if (!transcriptData) {
			console.log("[Recall Webhook] No transcript data in payload, event type:", payload?.event);
			return NextResponse.json({ ok: true });
		}

		// Extract text from transcript
		const speaker = transcriptData.speaker || transcriptData.participant_name || "Unknown";
		const text = transcriptData.words
			? transcriptData.words.map((w: any) => w.text).join(" ")
			: transcriptData.text || "";
		const timestamp = transcriptData.words?.[0]?.start_time
			? Number.parseFloat(transcriptData.words[0].start_time)
			: Date.now() / 1000;

		if (!text.trim()) {
			console.log("[Recall Webhook] Empty transcript text, skipping");
			return NextResponse.json({ ok: true });
		}

		console.log(`[Recall Webhook] 📝 ${speaker}: "${text}"`);

		// Find session by bot ID
		if (botId) {
			const session = await db.meetingSession.findFirst({
				where: { recallBotId: botId },
			});

			if (session) {
				// Update session status to ACTIVE if still CONNECTING
				if (session.status === "CONNECTING") {
					await db.meetingSession.update({
						where: { id: session.id },
						data: { status: "ACTIVE", startedAt: new Date() },
					});
					console.log(`[Recall Webhook] Session ${session.id} now ACTIVE`);
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
				console.log(`[Recall Webhook] Stored transcript for session ${session.id}`);
			} else {
				console.log(`[Recall Webhook] No session found for bot ${botId}`);
			}
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Recall Webhook] Error:", error);
		return NextResponse.json({ ok: true }); // Always 200 to avoid Recall.ai retries
	}
}
