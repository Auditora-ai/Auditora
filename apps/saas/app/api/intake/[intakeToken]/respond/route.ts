/**
 * POST /api/intake/[intakeToken]/respond
 *
 * Public endpoint (no auth) — saves client intake responses.
 * Accepts bulk submission: { responses: [{ questionKey, response }] }
 * Updates intakeStatus on the session.
 * Returns 404 on invalid token.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ intakeToken: string }> },
) {
	const { intakeToken } = await params;

	const session = await db.meetingSession.findUnique({
		where: { intakeToken },
		select: { id: true, intakeResponses: true },
	});

	if (!session) {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}

	const body = await request.json();
	const { responses } = body as {
		responses: { questionKey: string; response: string }[];
	};

	if (!responses || !Array.isArray(responses) || responses.length === 0) {
		return NextResponse.json(
			{ error: "responses array is required" },
			{ status: 400 },
		);
	}

	// Update responses in a transaction
	const now = new Date();
	await db.$transaction(
		responses.map((r) =>
			db.clientIntakeResponse.updateMany({
				where: {
					sessionId: session.id,
					questionKey: r.questionKey,
				},
				data: {
					response: r.response,
					respondedAt: now,
				},
			}),
		),
	);

	// Recalculate intakeStatus
	const allResponses = await db.clientIntakeResponse.findMany({
		where: { sessionId: session.id },
	});
	const total = allResponses.length;
	const answered = allResponses.filter((r) => r.response !== null).length;

	let intakeStatus: string;
	if (answered === 0) intakeStatus = "pending";
	else if (answered >= total) intakeStatus = "complete";
	else intakeStatus = "partial";

	await db.meetingSession.update({
		where: { id: session.id },
		data: { intakeStatus },
	});

	return NextResponse.json({
		message: "Responses saved",
		intakeStatus,
		progress: { answered, total },
	});
}
