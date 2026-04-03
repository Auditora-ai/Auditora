import { config } from "@config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EvaluationsClient } from "./client";

export async function generateMetadata(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "evaluations" });
	return {
		title: t("metaTitle"),
		description: t("subtitle"),
	};
}

export default async function EvaluationsPage(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	return <EvaluationsClient saasUrl={config.saasUrl} />;
}
