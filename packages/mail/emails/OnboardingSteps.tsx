import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function OnboardingSteps({
	userName,
	dashboardUrl,
	locale,
	translations,
}: {
	userName: string;
	dashboardUrl: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.onboardingSteps, common: translations.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
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
				<strong>{t("step1Title")}</strong>{"\n"}
				{t("step1Body")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				<strong>{t("step2Title")}</strong>{"\n"}
				{t("step2Body")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				<strong>{t("step3Title")}</strong>{"\n"}
				{t("step3Body")}
			</Text>

			<Text style={{ color: "#78716C", fontSize: "14px", fontStyle: "italic" }}>
				{t("valueProp")}
			</Text>

			<PrimaryButton href={dashboardUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

OnboardingSteps.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	userName: "Oscar",
	dashboardUrl: "https://app.auditora.ai/dashboard",
};

export default OnboardingSteps;
