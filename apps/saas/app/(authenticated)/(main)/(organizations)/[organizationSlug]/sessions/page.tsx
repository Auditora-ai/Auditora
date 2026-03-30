import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SessionList } from "@meeting/components/SessionList";

export async function generateMetadata() {
	return { title: "Sessions" };
}

export default async function SessionsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations("sessions");

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div className="pb-24 md:pb-0">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<PageHeader title={t("title")} subtitle={t("subtitle")} />
				<Button asChild className="w-full sm:w-auto min-h-[44px] md:min-h-0">
					<Link href={`/${organizationSlug}/sessions/new`}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("newSession")}
					</Link>
				</Button>
			</div>

			<div className="mt-6">
				<SessionList organizationSlug={organizationSlug} />
			</div>
		</div>
	);
}
