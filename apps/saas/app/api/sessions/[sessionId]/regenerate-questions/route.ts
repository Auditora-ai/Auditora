/**
 * Regenerate Teleprompter Questions
 *
 * POST /api/sessions/[sessionId]/regenerate-questions
 *
 * Clears existing questions and generates fresh ones based on the current
 * question mode (explore/deepen/validate). Called when consultant changes mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";
import { generateNextQuestion } from "@repo/ai";
import { buildSessionContext } from "@repo/ai";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;
		const { session } = authResult;

		// Build context
		let context;
		try {
			context = await buildSessionContext(sessionId);
		} catch { /* ok */ }

		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		});

		const currentNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		const questionMode = session.questionMode || "explore";

		// Delete old questions
		await db.teleprompterLog.deleteMany({ where: { sessionId } });

		// Generate 3 questions in sequence for the new mode
		const questions: string[] = [];
		for (let i = 0; i < 3; i++) {
			try {
				const result = await generateNextQuestion(
					session.organizationId,
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
					questionMode,
				);

				await db.teleprompterLog.create({
					data: {
						sessionId,
						question: result.nextQuestion,
						completenessScore: result.completenessScore ?? null,
						gapType: result.gapType ?? null,
						sipocCoverage: result.sipocCoverage ? JSON.parse(JSON.stringify(result.sipocCoverage)) : undefined,
					},
				});

				questions.push(result.nextQuestion);
			} catch (err) {
				console.error(`[RegenerateQuestions] Question ${i + 1} failed:`, err);
				break;
			}
		}

		return NextResponse.json({ ok: true, questions, mode: questionMode });
	} catch (error: any) {
		console.error("[RegenerateQuestions]", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
