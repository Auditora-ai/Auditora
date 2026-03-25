import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;

	const authResult = await requireSessionAuth(sessionId);
	if (isAuthError(authResult)) return authResult;

	const summary = await db.sessionSummary.findUnique({
		where: { sessionId },
	});

	if (!summary) {
		return NextResponse.json({ summary: null }, { status: 200 });
	}

	return NextResponse.json({
		summary: summary.summary,
		actionItems: summary.actionItems,
		createdAt: summary.createdAt,
	});
}
