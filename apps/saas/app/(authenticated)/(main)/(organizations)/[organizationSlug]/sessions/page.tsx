import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { PlusIcon, SparklesIcon } from "lucide-react";
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
				<div className="flex w-full gap-2 sm:w-auto">
					<Button asChild variant="outline" className="flex-1 sm:flex-none min-h-[44px] md:min-h-0">
						<Link href={`/${organizationSlug}/sessions/interview`}>
							<SparklesIcon className="mr-2 h-4 w-4" />
							Entrevista IA
						</Link>
					</Button>
					<Button asChild className="flex-1 sm:flex-none min-h-[44px] md:min-h-0">
						<Link href={`/${organizationSlug}/sessions/new`}>
							<PlusIcon className="mr-2 h-4 w-4" />
							{t("newSession")}
						</Link>
					</Button>
				</div>
			</div>

			<div className="mt-6">
				<SessionList organizationSlug={organizationSlug} />
			</div>
		</div>
	);
}
