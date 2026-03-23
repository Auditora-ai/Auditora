/**
 * Recall.ai Webhook Handler
 *
 * Receives transcript events -> stores in DB -> triggers AI pipelines:
 * 1. Process Extraction (every 15s): transcript -> BPMN nodes
 * 2. Teleprompter (every 30s): transcript + diagram -> next question
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	extractProcessUpdates,
	generateNextQuestion,
	buildSessionContext,
} from "@repo/ai";
import type { SessionContext } from "@repo/ai";
import crypto from "crypto";
import { recordEvent } from "@meeting/lib/session-timeline";

// Throttle AI calls per session
const lastExtractionTime = new Map<string, number>();
const lastTeleprompterTime = new Map<string, number>();
const EXTRACTION_INTERVAL = 15_000;
const TELEPROMPTER_INTERVAL = 30_000;

// Bot activity state (in-memory, same process as live-data endpoint)
// WARNING: Only works in single-process deployment (Railway). If scaling
// to multiple instances, replace with Redis or DB-backed state.
type BotActivityType = "listening" | "extracting" | "diagramming" | "suggesting";
interface ActivityState {
	type: BotActivityType;
	detail?: string;
	updatedAt: number;
}
export const sessionActivity = new Map<string, ActivityState>();

function setActivity(sessionId: string, type: BotActivityType, detail?: string) {
	sessionActivity.set(sessionId, { type, detail, updatedAt: Date.now() });
	console.log(`[Activity] ${sessionId.substring(0, 8)}: ${type}${detail ? ` — ${detail}` : ""}`);
}

// Cleanup stale entries every 30 minutes (zombie sessions)
setInterval(() => {
	const cutoff = Date.now() - 4 * 60 * 60 * 1000;
	for (const [id, state] of sessionActivity) {
		if (state.updatedAt < cutoff) sessionActivity.delete(id);
	}
}, 30 * 60 * 1000);

function verifyWebhookSignature(body: string, signature: string | null): boolean {
	const secret = process.env.RECALL_WEBHOOK_SECRET;
	if (!secret) return true; // Skip verification if secret not configured
	if (!signature) return false;

	const expected = crypto
		.createHmac("sha256", secret)
		.update(body)
		.digest("hex");
	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expected),
	);
}

export async function POST(request: NextRequest) {
	try {
		const bodyText = await request.text();

		// Verify webhook signature if secret is configured
		const signature = request.headers.get("x-recall-signature");
		if (process.env.RECALL_WEBHOOK_SECRET && !verifyWebhookSignature(bodyText, signature)) {
			console.warn("[Webhook] Invalid signature — rejecting request");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const payload = JSON.parse(bodyText);

		if (payload?.event !== "transcript.data") {
			return NextResponse.json({ ok: true });
		}

		// Extract text from Recall.ai payload
		const wordsData = payload?.data?.data?.words;
		const participant = payload?.data?.data?.participant;

		if (!wordsData || wordsData.length === 0) {
			return NextResponse.json({ ok: true });
		}

		const text = wordsData
			.map((w: any) => w.text || "")
			.filter((t: string) => t.trim())
			.join(" ")
			.trim();

		if (!text) return NextResponse.json({ ok: true });

		const speaker = participant?.name || "Unknown";
		const timestamp = wordsData[0]?.start_timestamp?.relative || 0;

		// Find session
		const botId =
			payload?.data?.bot?.id ||
			payload?.data?.bot_id ||
			payload?.bot_id;

		let session;
		if (botId) {
			session = await db.meetingSession.findFirst({
				where: { recallBotId: botId },
			});
		}
		if (!session) {
			session = await db.meetingSession.findFirst({
				where: { status: { in: ["ACTIVE", "CONNECTING"] } },
				orderBy: { createdAt: "desc" },
			});
		}
		if (!session) return NextResponse.json({ ok: true });

		recordEvent(session.id, "webhook_received", `speaker=${speaker}, chars=${text.length}`);

		// Activate session on first transcript
		if (session.status === "CONNECTING") {
			await db.meetingSession.update({
				where: { id: session.id },
				data: { status: "ACTIVE", startedAt: new Date() },
			});
			recordEvent(session.id, "session_activated", "CONNECTING -> ACTIVE");
		}

		// Store transcript
		await db.transcriptEntry.create({
			data: { sessionId: session.id, speaker, text, timestamp },
		});
		recordEvent(session.id, "transcript_stored", `speaker=${speaker}`);

		console.log(`[Webhook] ${speaker}: "${text.substring(0, 60)}"`);

		// --- AI PIPELINES (throttled, run in background) ---
		const now = Date.now();

		// Process Extraction — every 15s
		const lastExtraction = lastExtractionTime.get(session.id) || 0;
		if (now - lastExtraction >= EXTRACTION_INTERVAL) {
			lastExtractionTime.set(session.id, now);
			recordEvent(session.id, "extraction_triggered");
			runExtraction(session.id).catch((err) =>
				console.error("[Webhook] Extraction error:", err),
			);
		}

		// Teleprompter — every 30s
		const lastTeleprompter = lastTeleprompterTime.get(session.id) || 0;
		if (now - lastTeleprompter >= TELEPROMPTER_INTERVAL) {
			lastTeleprompterTime.set(session.id, now);
			recordEvent(session.id, "teleprompter_triggered");
			runTeleprompter(session.id).catch((err) =>
				console.error("[Webhook] Teleprompter error:", err),
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Webhook] Error:", error);
		return NextResponse.json({ ok: true });
	}
}

/** Extract BPMN nodes from recent transcript */
async function runExtraction(sessionId: string) {
	setActivity(sessionId, "extracting");

	try {
		// Build business context for context-aware extraction
		let context: SessionContext | undefined;
		try {
			context = await buildSessionContext(sessionId);
		} catch (err) {
			console.warn("[Extraction] Could not build session context:", err instanceof Error ? err.message : err);
		}

		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		});

		const currentNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		const result = await extractProcessUpdates(
			currentNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase().replace(/_([a-z])/g, (_, c) =>
					c.toUpperCase(),
				) as any,
				label: n.label,
				state: n.state.toLowerCase() as any,
				lane: n.lane || undefined,
				connections: n.connections,
				positionX: n.positionX,
				positionY: n.positionY,
			})),
			transcript.reverse().map((t) => ({
				speaker: t.speaker,
				text: t.text,
				timestamp: t.timestamp,
			})),
			context,
		);

		// Store new nodes
		for (const newNode of result.newNodes) {
			const posX = 200 + currentNodes.length * 200;
			const posY = 200;

			// Map LLM node type to Prisma enum
			const typeMap: Record<string, string> = {
				startEvent: "START_EVENT",
				endEvent: "END_EVENT",
				task: "TASK",
				exclusiveGateway: "EXCLUSIVE_GATEWAY",
				parallelGateway: "PARALLEL_GATEWAY",
			};

			await db.diagramNode.create({
				data: {
					sessionId,
					nodeType: (typeMap[newNode.type] || "TASK") as any,
					label: newNode.label,
					state: "FORMING",
					lane: newNode.lane || null,
					positionX: posX,
					positionY: posY,
					connections: newNode.connectTo ? [newNode.connectTo] : [],
				},
			});

			console.log(`[Extraction] New node: "${newNode.label}"`);
		}

		// Log out-of-scope topics
		if (result.outOfScope && result.outOfScope.length > 0) {
			for (const item of result.outOfScope) {
				console.log(
					`[Extraction] Out of scope: "${item.topic}" -> likely belongs to "${item.likelyProcess}"`,
				);
			}
			// Store out-of-scope items in teleprompter log for consultant awareness
			await db.teleprompterLog.create({
				data: {
					sessionId,
					question: `[Scope notice] Topic "${result.outOfScope[0].topic}" may belong to the "${result.outOfScope[0].likelyProcess}" process instead.`,
				},
			});
		}

		if (result.newNodes.length > 0) {
			console.log(
				`[Extraction] Added ${result.newNodes.length} nodes for session ${sessionId}`,
			);
			setActivity(sessionId, "diagramming", `${result.newNodes.length} nodos nuevos`);
			// Hold "diagramming" for 3s so UI catches it on next poll
			setTimeout(() => setActivity(sessionId, "listening"), 3000);
		} else {
			setActivity(sessionId, "listening");
		}
	} catch (err) {
		setActivity(sessionId, "listening");
		throw err;
	}
}

