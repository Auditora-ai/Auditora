/**
 * GET /api/intake/[intakeToken]
 *
 * Public endpoint (no auth) — loads intake questions for a client.
 * Returns 404 on invalid token to prevent enumeration.
 *
 * POST /api/intake/[intakeToken]
 *
 * Generates intake questions from IntelligenceItems for this session.
 * Called by the consultant when they click "Generate Link".
 * Requires auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext } from "@/lib/auth-helpers";
import { instrumentedGenerateText, parseLlmJson } from "@repo/ai";
import { z } from "zod";

const FALLBACK_QUESTIONS: Record<string, string[]> = {
	DISCOVERY: [
		"¿Cuáles son los principales pasos de este proceso?",
		"¿Quiénes participan en este proceso y qué rol tienen?",
		"¿Cuáles son los principales problemas o cuellos de botella que experimentan?",
	],
	DEEP_DIVE: [
		"¿Qué excepciones o variantes del proceso conoce?",
		"¿Qué sistemas o herramientas se utilizan en cada paso?",
		"¿Existen métricas o KPIs para medir este proceso?",
	],
	CONTINUATION: [
		"¿Hubo cambios en el proceso desde nuestra última sesión?",
		"¿Quedaron puntos pendientes que quiera abordar?",
		"¿Hay documentación adicional que pueda compartir?",
	],
};

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ intakeToken: string }> },
) {
	const { intakeToken } = await params;

	const session = await db.meetingSession.findUnique({
		where: { intakeToken },
		include: {
			processDefinition: { select: { name: true } },
			organization: { select: { name: true } },
			intakeResponses: {
				orderBy: { createdAt: "asc" },
			},
			participants: {
				where: { participantType: "CLIENT" },
				take: 1,
			},
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	return NextResponse.json({
		processName: session.processDefinition?.name ?? "Sesión general",
		organizationName: session.organization.name,
		scheduledFor: session.scheduledFor,
		sessionType: session.type,
		contactName: session.participants[0]?.name ?? null,
		questions: session.intakeResponses.map((r) => ({
			questionKey: r.questionKey,
			questionText: r.questionText,
			response: r.response,
			respondedAt: r.respondedAt,
		})),
	});
}

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ intakeToken: string }> },
) {
	// This endpoint requires auth — only the consultant can generate questions
	const authCtx = await getAuthContext();
	if (!authCtx) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { intakeToken } = await params;

	const session = await db.meetingSession.findUnique({
		where: { intakeToken },
		include: {
			processDefinition: {
				select: { id: true, name: true },
			},
			intakeResponses: true,
		},
	});

	if (!session) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	if (session.organizationId !== authCtx.org.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// Don't regenerate if questions already exist
	if (session.intakeResponses.length > 0) {
		return NextResponse.json({
			message: "Questions already generated",
			count: session.intakeResponses.length,
		});
	}

	// Get IntelligenceItems with status OPEN for the process
	let questions: { key: string; text: string }[] = [];

	if (session.processDefinition?.id) {
		const intelligence = await db.processIntelligence.findUnique({
			where: { processDefinitionId: session.processDefinition.id },
			include: {
				items: {
					where: { status: "OPEN" },
					orderBy: { priority: "desc" },
					take: 10,
				},
			},
		});

		if (intelligence?.items?.length) {
			questions = intelligence.items.map((item) => ({
				key: `intelligenceItem:${item.id}`,
				text: item.question,
			}));
		}
	}

	// If no IntelligenceItems, generate context-aware questions using AI
	if (questions.length === 0 && session.sessionContext) {
		try {
			const processName = session.processDefinition?.name ?? "el proceso";
			const { text } = await instrumentedGenerateText({
				organizationId: session.organizationId,
				pipeline: "intake-questions",
				system: `Eres un experto en BPM. Genera preguntas de preparación para que los participantes lleguen listos a una sesión de elicitación de procesos. Las preguntas deben ser específicas al proceso y contexto — NO genéricas. Máximo 5 preguntas. Responde SOLO con JSON.`,
				prompt: `Proceso: "${processName}"
Tipo de sesión: ${session.type}
Contexto del consultor:
${session.sessionContext}

Genera preguntas específicas que los participantes deberían poder responder ANTES de la sesión:
\`\`\`json
{ "questions": ["Pregunta 1", "Pregunta 2", ...] }
\`\`\``,
				maxOutputTokens: 512,
				temperature: 0.4,
			});

			const parsed = parseLlmJson(text, z.object({ questions: z.array(z.string()) }), "IntakeQuestions");
			if (parsed?.questions.length) {
				questions = parsed.questions.map((q, i) => ({
					key: `context:${i + 1}`,
					text: q,
				}));
			}
		} catch {
			// Fall through to static fallback
		}
	}

	// Final fallback if still no questions
	if (questions.length === 0) {
		const fallback = FALLBACK_QUESTIONS[session.type] ?? FALLBACK_QUESTIONS.DISCOVERY;
		questions = fallback.map((text, i) => ({
			key: `default:${i + 1}`,
			text,
		}));
	}

	// Create ClientIntakeResponse records
	await db.clientIntakeResponse.createMany({
		data: questions.map((q) => ({
			sessionId: session.id,
			questionKey: q.key,
			questionText: q.text,
		})),
	});

	return NextResponse.json({
		message: "Questions generated",
		count: questions.length,
		intakeToken: session.intakeToken,
	});
}
