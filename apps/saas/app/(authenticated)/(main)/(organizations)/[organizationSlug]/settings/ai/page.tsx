import { getActiveOrganization, getSession } from "@auth/lib/server";
import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { AiUsageDashboard } from "@organizations/components/AiUsageDashboard";
import { AiApiKeysManager } from "@organizations/components/AiApiKeysManager";
import { SettingsList } from "@shared/components/SettingsList";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("organizations.settings");
	return {
		title: t("ai.title"),
	};
}

export default async function AiSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const session = await getSession();
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/");
	}

	if (!isOrganizationAdmin(organization, session?.user)) {
		notFound();
	}

	return (
		<SettingsList>
			<AiUsageDashboard organizationId={organization.id} />
			<AiApiKeysManager organizationId={organization.id} />
		</SettingsList>
	);
}
