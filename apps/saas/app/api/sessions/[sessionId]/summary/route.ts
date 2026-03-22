import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	const { sessionId } = await params;

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
