import { getTranslations, setRequestLocale } from "next-intl/server";
import { CareersClient } from "./client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "careers" });
	return {
		title: t("metaTitle"),
		description: t("subtitle"),
	};
}

export default async function CareersPage(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	return <CareersClient />;
}
