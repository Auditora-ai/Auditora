import { config } from "@config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutClient } from "./client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "about" });
	return {
		title: t("metaTitle"),
		description: t("subtitle"),
	};
}

export default async function AboutPage(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	return <AboutClient saasUrl={config.saasUrl} />;
}
