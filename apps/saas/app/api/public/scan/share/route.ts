/**
 * POST /api/public/scan/share — Generate a shareable link for scan results
 *
 * Requires: valid scan_session cookie with completed results
 * Returns: { shareToken, shareUrl }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import { db } from "@repo/database";

export async function POST(request: NextRequest) {
	const result = await verifyAnonymousSession(request);
	if (result.error) return result.error;

	const { session } = result;

	// Must have completed results to share
	if (!session.riskResults && !session.deepRiskResults) {
		return NextResponse.json(
			{ error: "No scan results to share. Complete the scan first." },
			{ status: 400 },
		);
	}

	// If already has a share token that hasn't expired, return it
	if (session.shareToken && session.shareExpiresAt && session.shareExpiresAt > new Date()) {
		const baseUrl = process.env.NEXT_PUBLIC_SAAS_URL || process.env.NEXT_PUBLIC_APP_URL || "";
		return NextResponse.json({
			shareToken: session.shareToken,
			shareUrl: `${baseUrl}/scan/results/${session.shareToken}`,
		});
	}

	// Generate a new share token (URL-safe, 16 bytes = 22 chars base64url)
	const shareToken = randomBytes(16).toString("base64url");
	const shareExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

	await db.anonymousSession.update({
		where: { id: session.id },
		data: { shareToken, shareExpiresAt },
	});

	const baseUrl = process.env.NEXT_PUBLIC_SAAS_URL || process.env.NEXT_PUBLIC_APP_URL || "";

	return NextResponse.json({
		shareToken,
		shareUrl: `${baseUrl}/scan/results/${shareToken}`,
	});
}
