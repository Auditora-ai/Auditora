import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { checkRateLimit, getClientIp } from "@repo/rate-limit";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_URL || "*";

export async function GET(request: NextRequest) {
	const ip = getClientIp(request);
	if (!(await checkRateLimit(`ratelimit:stats:${ip}`, 30, 60))) {
		return NextResponse.json(
			{ processSteps: 0, sessionsCompleted: 0 },
			{ status: 429 },
		);
	}

	try {
		const [processSteps, sessionsCompleted] = await Promise.all([
			db.diagramNode.count({
				where: { state: "CONFIRMED" },
			}),
			db.meetingSession.count({
				where: { status: "ENDED" },
			}),
		]);

		return NextResponse.json(
			{ processSteps, sessionsCompleted },
			{
				headers: {
					"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
					"Access-Control-Allow-Origin": ALLOWED_ORIGIN,
				},
			},
		);
	} catch {
		return NextResponse.json(
			{ processSteps: 0, sessionsCompleted: 0 },
			{ status: 500 },
		);
	}
}
