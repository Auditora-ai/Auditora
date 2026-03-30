"use client";

import Cookies from "js-cookie";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ConsentCategory, ConsentPreferences } from "@shared/lib/consent-types";
import {
	CONSENT_COOKIE_NAME,
	CONSENT_VERSION,
	createConsentPreferences,
	parseConsentCookie,
	serializeConsentCookie,
} from "@shared/lib/consent-types";

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
	initialConsent: ConsentPreferences | null;
}) {
	const [preferences, setPreferences] = useState<ConsentPreferences | null>(initialConsent);
	const [showBanner, setShowBanner] = useState(false);
	const [gpcDetected, setGpcDetected] = useState(false);

	// Determine if banner should show
	useEffect(() => {
		// Migrate old binary consent cookie
		const oldConsent = Cookies.get("consent");
		if (oldConsent && !preferences) {
			const migrated = createConsentPreferences(
				oldConsent === "true",
				oldConsent === "true",
			);
			persistPreferences(migrated);
			Cookies.remove("consent", { path: "/" });
			return;
		}

		// Check Global Privacy Control signal — must override even existing consent
		if (typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) {
			setGpcDetected(true);
			if (!preferences || preferences.analytics || preferences.marketing) {
				const gpcPrefs = createConsentPreferences(false, false);
				persistPreferences(gpcPrefs);
				return;
			}
		}

		// Show banner if no consent yet or consent version is outdated
		if (!preferences || preferences.version < CONSENT_VERSION) {
			setShowBanner(true);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const persistPreferences = useCallback((prefs: ConsentPreferences) => {
		Cookies.set(CONSENT_COOKIE_NAME, serializeConsentCookie(prefs), COOKIE_OPTIONS);
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

	const acceptAll = useCallback(() => {
		// If GPC is active, respect it for marketing but allow analytics
		const prefs = gpcDetected
			? createConsentPreferences(true, false)
			: createConsentPreferences(true, true);
		persistPreferences(prefs);
	}, [gpcDetected, persistPreferences]);

	const rejectAll = useCallback(() => {
		persistPreferences(createConsentPreferences(false, false));
	}, [persistPreferences]);

	const savePreferences = useCallback(
		(analytics: boolean, marketing: boolean) => {
			// GPC overrides marketing consent
			const effectiveMarketing = gpcDetected ? false : marketing;
			persistPreferences(createConsentPreferences(analytics, effectiveMarketing));
		},
		[gpcDetected, persistPreferences],
	);

	const resetConsent = useCallback(() => {
		Cookies.remove(CONSENT_COOKIE_NAME, { path: "/" });
		setPreferences(null);
		setShowBanner(true);
	}, []);

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