/** Generate next teleprompter question */
async function runTeleprompter(sessionId: string) {
	setActivity(sessionId, "suggesting");

	try {
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: { processDefinition: true },
		});
		if (!session) {
			setActivity(sessionId, "listening");
			return;
		}

		// Build business context for context-aware question generation
		let context: SessionContext | undefined;
		try {
			context = await buildSessionContext(sessionId);
		} catch (err) {
			console.warn("[Teleprompter] Could not build session context:", err instanceof Error ? err.message : err);
		}

		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		});

		const currentNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		const result = await generateNextQuestion(
			session.type as "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
			currentNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				lane: n.lane || undefined,
				connections: n.connections,
			})),
			transcript.reverse().map((t) => ({
				speaker: t.speaker,
				text: t.text,
				timestamp: t.timestamp,
			})),
			session.processDefinition?.name,
			context,
		);

		await db.teleprompterLog.create({
			data: {
				sessionId,
				question: result.nextQuestion,
			},
		});

		console.log(`[Teleprompter] "${result.nextQuestion.substring(0, 60)}"`);
		// Hold "suggesting" for 3s so UI catches it, then return to listening
		setTimeout(() => setActivity(sessionId, "listening"), 3000);
	} catch (err) {
		setActivity(sessionId, "listening");
		throw err;
	}
}
