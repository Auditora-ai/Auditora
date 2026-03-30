import { type NextRequest, NextResponse } from "next/server";

const securityHeaders: Record<string, string> = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	// Start as report-only to avoid breaking inline scripts from Next.js/Turnstile/analytics.
	// Once verified in production, switch to Content-Security-Policy.
	"Content-Security-Policy-Report-Only": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https:",
		"font-src 'self'",
		"connect-src 'self' https://challenges.cloudflare.com https://*.supabase.co",
		"frame-src https://challenges.cloudflare.com",
		"frame-ancestors 'none'",
	].join("; "),
};

export default function proxy(request: NextRequest) {
	const response = NextResponse.next();

	for (const [header, value] of Object.entries(securityHeaders)) {
		response.headers.set(header, value);
	}

	return response;
}

export const config = {
	matcher: [
		// Match all paths except static files and Next.js internals
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
