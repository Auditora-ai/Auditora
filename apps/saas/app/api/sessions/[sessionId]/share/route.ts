/**
 * Share Toggle API
 *
 * POST   /api/sessions/[sessionId]/share — Enable sharing (generate/return shareToken)
 * DELETE /api/sessions/[sessionId]/share — Disable sharing (clear shareToken)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;
		const { session } = authResult;

		// If already has a shareToken, just return it
		if (session.shareToken) {
			return NextResponse.json({ shareToken: session.shareToken });
		}

		// Generate a new shareToken
		const shareToken = `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

		await db.meetingSession.update({
			where: { id: sessionId },
			data: { shareToken },
		});

		return NextResponse.json({ shareToken });
	} catch (error) {
		console.error("[Share] Error:", error);
		return NextResponse.json({ error: "Failed to enable sharing" }, { status: 500 });
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		await db.meetingSession.update({
			where: { id: sessionId },
			data: { shareToken: null },
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Share] Error:", error);
		return NextResponse.json({ error: "Failed to disable sharing" }, { status: 500 });
	}
}
