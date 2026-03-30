"use client";

import Cookies from "js-cookie";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

type ConsentCategory = "essential" | "analytics" | "marketing";

interface ConsentPreferences {
	essential: true;
	analytics: boolean;
	marketing: boolean;
	timestamp: string;
	version: number;
}

const CONSENT_COOKIE_NAME = "cookie_consent";
const CONSENT_VERSION = 1;

export interface ConsentContextValue {
	preferences: ConsentPreferences | null;
	hasConsented: boolean;
	showBanner: boolean;
	isAllowed: (category: ConsentCategory) => boolean;
	acceptAll: () => void;
	rejectAll: () => void;
	savePreferences: (analytics: boolean, marketing: boolean) => void;
	resetConsent: () => void;
}

export const ConsentContext = createContext<ConsentContextValue>({
	preferences: null,
	hasConsented: false,
	showBanner: false,
	isAllowed: () => false,
	acceptAll: () => {},
	rejectAll: () => {},
	savePreferences: () => {},
	resetConsent: () => {},
});

function createPrefs(analytics: boolean, marketing: boolean): ConsentPreferences {
	return {
		essential: true,
		analytics,
		marketing,
		timestamp: new Date().toISOString(),
		version: CONSENT_VERSION,
	};
}

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	expires: 365,
	secure: true,
	sameSite: "lax",
	path: "/",
};

export function ConsentProvider({
	children,
	initialConsent,
}: {
	children: React.ReactNode;
	initialConsent?: ConsentPreferences | null;
}) {
	const [preferences, setPreferences] = useState<ConsentPreferences | null>(initialConsent ?? null);
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		// Migrate old cookie
		const oldConsent = Cookies.get("consent");
		if (oldConsent && !preferences) {
			const migrated = createPrefs(oldConsent === "true", oldConsent === "true");
			Cookies.set(CONSENT_COOKIE_NAME, encodeURIComponent(JSON.stringify(migrated)), COOKIE_OPTIONS);
			Cookies.remove("consent", { path: "/" });
			setPreferences(migrated);
			return;
		}

		if (!preferences || preferences.version < CONSENT_VERSION) {
			setShowBanner(true);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const persist = useCallback((prefs: ConsentPreferences) => {
		Cookies.set(CONSENT_COOKIE_NAME, encodeURIComponent(JSON.stringify(prefs)), COOKIE_OPTIONS);
		setPreferences(prefs);
		setShowBanner(false);
	}, []);

	const isAllowed = useCallback(
		(category: ConsentCategory): boolean => {
			if (category === "essential") return true;
			if (!preferences) return false;
			return preferences[category];
		},
		[preferences],
	);

	const acceptAll = useCallback(() => persist(createPrefs(true, true)), [persist]);
	const rejectAll = useCallback(() => persist(createPrefs(false, false)), [persist]);
	const savePreferences = useCallback(
		(analytics: boolean, marketing: boolean) => persist(createPrefs(analytics, marketing)),
		[persist],
	);
	const resetConsent = useCallback(() => setShowBanner(true), []);

	const value = useMemo<ConsentContextValue>(
		() => ({
			preferences,
			hasConsented: preferences !== null && preferences.version >= CONSENT_VERSION,
			showBanner,
			isAllowed,
			acceptAll,
			rejectAll,
			savePreferences,
			resetConsent,
		}),
		[preferences, showBanner, isAllowed, acceptAll, rejectAll, savePreferences, resetConsent],
	);

	return (
		<ConsentContext.Provider value={value}>
			{children}
		</ConsentContext.Provider>
	);
}
