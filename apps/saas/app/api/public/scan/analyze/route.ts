/**
 * Public Scan Analyze API
 *
 * POST /api/public/scan/analyze
 *
 * Accepts a website URL and Turnstile token, crawls the site, runs an LLM
 * analysis, and streams progress via Server-Sent Events (SSE).
 *
 * No auth required — rate-limited by IP + Turnstile.
 */

import { NextRequest } from "next/server";
import { db } from "@repo/database";
import { verifyTurnstile } from "@scan/lib/turnstile";
import { checkScanRateLimit } from "@scan/lib/rate-limit";
import { crawlWebsite } from "@scan/lib/web-crawler";
import { analyzeBusiness } from "@scan/lib/analyze";
import * as crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getClientIp(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return "127.0.0.1";
}

function createFingerprint(ip: string, userAgent: string): string {
	return crypto.createHash("sha256").update(`${ip}:${userAgent}`).digest("hex").slice(0, 32);
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { url, turnstileToken } = body as {
			url?: string;
			turnstileToken?: string;
		};

		if (!url || typeof url !== "string") {
			return new Response(
				JSON.stringify({ error: "URL is required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const clientIp = getClientIp(request);
		const userAgent = request.headers.get("user-agent") || "";

		// ── Step 0: Verify Turnstile ────────────────────────────────────
		const turnstile = await verifyTurnstile(turnstileToken || "", clientIp);
		if (!turnstile.success) {
			return new Response(
				JSON.stringify({ error: "Captcha verification failed" }),
				{ status: 403, headers: { "Content-Type": "application/json" } },
			);
		}

		// ── Step 0b: Rate limit ─────────────────────────────────────────
		const allowed = await checkScanRateLimit(clientIp);
		if (!allowed) {
			return new Response(
				JSON.stringify({ error: "Rate limit exceeded. Try again in an hour." }),
				{ status: 429, headers: { "Content-Type": "application/json" } },
			);
		}

		// ── SSE stream ──────────────────────────────────────────────────
		const encoder = new TextEncoder();

		const stream = new ReadableStream({
			async start(controller) {
				function sendEvent(type: string, data: Record<string, unknown>) {
					const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`;
					controller.enqueue(encoder.encode(payload));
				}

				try {
					// Create session
					const fingerprint = createFingerprint(clientIp, userAgent);
					const session = await db.anonymousSession.create({
						data: {
							fingerprint,
							phase: "analyzing",
							sourceUrl: url,
							expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
						},
					});

					sendEvent("progress", {
						step: 1,
						totalSteps: 4,
						message: "Connecting to website",
						sessionId: session.id,
					});

					// Crawl
					const crawlResult = await crawlWebsite(url);

					if (!crawlResult.success || !crawlResult.text) {
						sendEvent("error", {
							message: "Could not access the website. Please check the URL and try again.",
						});
						controller.close();
						return;
					}

					sendEvent("progress", {
						step: 2,
						totalSteps: 4,
						message: "Reading business context",
					});

					// Store crawl data
					await db.anonymousSession.update({
						where: { id: session.id },
						data: {
							businessContext: crawlResult.text,
							businessDescription: crawlResult.title,
						},
					});

					sendEvent("progress", {
						step: 3,
						totalSteps: 4,
						message: "Identifying industry & processes",
					});

					// Analyze
					const analysis = await analyzeBusiness(crawlResult.text, url);

					sendEvent("progress", {
						step: 4,
						totalSteps: 4,
						message: "Analyzing operational risks",
						data: {
							companyName: analysis.companyName,
							industry: analysis.industry,
							vulnerabilityScore: analysis.vulnerabilityScore,
						},
					});

					// Store results
					await db.anonymousSession.update({
						where: { id: session.id },
						data: {
							phase: "results",
							industry: analysis.industry,
							processName: analysis.highestRiskProcess?.name || null,
							riskResults: JSON.parse(JSON.stringify(analysis)),
						},
					});

					// Send result event (matches frontend ScanSSEEvent type: "result")
					sendEvent("result", {
						sessionId: session.id,
						data: analysis,
					});
				} catch (err) {
					console.error("[scan/analyze] Error:", err);
					sendEvent("error", {
						message: "An unexpected error occurred during analysis.",
					});
				} finally {
					controller.close();
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (err) {
		console.error("[scan/analyze] Request error:", err);
		return new Response(
			JSON.stringify({ error: "Invalid request" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}
}
