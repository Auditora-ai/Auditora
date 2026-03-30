import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ToolResult({
	toolName,
	resultUrl,
	locale,
	translations,
}: {
	toolName: string;
	resultUrl: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: { ...msgs.toolResult, common: msgs.common },
	});

	const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://auditora.ai";

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { toolName })}
			footerReason={t("common.footer.receivingBecauseTool")}
		>
			<Text style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}>
				{t("heading", { toolName })}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { toolName })}
			</Text>

			<PrimaryButton href={resultUrl}>
				{t("ctaButton")}
			</PrimaryButton>

			<Text style={{ color: "#78716C", fontSize: "14px", marginTop: "24px", lineHeight: "1.6" }}>
				{t("didYouKnow")}
			</Text>

			<Link href={baseUrl} style={{ color: "#00E5C0", fontSize: "14px" }}>
				{t("learnMore")} →
			</Link>
		</Wrapper>
	);
}

ToolResult.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	toolName: "BPMN Generator",
	resultUrl: "https://auditora.ai/tools/bpmn-generator",
};

export default ToolResult;
