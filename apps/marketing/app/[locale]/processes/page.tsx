import { config } from "@config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProcessesClient } from "./client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "processes" });
	return {
		title: t("metaTitle"),
		description: t("subtitle"),
	};
}

export default async function ProcessesPage(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	return <ProcessesClient saasUrl={config.saasUrl} />;
}
