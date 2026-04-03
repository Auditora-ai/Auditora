/**
 * Public Scan Share API
 *
 * POST /api/public/scan/share
 *
 * Generates a shareable link for scan results. Creates a random share token
 * with a 7-day expiry and returns the share URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { sessionId } = body as { sessionId?: string };

		if (!sessionId || typeof sessionId !== "string") {
			return NextResponse.json(
				{ error: "sessionId is required" },
				{ status: 400 },
			);
		}

		// Find the session and verify it has results
		const session = await db.anonymousSession.findUnique({
			where: { id: sessionId },
			select: {
				id: true,
				phase: true,
				riskResults: true,
				shareToken: true,
				shareExpiresAt: true,
			},
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			);
		}

		if (!session.riskResults) {
			return NextResponse.json(
				{ error: "No analysis results to share" },
				{ status: 400 },
			);
		}

		// If a valid share token already exists, return it
		if (
			session.shareToken &&
			session.shareExpiresAt &&
			session.shareExpiresAt > new Date()
		) {
			const host = request.headers.get("host") || "localhost:3000";
			const protocol = request.headers.get("x-forwarded-proto") || "https";
			const shareUrl = `${protocol}://${host}/scan/results/${session.shareToken}`;

			return NextResponse.json({
				shareToken: session.shareToken,
				shareUrl,
				expiresAt: session.shareExpiresAt.toISOString(),
			});
		}

		// Generate new share token
		const shareToken = randomBytes(16).toString("hex");
		const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		await db.anonymousSession.update({
			where: { id: sessionId },
			data: {
				shareToken,
				shareExpiresAt,
			},
		});

		const host = request.headers.get("host") || "localhost:3000";
		const protocol = request.headers.get("x-forwarded-proto") || "https";
		const shareUrl = `${protocol}://${host}/scan/results/${shareToken}`;

		return NextResponse.json({
			shareToken,
			shareUrl,
			expiresAt: shareExpiresAt.toISOString(),
		});
	} catch (err) {
		console.error("[scan/share] Error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
