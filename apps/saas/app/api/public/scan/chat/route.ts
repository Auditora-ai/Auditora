/**
 * SIPOC Conversation Endpoint for Radiografia
 *
 * POST — Send a user message, get back an AI SIPOC question + coverage update.
 * Uses the teleprompter pipeline's generateNextQuestion() for smart gap-aware questions.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { generateNextQuestion } from "@repo/ai";
import {
	getClientIp,
	checkRateLimit,
	checkDailyCost,
	recordCost,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(ip, 60)) {
		return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
	}

	if (!checkDailyCost()) {
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}

	const sessionToken = request.cookies.get("scan_session")?.value;
	if (!sessionToken) {
		return NextResponse.json({ error: "No session" }, { status: 401 });
	}

	const session = await db.anonymousSession.findUnique({
		where: { id: sessionToken },
	});

	if (!session || session.expiresAt < new Date()) {
		return NextResponse.json({ error: "Session expired" }, { status: 410 });
	}

	const body = await request.json();
	const { message } = body as { message: string };

	if (!message?.trim()) {
		return NextResponse.json({ error: "Message required" }, { status: 400 });
	}

	// Get existing conversation + SIPOC data
	const conversationLog = (session.conversationLog as ChatMessage[] | null) || [];
	const diagramNodes = (session.diagramNodes as Array<{ id: string; type: string; label: string; lane?: string; connections: string[] }> | null) || [];

	// Check message limit
	const userMessages = conversationLog.filter((m) => m.role === "user");
	if (userMessages.length >= 30) {
		return NextResponse.json({
			error: "Has alcanzado el limite de mensajes. Genera tu radiografia profunda.",
			limitReached: true,
		}, { status: 200 });
	}

	// Add user message to log
	const newMessage: ChatMessage = {
		role: "user",
		content: message.trim(),
		timestamp: new Date().toISOString(),
	};
	conversationLog.push(newMessage);

	// Build transcript entries for the teleprompter
	const transcriptEntries = conversationLog.map((m, i) => ({
		speaker: m.role === "user" ? "Director" : "Consultor IA",
		text: m.content,
		timestamp: i * 10,
	}));

	// Build node summaries for the teleprompter
	const nodeSummaries = diagramNodes.map((n) => ({
		id: n.id,
		type: n.type,
		label: n.label,
		lane: n.lane,
		connections: n.connections || [],
	}));

	// Generate next question using the teleprompter pipeline
	const result = await generateNextQuestion(
		"public",
		"DEEP_DIVE",
		nodeSummaries,
		transcriptEntries,
		session.processName || undefined,
		undefined,
		"explorar",
	);
	recordCost(1);

	// Add AI response to conversation
	const aiMessage: ChatMessage = {
		role: "assistant",
		content: result.nextQuestion,
		timestamp: new Date().toISOString(),
	};
	conversationLog.push(aiMessage);

	// Update session
	await db.anonymousSession.update({
		where: { id: sessionToken },
		data: {
			phase: "sipoc",
			conversationLog: conversationLog as any,
			completenessScore: result.completenessScore,
		},
	});

	return NextResponse.json({
		question: result.nextQuestion,
		reasoning: result.reasoning,
		gapType: result.gapType,
		completenessScore: result.completenessScore,
		sipocCoverage: result.sipocCoverage,
		readyForReveal: result.completenessScore >= 70,
	});
}
