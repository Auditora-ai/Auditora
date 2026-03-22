/**
 * Recall.ai Webhook Handler
 *
 * Receives transcript events → stores in DB → triggers AI pipelines:
 * 1. Process Extraction (every 15s): transcript → BPMN nodes
 * 2. Teleprompter (every 30s): transcript + diagram → next question
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { extractProcessUpdates, generateNextQuestion } from "@repo/ai";

// Throttle AI calls per session
const lastExtractionTime = new Map<string, number>();
const lastTeleprompterTime = new Map<string, number>();
const EXTRACTION_INTERVAL = 15_000;
const TELEPROMPTER_INTERVAL = 30_000;

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json();

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

		// Activate session on first transcript
		if (session.status === "CONNECTING") {
			await db.meetingSession.update({
				where: { id: session.id },
				data: { status: "ACTIVE", startedAt: new Date() },
			});
		}

		// Store transcript
		await db.transcriptEntry.create({
			data: { sessionId: session.id, speaker, text, timestamp },
		});

		console.log(`[Webhook] 📝 ${speaker}: "${text.substring(0, 60)}"`);

		// --- AI PIPELINES (throttled, run in background) ---
		const now = Date.now();

		// Process Extraction — every 15s
		const lastExtraction = lastExtractionTime.get(session.id) || 0;
		if (now - lastExtraction >= EXTRACTION_INTERVAL) {
			lastExtractionTime.set(session.id, now);
			runExtraction(session.id).catch((err) =>
				console.error("[Webhook] Extraction error:", err),
			);
		}

		// Teleprompter — every 30s
		const lastTeleprompter = lastTeleprompterTime.get(session.id) || 0;
		if (now - lastTeleprompter >= TELEPROMPTER_INTERVAL) {
			lastTeleprompterTime.set(session.id, now);
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

		console.log(`[Extraction] 🔷 New node: "${newNode.label}"`);
	}

	if (result.newNodes.length > 0) {
		console.log(
			`[Extraction] ✅ Added ${result.newNodes.length} nodes for session ${sessionId}`,
		);
	}
}

/** Generate next teleprompter question */
async function runTeleprompter(sessionId: string) {
	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: { processDefinition: true },
	});
	if (!session) return;

	const transcript = await db.transcriptEntry.findMany({
		where: { sessionId },
		orderBy: { timestamp: "desc" },
		take: 50,
	});

	const currentNodes = await db.diagramNode.findMany({
		where: { sessionId, state: { not: "REJECTED" } },
	});

	const result = await generateNextQuestion(
		session.type as "DISCOVERY" | "DEEP_DIVE",
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
	);

	await db.teleprompterLog.create({
		data: {
			sessionId,
			question: result.nextQuestion,
		},
	});

	console.log(`[Teleprompter] 💡 "${result.nextQuestion.substring(0, 60)}"`);
}
