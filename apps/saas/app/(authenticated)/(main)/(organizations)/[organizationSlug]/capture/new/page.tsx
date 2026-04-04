import { Suspense } from "react";
import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NewSessionForm } from "@meeting/components/NewSessionForm";

export async function generateMetadata() {
	const t = await getTranslations("sessions.new");
	return { title: t("title") };
}

export default async function CaptureNewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("sessions.new");

	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<div>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
			/>

			<div className="mt-6 max-w-2xl">
				<Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-card" />}>
					<NewSessionForm organizationSlug={organizationSlug} />
				</Suspense>
			</div>
		</div>
	);
}
