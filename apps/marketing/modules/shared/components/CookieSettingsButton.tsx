"use client";

import { useCookieConsent } from "@shared/hooks/cookie-consent";
import { useTranslations } from "next-intl";

export function CookieSettingsButton() {
	const { resetConsent } = useCookieConsent();
	const t = useTranslations();

	return (
		<button
			type="button"
			onClick={resetConsent}
			className="block text-left hover:text-foreground/80 transition-colors"
		>
			{t("common.footer.cookieSettings")}
		</button>
	);
}
