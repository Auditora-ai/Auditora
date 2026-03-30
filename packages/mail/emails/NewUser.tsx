import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../components/PrimaryButton";
import Wrapper from "../components/Wrapper";
import { defaultLocale, defaultTranslations } from "../lib/translations";
import type { BaseMailProps } from "../types";

export function NewUser({
	url,
	otp,
	name,
	locale,
	translations,
}: {
	url: string;
	name: string;
	otp: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: { ...translations.newUser, common: translations.common },
	});

	return (
		<Wrapper
			locale={locale}
			preheader={t("preheader", { otp })}
			footerReason={t("common.footer.receivingBecauseAccount")}
		>
			{name && <Text>{t("common.greeting", { name })}</Text>}

			<Text>{t("body")}</Text>

			<Text>
				{t("common.otp")}
				<br />
				<strong className="font-bold text-2xl">{otp}</strong>
			</Text>

			<Text>{t("common.useLink")}</Text>

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

NewUser.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	url: "https://app.auditora.ai/verify?token=abc123",
	name: "Oscar",
	otp: "482901",
};

export default NewUser;
