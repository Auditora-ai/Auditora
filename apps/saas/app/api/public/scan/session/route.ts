/**
 * Anonymous Session Management for Radiografia
 *
 * POST — Create a new anonymous session, return sessionToken
 * GET  — Retrieve session data by token (from cookie)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createHash } from "crypto";
import {
	getClientIp,
	checkRateLimit,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";
import { verifyTurnstileToken } from "@radiografia/lib/turnstile";

function generateFingerprint(request: NextRequest): string {
	const ip = getClientIp(request);
	const ua = request.headers.get("user-agent") || "unknown";
	return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

function getSessionToken(request: NextRequest): string | null {
	return request.cookies.get("scan_session")?.value || null;
}

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return NextResponse.json(
			{ error: "Service temporarily unavailable" },
			{ status: 503 },
		);
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(ip, 10)) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429 },
		);
	}

	// Verify Turnstile captcha
	const body = await request.json().catch(() => ({}));
	const { turnstileToken } = body as { turnstileToken?: string };

	if (process.env.TURNSTILE_SECRET_KEY && !turnstileToken) {
		return NextResponse.json(
			{ error: "Captcha required" },
			{ status: 403 },
		);
	}

	if (turnstileToken) {
		const verification = await verifyTurnstileToken(turnstileToken, ip);
		if (!verification.success) {
			return NextResponse.json(
				{ error: "Captcha verification failed" },
				{ status: 403 },
			);
		}
	}

	const fingerprint = generateFingerprint(request);

	const session = await db.anonymousSession.create({
		data: {
			fingerprint,
			phase: "input",
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
		},
	});

	const response = NextResponse.json({
		sessionToken: session.id,
		phase: session.phase,
	});

	response.cookies.set("scan_session", session.id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 24 * 60 * 60,
		path: "/",
	});

	return response;
}

export async function GET(request: NextRequest) {
	const token = getSessionToken(request);
	if (!token) {
		return NextResponse.json(
			{ error: "No session found" },
			{ status: 401 },
		);
	}

	const session = await db.anonymousSession.findUnique({
		where: { id: token },
	});

	if (!session) {
		return NextResponse.json(
			{ error: "Session not found" },
			{ status: 404 },
		);
	}

	if (session.expiresAt < new Date()) {
		return NextResponse.json(
			{ error: "Tu sesion expiro. Genera una nueva radiografia." },
			{ status: 410 },
		);
	}

	return NextResponse.json({
		sessionToken: session.id,
		phase: session.phase,
		industry: session.industry,
		processName: session.processName,
		sipocData: session.sipocData,
		diagramNodes: session.diagramNodes,
		riskResults: session.riskResults,
		deepRiskResults: session.deepRiskResults,
		completenessScore: session.completenessScore,
	});
}
