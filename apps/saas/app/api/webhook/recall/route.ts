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

		// Log top-level keys to find bot_id location
		console.log(
			"[Recall Webhook] Event:",
			payload?.event,
			"Top keys:",
			Object.keys(payload || {}),
			"Data keys:",
			Object.keys(payload?.data || {}),
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
			console.log("[Recall Webhook] No words in payload. Raw data keys:", Object.keys(payload?.data?.data || {}));
			return NextResponse.json({ ok: true });
		}

		// Build text from words — filter out empty entries
		const text = wordsData
			.map((w: any) => w.text || w.word || "")
			.filter((t: string) => t.trim())
			.join(" ")
			.trim();

		console.log("[Recall Webhook] Words raw:", JSON.stringify(wordsData).substring(0, 200));
		const speaker = participant?.name || "Unknown";
		const timestamp =
			wordsData[0]?.start_timestamp?.relative || Date.now() / 1000;

		if (!text) {
			console.log("[Recall Webhook] Empty text after joining words");
			return NextResponse.json({ ok: true });
		}

		console.log(`[Recall Webhook] 📝 ${speaker}: "${text}"`);

		// bot_id is at payload.data.bot (object with id) or payload.data.bot_id
		const botId = payload?.data?.bot?.id || payload?.data?.bot_id || payload?.bot_id;
		console.log("[Recall Webhook] Bot ID:", botId);

		let session;
		if (botId) {
			session = await db.meetingSession.findFirst({
				where: { recallBotId: botId },
			});
		}

		// Fallback: find the most recent active or connecting session
		if (!session) {
			session = await db.meetingSession.findFirst({
				where: {
					status: { in: ["ACTIVE", "CONNECTING"] },
				},
				orderBy: { createdAt: "desc" },
			});
		}

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
