import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ToolNurture1({
	toolName,
	unsubscribeUrl,
	locale,
	translations,
}: {
	toolName: string;
	unsubscribeUrl?: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.toolNurture1, common: translations.common },
	});

	const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://auditora.ai";

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			unsubscribeUrl={unsubscribeUrl}
			footerReason={t("common.footer.receivingBecauseTool")}
		>
			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("intro", { toolName })}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6", fontWeight: "600" }}>
				{t("hook")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("description")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.8", paddingLeft: "8px" }}>
				{"1. "}{t("feature1")}{"\n"}
				{"2. "}{t("feature2")}{"\n"}
				{"3. "}{t("feature3")}{"\n"}
				{"4. "}{t("feature4")}{"\n"}
				{"5. "}{t("feature5")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				<strong>{t("result")}</strong>
			</Text>

			<PrimaryButton href={baseUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

ToolNurture1.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	toolName: "BPMN Generator",
	unsubscribeUrl: "https://auditora.ai/unsubscribe?token=abc123",
};

export default ToolNurture1;
