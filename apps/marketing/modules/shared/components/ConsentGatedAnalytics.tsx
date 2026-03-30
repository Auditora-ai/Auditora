"use client";

import { AnalyticsScript } from "@analytics";
import { useCookieConsent } from "@shared/hooks/cookie-consent";

export function ConsentGatedAnalytics() {
	const { isAllowed } = useCookieConsent();

	if (!isAllowed("analytics")) return null;

	return <AnalyticsScript />;
}
