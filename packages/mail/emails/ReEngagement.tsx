import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ReEngagement({
	userName,
	dashboardUrl,
	unsubscribeUrl,
	locale,
	translations,
}: {
	userName?: string;
	dashboardUrl: string;
	unsubscribeUrl?: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.reEngagement, common: msgs.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			unsubscribeUrl={unsubscribeUrl}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{userName && <Text>{t("common.greeting", { name: userName })}</Text>}

			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("suggestion")}
			</Text>

			<PrimaryButton href={dashboardUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

ReEngagement.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	userName: "Oscar",
	dashboardUrl: "https://app.auditora.ai/dashboard",
	unsubscribeUrl: "https://auditora.ai/unsubscribe?token=abc123",
};

export default ReEngagement;
