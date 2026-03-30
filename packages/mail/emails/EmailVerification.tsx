import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function EmailVerification({
	url,
	name,
	locale,
	translations,
}: {
	url: string;
	name: string;
} & BaseMailProps) {
	const msgs = translations ?? defaultTranslations;
	const t = createTranslator({
		locale,
		messages: {
			...msgs.emailVerification,
			common: msgs.common,
		},
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader")}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{name && <Text>{t("common.greeting", { name })}</Text>}

			<Text>{t("body")}</Text>

			<PrimaryButton href={url}>{t("confirmEmail")}</PrimaryButton>

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

EmailVerification.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "https://app.auditora.ai/verify?token=abc123",
	name: "Oscar",
};

export default EmailVerification;
