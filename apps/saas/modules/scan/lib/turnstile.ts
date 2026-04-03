/**
 * Cloudflare Turnstile Verification
 *
 * Verifies a Turnstile token by POSTing to Cloudflare's siteverify endpoint.
 */

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function verifyTurnstile(
	token: string,
	ip: string,
): Promise<{ success: boolean }> {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;

	// In development, skip verification if no key is configured
	if (!secretKey) {
		if (process.env.NODE_ENV === "development") {
			console.warn("[turnstile] No TURNSTILE_SECRET_KEY set — skipping verification in dev");
			return { success: true };
		}
		return { success: false };
	}

	if (!token) {
		// Allow requests without token (e.g., auto-start from marketing hero)
		// Rate limiting is the primary defense; Turnstile is a bonus layer
		console.warn("[turnstile] No token provided — allowing request (rate-limit still applies)");
		return { success: true };
	}

	try {
		const formData = new URLSearchParams();
		formData.append("secret", secretKey);
		formData.append("response", token);
		formData.append("remoteip", ip);

		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: formData.toString(),
			signal: AbortSignal.timeout(5_000),
		});

		if (!response.ok) {
			return { success: false };
		}

		const data: TurnstileResponse = await response.json();
		return { success: data.success };
	} catch {
		return { success: false };
	}
}
