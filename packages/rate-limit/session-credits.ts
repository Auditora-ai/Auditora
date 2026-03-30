/**
 * Session credit enforcement for the hybrid pricing model.
 *
 * Checks and records AI session credits per organization.
 * Uses Redis for fast reads with Postgres as source of truth.
 * Fail-open: if Redis is unavailable, allows the session.
 */

import { getRedis } from "./redis";

export interface CreditCheckResult {
	allowed: boolean;
	used: number;
	limit: number | null;
	remaining: number | null;
}

const CACHE_TTL_SECONDS = 60;

function creditCacheKey(orgId: string) {
	return `session-credits:${orgId}`;
}

/**
 * Check if an organization has available session credits.
 *
 * @param orgId - Organization ID
 * @param db - Prisma client instance
 * @returns Credit check result with usage info
 */
export async function checkSessionCredits(
	orgId: string,
	db: {
		organization: {
			findUnique: (args: {
				where: { id: string };
				select: {
					sessionCreditsUsed: true;
					sessionCreditsLimit: true;
					aiAnthropicKey: true;
				};
			}) => Promise<{
				sessionCreditsUsed: number;
				sessionCreditsLimit: number | null;
				aiAnthropicKey: string | null;
			} | null>;
		};
	},
): Promise<CreditCheckResult> {
	const redis = getRedis();

	// Try Redis cache first
	if (redis) {
		try {
			const cached = await redis.get(creditCacheKey(orgId));
			if (cached) {
				const { used, limit, hasByok } = JSON.parse(cached);
				// BYOK orgs bypass credit checks
				if (hasByok) {
					return { allowed: true, used, limit, remaining: null };
				}
				// null limit = unlimited
				if (limit === null) {
					return { allowed: true, used, limit, remaining: null };
				}
				const remaining = Math.max(0, limit - used);
				return { allowed: used < limit, used, limit, remaining };
			}
		} catch {
			// Fall through to DB
		}
	}

	// Read from Postgres
	const org = await db.organization.findUnique({
		where: { id: orgId },
		select: {
			sessionCreditsUsed: true,
			sessionCreditsLimit: true,
			aiAnthropicKey: true,
		},
	});

	if (!org) {
		// Org not found — fail-open
		return { allowed: true, used: 0, limit: null, remaining: null };
	}

	const { sessionCreditsUsed: used, sessionCreditsLimit: limit, aiAnthropicKey } = org;
	const hasByok = !!aiAnthropicKey;

	// Cache in Redis
	if (redis) {
		try {
			await redis.set(
				creditCacheKey(orgId),
				JSON.stringify({ used, limit, hasByok }),
				"EX",
				CACHE_TTL_SECONDS,
			);
		} catch {
			// Non-critical
		}
	}

	// BYOK orgs bypass credit checks
	if (hasByok) {
		return { allowed: true, used, limit, remaining: null };
	}

	// null limit = unlimited (Enterprise or legacy)
	if (limit === null) {
		return { allowed: true, used, limit, remaining: null };
	}

	const remaining = Math.max(0, limit - used);
	return { allowed: used < limit, used, limit, remaining };
}

/**
 * Record session credit usage for an organization.
 * Atomically increments the credit counter in Postgres.
 *
 * @param orgId - Organization ID
 * @param amount - Credits to consume (1.0 for live session, 0.5 for AI interview)
 * @param db - Prisma client instance
 */
export async function recordSessionCredit(
	orgId: string,
	amount: number,
	db: {
		organization: {
			update: (args: {
				where: { id: string };
				data: { sessionCreditsUsed: { increment: number } };
			}) => Promise<unknown>;
		};
	},
): Promise<void> {
	// Atomic increment in Postgres (source of truth)
	await db.organization.update({
		where: { id: orgId },
		data: {
			sessionCreditsUsed: { increment: amount },
		},
	});

	// Invalidate Redis cache so next check reads fresh data
	const redis = getRedis();
	if (redis) {
		try {
			await redis.del(creditCacheKey(orgId));
		} catch {
			// Non-critical
		}
	}
}

/**
 * Reset session credits for an organization (used by billing cycle cron).
 *
 * @param orgId - Organization ID
 * @param db - Prisma client instance
 */
export async function resetSessionCredits(
	orgId: string,
	db: {
		organization: {
			update: (args: {
				where: { id: string };
				data: { sessionCreditsUsed: number };
			}) => Promise<unknown>;
		};
	},
): Promise<void> {
	await db.organization.update({
		where: { id: orgId },
		data: { sessionCreditsUsed: 0 },
	});

	// Invalidate cache
	const redis = getRedis();
	if (redis) {
		try {
			await redis.del(creditCacheKey(orgId));
		} catch {
			// Non-critical
		}
	}
}
