export type ConsentCategory = "essential" | "analytics" | "marketing";

export interface ConsentPreferences {
	essential: true;
	analytics: boolean;
	marketing: boolean;
	timestamp: string;
	version: number;
}

export const CONSENT_COOKIE_NAME = "cookie_consent";
export const CONSENT_VERSION = 1;

export interface CookieInfo {
	name: string;
	category: ConsentCategory;
	duration: string;
	purpose: string;
}

export const COOKIE_INVENTORY: CookieInfo[] = [
	{
		name: "session_token",
		category: "essential",
		duration: "30 days",
		purpose: "Authentication session",
	},
	{
		name: "NEXT_LOCALE",
		category: "essential",
		duration: "Session",
		purpose: "Language preference",
	},
	{
		name: CONSENT_COOKIE_NAME,
		category: "essential",
		duration: "1 year",
		purpose: "Stores your cookie consent preferences",
	},
	{
		name: "sidebar-collapsed",
		category: "essential",
		duration: "1 year",
		purpose: "Sidebar UI state",
	},
	{
		name: "scan_session",
		category: "essential",
		duration: "24 hours",
		purpose: "Anonymous scan session identifier",
	},
	{
		name: "_ga / _gid",
		category: "analytics",
		duration: "Up to 2 years",
		purpose: "Google Analytics usage tracking",
	},
	{
		name: "ph_*",
		category: "analytics",
		duration: "1 year",
		purpose: "Product analytics (PostHog)",
	},
];

export function parseConsentCookie(
	value: string | undefined,
): ConsentPreferences | null {
	if (!value) return null;
	try {
		const parsed = JSON.parse(decodeURIComponent(value));
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			typeof parsed.analytics === "boolean" &&
			typeof parsed.marketing === "boolean" &&
			typeof parsed.version === "number"
		) {
			return parsed as ConsentPreferences;
		}
		return null;
	} catch {
		return null;
	}
}

export function serializeConsentCookie(prefs: ConsentPreferences): string {
	return encodeURIComponent(JSON.stringify(prefs));
}

export function createConsentPreferences(
	analytics: boolean,
	marketing: boolean,
): ConsentPreferences {
	return {
		essential: true,
		analytics,
		marketing,
		timestamp: new Date().toISOString(),
		version: CONSENT_VERSION,
	};
}
