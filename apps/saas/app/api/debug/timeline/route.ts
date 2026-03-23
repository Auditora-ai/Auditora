/**
 * Debug Timeline Endpoint — View diagnostic pipeline timestamps
 *
 * GET /api/debug/timeline              — all active timelines
 * GET /api/debug/timeline?session=ID   — specific session timeline
 *
 * Protected by DEBUG_KEY env var in production.
 * Remove after diagnosis is complete.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTimeline, getAllTimelines } from "@meeting/lib/session-timeline";

export async function GET(request: NextRequest) {
	const secret = request.nextUrl.searchParams.get("key");
	if (
		process.env.NODE_ENV === "production" &&
		secret !== process.env.DEBUG_KEY
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sessionId = request.nextUrl.searchParams.get("session");

	if (sessionId) {
		const timeline = getTimeline(sessionId);
		if (!timeline) {
			return NextResponse.json(
				{ error: "No timeline found for this session" },
				{ status: 404 },
			);
		}
		return NextResponse.json(timeline);
	}

	return NextResponse.json(getAllTimelines());
}
