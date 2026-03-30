import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function ForgotPassword({
	url,
	name,
	locale,
	translations,
}: {
	url: string;
	name: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: {
			...translations.forgotPassword,
			common: translations.common,
		},
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{name && <Text>{t("common.greeting", { name })}</Text>}

			<Text style={{ whiteSpace: "pre-line" }}>{t("body")}</Text>

			<PrimaryButton href={url}>{t("resetPassword")}</PrimaryButton>

			<Text className="text-muted-foreground text-sm mt-4">
				{t("common.openLinkInBrowser")}
				<br />
				<Link href={url} className="break-all">
					{url}
				</Link>
			</Text>
		</Wrapper>
	);
}

ForgotPassword.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "https://app.auditora.ai/reset-password?token=abc123",
	name: "Oscar",
};

export default ForgotPassword;
