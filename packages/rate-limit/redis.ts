/**
 * Shared Redis client for rate limiting.
 *
 * Singleton pattern with graceful fallback to in-memory
 * when REDIS_URL is not configured or Redis is unreachable.
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisAvailable = true;

export function getRedis(): Redis | null {
	if (!redisAvailable) return null;

	const url = process.env.REDIS_URL;
	if (!url) {
		redisAvailable = false;
		console.warn(
			"[rate-limit] REDIS_URL not configured — falling back to in-memory rate limiting",
		);
		return null;
	}

	if (!redisClient) {
		redisClient = new Redis(url, {
			maxRetriesPerRequest: 1,
			lazyConnect: true,
			connectTimeout: 3000,
		});
		redisClient.on("error", (err) => {
			console.warn("[rate-limit] Redis error:", err.message);
		});
		redisClient.connect().catch(() => {
			console.warn(
				"[rate-limit] Redis connection failed — falling back to in-memory",
			);
			redisAvailable = false;
			redisClient = null;
		});
	}

	return redisClient;
}
