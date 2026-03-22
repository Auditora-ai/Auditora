import { getActiveOrganization } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { Button } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import { WorkflowIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	return {
		title: "Sessions",
	};
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

	// TODO: Fetch sessions from DB
	const sessions: any[] = [];

	return (
		<div>
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
			/>

			<div className="mt-6">
				{sessions.length === 0 ? (
					<Card>
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<WorkflowIcon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground">
								{t("empty.title")}
							</h3>
							<p className="mt-2 max-w-sm text-sm text-muted-foreground">
								{t("empty.description")}
							</p>
							<Button asChild className="mt-6">
								<Link href={`/${organizationSlug}/sessions/new`}>
									<PlusIcon className="mr-2 h-4 w-4" />
									{t("newSession")}
								</Link>
							</Button>
						</div>
					</Card>
				) : (
					<Card>
						<div className="flex h-64 items-center justify-center p-8 text-muted-foreground">
							Session list will appear here
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
