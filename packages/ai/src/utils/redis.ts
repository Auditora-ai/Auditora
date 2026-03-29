/**
 * Redis utility for bot activity state
 *
 * Replaces in-memory Map<sessionId, ActivityState> so activity state
 * works across multiple processes/instances (e.g., Railway scaling).
 *
 * Falls back to in-memory Map if REDIS_URL is not configured.
 */

import Redis from "ioredis";

type BotActivityType = "listening" | "extracting" | "diagramming" | "suggesting";

export interface ActivityState {
	type: BotActivityType;
	detail?: string;
	updatedAt: number;
}

const ACTIVITY_PREFIX = "auditora:activity:";
const ACTIVITY_TTL = 300; // 5 minutes

// Singleton Redis client — lazy initialized
let redisClient: Redis | null = null;
let redisAvailable = true;

function getRedis(): Redis | null {
	if (!redisAvailable) return null;

	const url = process.env.REDIS_URL;
	if (!url) {
		redisAvailable = false;
		console.warn("[Redis] REDIS_URL not configured — falling back to in-memory activity state");
		return null;
	}

	if (!redisClient) {
		redisClient = new Redis(url, {
			maxRetriesPerRequest: 1,
			lazyConnect: true,
			connectTimeout: 3000,
		});
		redisClient.on("error", (err) => {
			console.warn("[Redis] Connection error:", err.message);
		});
		redisClient.connect().catch(() => {
			console.warn("[Redis] Initial connection failed — falling back to in-memory");
			redisAvailable = false;
			redisClient = null;
		});
	}

	return redisClient;
}

// In-memory fallback (original behavior)
const memoryStore = new Map<string, ActivityState>();

export async function setActivity(
	sessionId: string,
	type: BotActivityType,
	detail?: string,
): Promise<void> {
	const state: ActivityState = { type, detail, updatedAt: Date.now() };

	const redis = getRedis();
	if (redis) {
		try {
			await redis.setex(
				`${ACTIVITY_PREFIX}${sessionId}`,
				ACTIVITY_TTL,
				JSON.stringify(state),
			);
			return;
		} catch {
			// Fall through to memory
		}
	}

	memoryStore.set(sessionId, state);
}

export async function getActivity(
	sessionId: string,
): Promise<ActivityState | null> {
	const redis = getRedis();
	if (redis) {
		try {
			const data = await redis.get(`${ACTIVITY_PREFIX}${sessionId}`);
			if (data) return JSON.parse(data) as ActivityState;
			return null;
		} catch {
			// Fall through to memory
		}
	}

	return memoryStore.get(sessionId) || null;
}

export async function deleteActivity(sessionId: string): Promise<void> {
	const redis = getRedis();
	if (redis) {
		try {
			await redis.del(`${ACTIVITY_PREFIX}${sessionId}`);
			return;
		} catch {
			// Fall through to memory
		}
	}

	memoryStore.delete(sessionId);
}
