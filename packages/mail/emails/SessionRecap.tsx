import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function SessionRecap({
	processName,
	reviewUrl,
	userName,
	locale,
	translations,
}: {
	processName: string;
	reviewUrl: string;
	userName?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.sessionRecap, common: translations.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { processName })}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{userName && <Text>{t("common.greeting", { name: userName })}</Text>}

			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { processName })}
			</Text>

			<Text style={{ color: "#78716C", fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
				{t("deliverablesHeading")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.8", paddingLeft: "8px" }}>
				{"• "}{t("deliverable1")}{"\n"}
				{"• "}{t("deliverable2")}{"\n"}
				{"• "}{t("deliverable3")}{"\n"}
				{"• "}{t("deliverable4")}{"\n"}
				{"• "}{t("deliverable5")}{"\n"}
				{"• "}{t("deliverable6")}{"\n"}
				{"• "}{t("deliverable7")}
			</Text>

			<PrimaryButton href={reviewUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

SessionRecap.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	processName: "Onboarding de Nuevos Empleados",
	reviewUrl: "https://app.auditora.ai/acme/session/abc123/review",
	userName: "Oscar",
};

export default SessionRecap;
