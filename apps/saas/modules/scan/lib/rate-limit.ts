/**
 * Scan Rate Limiter
 *
 * Limits to 5 scans per IP per hour.
 * Uses @repo/rate-limit (Redis-backed with in-memory fallback).
 */

import { checkRateLimit } from "@repo/rate-limit";

const MAX_SCANS_PER_HOUR = 5;
const WINDOW_SECONDS = 3600; // 1 hour

/**
 * Check if a scan request is allowed for the given IP.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export async function checkScanRateLimit(ip: string): Promise<boolean> {
	return checkRateLimit(`ratelimit:scan:${ip}`, MAX_SCANS_PER_HOUR, WINDOW_SECONDS);
}
