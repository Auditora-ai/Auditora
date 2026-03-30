import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ToolNurture2({
	toolName,
	unsubscribeUrl,
	locale,
	translations,
}: {
	toolName: string;
	unsubscribeUrl?: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.toolNurture2, common: msgs.common },
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

			<Text
				style={{
					backgroundColor: "#FAF9F7",
					padding: "16px",
					borderRadius: "8px",
					border: "1px solid #E7E5E4",
					color: "#0A1428",
					lineHeight: "1.8",
				}}
			>
				<strong>{t("before")}</strong>{"\n"}
				{t("beforeDetail")}{"\n\n"}
				<strong>{t("after")}</strong>{"\n"}
				{t("afterDetail")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("math")}
			</Text>

			<PrimaryButton href={baseUrl}>
				{t("ctaButton")}
			</PrimaryButton>
		</Wrapper>
	);
}

ToolNurture2.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	toolName: "BPMN Generator",
	unsubscribeUrl: "https://auditora.ai/unsubscribe?token=abc123",
};

export default ToolNurture2;
