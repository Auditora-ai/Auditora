import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function UpgradeInvitation({
	userName,
	currentPlan,
	suggestedPlan,
	upgradeUrl,
	features,
	locale,
	translations,
}: {
	userName?: string;
	currentPlan: string;
	suggestedPlan: string;
	upgradeUrl: string;
	features?: string[];
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.upgradeInvitation, common: msgs.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { suggestedPlan })}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{userName && <Text>{t("common.greeting", { name: userName })}</Text>}

			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading", { suggestedPlan })}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { currentPlan, suggestedPlan })}
			</Text>

			{features && features.length > 0 && (
				<Text style={{ color: "#0A1428", lineHeight: "1.8", paddingLeft: "8px" }}>
					{features.map((feature, i) => `• ${feature}`).join("\n")}
				</Text>
			)}

			<Text
				style={{
					backgroundColor: "#FAF9F7",
					padding: "12px 16px",
					borderRadius: "8px",
					border: "1px solid #E7E5E4",
					color: "#78716C",
					fontSize: "14px",
					lineHeight: "1.6",
				}}
			>
				{t("currentPlanLabel", { currentPlan })}{"\n"}
				<strong style={{ color: "#3B8FE8" }}>{t("suggestedPlanLabel", { suggestedPlan })}</strong>
			</Text>

			<PrimaryButton href={upgradeUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

UpgradeInvitation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	userName: "Oscar",
	currentPlan: "Starter",
	suggestedPlan: "Growth",
	upgradeUrl: "https://app.auditora.ai/settings/billing/upgrade",
	features: [
		"40 sessions/month (up from 10)",
		"5 team members (up from 1)",
		"Unlimited process definitions",
		"Priority support",
	],
};

export default UpgradeInvitation;
