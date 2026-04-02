/**
 * GET /api/public/scan/results/[shareToken] — Retrieve shared scan results
 *
 * Public endpoint — no authentication required.
 * Returns scan results for a valid, non-expired share token.
 */

import { NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ shareToken: string }> },
) {
	const { shareToken } = await params;

	if (!shareToken || shareToken.length < 10) {
		return NextResponse.json(
			{ error: "Invalid share token" },
			{ status: 400 },
		);
	}

	const session = await db.anonymousSession.findUnique({
		where: { shareToken },
		select: {
			id: true,
			industry: true,
			processName: true,
			sipocData: true,
			riskResults: true,
			deepRiskResults: true,
			shareExpiresAt: true,
			createdAt: true,
		},
	});

	if (!session) {
		return NextResponse.json(
			{ error: "Scan not found" },
			{ status: 404 },
		);
	}

	if (session.shareExpiresAt && session.shareExpiresAt < new Date()) {
		return NextResponse.json(
			{ error: "Share link expired" },
			{ status: 410 },
		);
	}

	// Use deep risk results if available, otherwise fall back to instant results
	const risks = session.deepRiskResults || session.riskResults;

	return NextResponse.json({
		industry: session.industry,
		processName: session.processName,
		sipocData: session.sipocData,
		riskResults: risks,
		createdAt: session.createdAt,
	});
}
