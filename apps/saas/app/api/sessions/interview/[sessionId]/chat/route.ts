/**
 * AI Interview Chat Endpoint
 *
 * POST /api/sessions/interview/[sessionId]/chat
 *
 * Receives a user message, generates the next SIPOC-driven question,
 * and returns it with completeness scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { generateNextQuestion, buildSessionContext, extractProcessUpdates } from "@repo/ai";
import type { SipocCoverage } from "@repo/ai";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import type {
	ChatMessage,
	ChatResponse,
	GhostNode,
} from "@ai-interview/lib/interview-types";
import {
	MAX_MESSAGES,
	MAX_MESSAGE_LENGTH,
	REVEAL_THRESHOLD,
	GHOST_EXTRACTION_INTERVAL,
} from "@ai-interview/lib/interview-types";

async function getAuthContext() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const activeOrg = orgs?.[0];
	if (!activeOrg) return null;

	return { user: session.user, org: activeOrg };
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await params;
		const body = await request.json();
		const message = (body.message as string)?.trim();

		if (!message) {
			return NextResponse.json(
				{ error: "Message cannot be empty" },
				{ status: 400 },
			);
		}

		if (message.length > MAX_MESSAGE_LENGTH) {
			return NextResponse.json(
				{ error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit` },
				{ status: 400 },
			);
		}

		// Fetch session and verify ownership
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				processDefinition: true,
				organization: true,
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		if (session.organizationId !== authCtx.org.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (session.type !== "AI_INTERVIEW") {
			return NextResponse.json(
				{ error: "This endpoint is only for AI Interview sessions" },
				{ status: 400 },
			);
		}

		if (session.status === "ENDED") {
			return NextResponse.json(
				{ error: "This interview has already ended" },
				{ status: 400 },
			);
		}

		// Check message limit
		const conversationLog = (session.conversationLog as unknown as ChatMessage[]) || [];
		const userMessageCount = conversationLog.filter((m) => m.role === "user").length;
		if (userMessageCount >= MAX_MESSAGES) {
			return NextResponse.json(
				{
					error: `Has alcanzado el límite de ${MAX_MESSAGES} mensajes. Revela tu diagrama.`,
					readyForReveal: true,
				},
				{ status: 400 },
			);
		}

		// Append user message
		const userMsg: ChatMessage = {
			role: "user",
			content: message,
			timestamp: new Date().toISOString(),
		};
		conversationLog.push(userMsg);

		// Build session context (cached 5min)
		const context = await buildSessionContext(sessionId);

		// Convert conversation to transcript format for teleprompter
		const transcriptEntries = conversationLog.map((msg, i) => ({
			speaker: msg.role === "user" ? "Director" : "Consultor IA",
			text: msg.content,
			timestamp: i * 30, // Spread across time to fit within window
		}));

		// Get current diagram nodes for context (may have ghost nodes from prior extraction)
		const existingNodes = await db.diagramNode.findMany({
			where: { sessionId },
			select: { id: true, nodeType: true, label: true, lane: true, connections: true },
		});

		const nodeSummaries = existingNodes.map((n) => ({
			id: n.id,
			type: n.nodeType.toLowerCase(),
			label: n.label,
			lane: n.lane || undefined,
			connections: n.connections || [],
		}));

		// Map AI_INTERVIEW to DEEP_DIVE for the teleprompter
		const teleprompterSessionType = session.processDefinitionId ? "DEEP_DIVE" : "DISCOVERY";

		// Generate next question
		const result = await generateNextQuestion(
			session.organizationId,
			teleprompterSessionType,
			nodeSummaries,
			transcriptEntries,
			session.processDefinition?.name,
			context,
			"explore",
		);

		// Append AI response
		const aiMsg: ChatMessage = {
			role: "assistant",
			content: result.nextQuestion,
			timestamp: new Date().toISOString(),
			metadata: {
				gapType: result.gapType,
				completenessScore: result.completenessScore,
				sipocCoverage: result.sipocCoverage,
				reasoning: result.reasoning,
			},
		};
		conversationLog.push(aiMsg);

		// Update session
		await db.meetingSession.update({
			where: { id: sessionId },
			data: {
				conversationLog: conversationLog as any,
			},
		});

		// Ghost extraction: run extraction in background every N messages
		let ghostNodes: GhostNode[] | undefined;
		const totalUserMessages = conversationLog.filter((m) => m.role === "user").length;
		if (totalUserMessages >= 3 && totalUserMessages % GHOST_EXTRACTION_INTERVAL === 0) {
			try {
				const extraction = await extractProcessUpdates(
					session.organizationId,
					existingNodes.map((n) => ({
						id: n.id,
						type: n.nodeType.toLowerCase(),
						label: n.label,
						state: "confirmed" as const,
						lane: n.lane || undefined,
						connections: n.connections || [],
					})),
					transcriptEntries,
					context,
				);
				ghostNodes = extraction.newNodes.map((n) => ({
					id: n.id,
					type: n.type,
					label: n.label,
					lane: n.lane,
				}));
			} catch (err) {
				console.warn("[AI Interview] Ghost extraction failed (non-critical):", err);
			}
		}

		const response: ChatResponse = {
			question: result.nextQuestion,
			reasoning: result.reasoning,
			gapType: result.gapType,
			completenessScore: result.completenessScore,
			sipocCoverage: result.sipocCoverage,
			readyForReveal: result.completenessScore >= REVEAL_THRESHOLD,
			messageCount: conversationLog.length,
			ghostNodes,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("[AI Interview Chat] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
