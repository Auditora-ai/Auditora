/**
 * Anonymous Session Verification
 *
 * Validates the scan_session cookie and checks the fingerprint
 * to prevent session replay from different IPs/browsers.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createHash } from "crypto";
import { getClientIp } from "@radiografia/lib/rate-limit";

type AnonymousSession = NonNullable<
	Awaited<ReturnType<typeof db.anonymousSession.findUnique>>
>;

function generateFingerprint(request: NextRequest): string {
	const ip = getClientIp(request);
	const ua = request.headers.get("user-agent") || "unknown";
	return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

export type SessionVerifyResult =
	| { session: AnonymousSession; error?: never }
	| { session?: never; error: NextResponse };

/**
 * Verify an anonymous scan session from the request cookie.
 *
 * Checks: cookie exists, session found, not expired, fingerprint matches.
 */
export async function verifyAnonymousSession(
	request: NextRequest,
): Promise<SessionVerifyResult> {
	const sessionToken = request.cookies.get("scan_session")?.value;

	if (!sessionToken) {
		return {
			error: NextResponse.json(
				{ error: "No session found. Create one first." },
				{ status: 401 },
			),
		};
	}

	const session = await db.anonymousSession.findUnique({
		where: { id: sessionToken },
	});

	if (!session) {
		return {
			error: NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 },
			),
		};
	}

	if (session.expiresAt < new Date()) {
		return {
			error: NextResponse.json(
				{ error: "Session expired. Start a new scan." },
				{ status: 410 },
			),
		};
	}

	// Verify fingerprint to prevent session replay from different client
	const currentFingerprint = generateFingerprint(request);
	if (session.fingerprint && session.fingerprint !== currentFingerprint) {
		return {
			error: NextResponse.json(
				{ error: "Session verification failed" },
				{ status: 403 },
			),
		};
	}

	return { session };
}
