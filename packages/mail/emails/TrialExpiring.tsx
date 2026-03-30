import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function TrialExpiring({
	userName,
	daysRemaining,
	upgradeUrl,
	planName,
	locale,
	translations,
}: {
	userName?: string;
	daysRemaining: number;
	upgradeUrl: string;
	planName?: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.trialExpiring, common: msgs.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{userName && <Text>{t("common.greeting", { name: userName })}</Text>}

			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading", { daysRemaining })}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { planName: planName || "Auditora.ai" })}
			</Text>

			<Text style={{ color: "#78716C", fontSize: "14px", lineHeight: "1.6" }}>
				{t("valueProp")}
			</Text>

			<PrimaryButton href={upgradeUrl}>
				{t("ctaButton")}
			</PrimaryButton>

			<Text style={{ color: "#78716C", fontSize: "14px", marginTop: "16px", lineHeight: "1.6" }}>
				{t("questionsNote")}
			</Text>
		</Wrapper>
	);
}

TrialExpiring.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	userName: "Oscar",
	daysRemaining: 3,
	upgradeUrl: "https://app.auditora.ai/settings/billing",
	planName: "Growth",
};

export default TrialExpiring;
