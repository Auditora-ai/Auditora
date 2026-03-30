import { Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ContactConfirmation({
	name,
	locale,
	translations,
}: {
	name: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: {
			...msgs.contactConfirmation,
			common: msgs.common,
		},
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			footerReason={t("common.footer.receivingBecauseTool")}
		>
			<Text
				style={{ fontSize: "18px", fontWeight: "bold", color: "#0A1428" }}
			>
				{t("heading")}
			</Text>

			<Text style={{ color: "#0A1428", lineHeight: "1.6" }}>
				{t("body", { name })}
			</Text>

			<Text
				style={{
					color: "#78716C",
					fontSize: "14px",
					marginTop: "24px",
					lineHeight: "1.6",
				}}
			>
				{t("note")}
			</Text>
		</Wrapper>
	);
}

ContactConfirmation.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "Oscar",
};

export default ContactConfirmation;
