/**
 * Rate Limiting for Radiografia Public API
 *
 * IP-based rate limiting + global daily cost cap.
 * Pattern adapted from try-extraction/route.ts.
 */

import type { NextRequest } from "next/server";

// Per-IP tracking
const ipRequests = new Map<
	string,
	{ count: number; resetAt: number }
>();

// Global cost tracking
let dailyCost = 0;
let dailyCostResetAt = Date.now() + 86_400_000;
const DAILY_COST_CAP = 50; // Higher than try-extraction since this is the onboarding funnel
const COST_PER_LLM_CALL = 0.02;

export function getClientIp(request: NextRequest): string {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}

export function checkRateLimit(
	ip: string,
	maxPerHour: number,
): boolean {
	const now = Date.now();
	const entry = ipRequests.get(ip);

	if (!entry || now > entry.resetAt) {
		ipRequests.set(ip, { count: 1, resetAt: now + 3_600_000 });
		return true;
	}

	if (entry.count >= maxPerHour) return false;
	entry.count++;
	return true;
}

export function checkDailyCost(): boolean {
	const now = Date.now();
	if (now > dailyCostResetAt) {
		dailyCost = 0;
		dailyCostResetAt = now + 86_400_000;
	}
	return dailyCost < DAILY_COST_CAP;
}

export function recordCost(llmCalls: number = 1): void {
	dailyCost += COST_PER_LLM_CALL * llmCalls;
}

export function isKillSwitchActive(): boolean {
	return process.env.DISABLE_PUBLIC_SCAN === "true";
}
