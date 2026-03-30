/**
 * @repo/rate-limit — Redis-backed rate limiting with in-memory fallback
 *
 * Drop-in replacement for the in-memory Map rate limiters
 * scattered across public API routes.
 */

export { getRedis } from "./redis";
export {
	checkSessionCredits,
	recordSessionCredit,
	resetSessionCredits,
	type CreditCheckResult,
} from "./session-credits";

import { getRedis } from "./redis";

// ── In-memory fallback stores ───────────────────────────────────
const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();
const memoryCost = new Map<string, { cost: number; resetAt: number }>();

// ── IP-based rate limiting ──────────────────────────────────────

/**
 * Check and increment a rate limit counter.
 *
 * @param key - Unique key (e.g. `"ratelimit:scan:${ip}"`)
 * @param max - Maximum requests allowed in the window
 * @param windowSeconds - Window duration in seconds (default: 3600 = 1 hour)
 * @returns `true` if the request is allowed, `false` if rate limited
 */
export async function checkRateLimit(
	key: string,
	max: number,
	windowSeconds = 3600,
): Promise<boolean> {
	const redis = getRedis();

	if (redis) {
		try {
			const current = await redis.incr(key);
			if (current === 1) {
				await redis.expire(key, windowSeconds);
			}
			return current <= max;
		} catch {
			// Fall through to in-memory
		}
	}

	// In-memory fallback
	const now = Date.now();
	const entry = memoryRateLimit.get(key);

	if (!entry || now > entry.resetAt) {
		memoryRateLimit.set(key, {
			count: 1,
			resetAt: now + windowSeconds * 1000,
		});
		return true;
	}

	if (entry.count >= max) return false;
	entry.count++;
	return true;
}

// ── Daily cost tracking ─────────────────────────────────────────

/**
 * Check if the daily cost cap has been exceeded.
 *
 * @param key - Cost tracking key (e.g. `"cost:daily:scan"`)
 * @param cap - Maximum daily cost in USD
 * @returns `true` if under the cap, `false` if exceeded
 */
export async function checkDailyCost(
	key: string,
	cap: number,
): Promise<boolean> {
	const redis = getRedis();

	if (redis) {
		try {
			const val = await redis.get(key);
			const current = val ? Number.parseFloat(val) : 0;
			return current < cap;
		} catch {
			// Fall through to in-memory
		}
	}

	// In-memory fallback
	const now = Date.now();
	const entry = memoryCost.get(key);
	if (!entry || now > entry.resetAt) {
		return true;
	}
	return entry.cost < cap;
}

/**
 * Record a cost against the daily cap.
 *
 * @param key - Cost tracking key (e.g. `"cost:daily:scan"`)
 * @param cost - Cost to add in USD
 */
export async function recordCost(key: string, cost: number): Promise<void> {
	const redis = getRedis();

	if (redis) {
		try {
			const exists = await redis.exists(key);
			await redis.incrbyfloat(key, cost);
			if (!exists) {
				// Expire at midnight UTC
				const now = new Date();
				const midnight = new Date(now);
				midnight.setUTCHours(24, 0, 0, 0);
				const ttl = Math.ceil((midnight.getTime() - now.getTime()) / 1000);
				await redis.expire(key, ttl);
			}
			return;
		} catch {
			// Fall through to in-memory
		}
	}

	// In-memory fallback
	const now = Date.now();
	const entry = memoryCost.get(key);
	if (!entry || now > entry.resetAt) {
		const midnight = new Date();
		midnight.setUTCHours(24, 0, 0, 0);
		memoryCost.set(key, { cost, resetAt: midnight.getTime() });
	} else {
		entry.cost += cost;
	}
}

// ── Per-key dedup (e.g. per-email) ──────────────────────────────

/**
 * Check if a key has been seen recently. If not, mark it.
 *
 * @param key - Dedup key (e.g. `"dedup:lead:user@example.com"`)
 * @param ttlSeconds - How long to remember the key (default: 3600 = 1 hour)
 * @returns `true` if this is a NEW key (first time), `false` if duplicate
 */
export async function checkDedup(
	key: string,
	ttlSeconds = 3600,
): Promise<boolean> {
	const redis = getRedis();

	if (redis) {
		try {
			// SET NX returns "OK" if key was set (new), null if already exists (dupe)
			const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
			return result === "OK";
		} catch {
			// Fall through to in-memory
		}
	}

	// In-memory fallback
	const now = Date.now();
	const entry = memoryRateLimit.get(key);
	if (entry && now < entry.resetAt) {
		return false; // duplicate
	}
	memoryRateLimit.set(key, { count: 1, resetAt: now + ttlSeconds * 1000 });
	return true; // new
}

// ── Helper: extract client IP from request ──────────────────────

export function getClientIp(request: {
	headers: { get(name: string): string | null };
}): string {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}
