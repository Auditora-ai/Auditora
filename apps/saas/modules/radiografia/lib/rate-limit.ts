/**
 * Rate Limiting for Radiografia Public API
 *
 * Redis-backed rate limiting + global daily cost cap.
 * Falls back to in-memory if Redis is unavailable.
 */

import type { NextRequest } from "next/server";
import {
	checkRateLimit as checkLimit,
	checkDailyCost as checkCost,
	recordCost as recordCostShared,
	getClientIp as getIp,
} from "@repo/rate-limit";

const DAILY_COST_CAP = 50; // Higher than try-extraction since this is the onboarding funnel
const COST_PER_LLM_CALL = 0.02;
const COST_KEY = "cost:daily:scan";

export function getClientIp(request: NextRequest): string {
	return getIp(request);
}

export async function checkRateLimit(
	ip: string,
	maxPerHour: number,
	endpoint = "default",
): Promise<boolean> {
	return checkLimit(`ratelimit:scan:${endpoint}:${ip}`, maxPerHour, 3600);
}

export async function checkDailyCost(): Promise<boolean> {
	return checkCost(COST_KEY, DAILY_COST_CAP);
}

export async function recordCost(llmCalls = 1): Promise<void> {
	await recordCostShared(COST_KEY, COST_PER_LLM_CALL * llmCalls);
}

export function isKillSwitchActive(): boolean {
	return process.env.DISABLE_PUBLIC_SCAN === "true";
}
