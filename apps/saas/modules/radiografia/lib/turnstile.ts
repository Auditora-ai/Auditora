/**
 * Cloudflare Turnstile Server-Side Verification
 *
 * Validates a Turnstile token by calling Cloudflare's siteverify endpoint.
 * Used in public API routes to prevent bot abuse.
 *
 * Env vars:
 *   TURNSTILE_SECRET_KEY — from Cloudflare Turnstile dashboard
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — exposed to client
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function verifyTurnstileToken(
	token: string,
	ip?: string,
): Promise<{ success: boolean; error?: string }> {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;

	// If no secret key configured, skip verification (dev mode)
	if (!secretKey) {
		console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification");
		return { success: true };
	}

	try {
		const body = new URLSearchParams({
			secret: secretKey,
			response: token,
			...(ip ? { remoteip: ip } : {}),
		});

		const res = await fetch(VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});

		const data = (await res.json()) as TurnstileVerifyResponse;

		if (!data.success) {
			return {
				success: false,
				error: `Turnstile verification failed: ${data["error-codes"]?.join(", ") || "unknown"}`,
			};
		}

		return { success: true };
	} catch (error) {
		console.error("[turnstile] Verification request failed:", error);
		// Fail open in case of network issues to Cloudflare
		return { success: true };
	}
}
