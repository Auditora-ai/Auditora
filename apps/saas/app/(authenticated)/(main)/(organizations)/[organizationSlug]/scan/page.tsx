import { getActiveOrganization } from "@auth/lib/server";
import { AuthenticatedScan } from "@radiografia/components/v2/AuthenticatedScan";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const org = await getActiveOrganization(organizationSlug);
	return {
		title: `Discovery — ${org?.name || "Scan"}`,
	};
}

export default async function AuthenticatedScanPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const org = await getActiveOrganization(organizationSlug);
	if (!org) return notFound();

	const orgData = await db.organization.findUnique({
		where: { id: org.id },
		select: { id: true, name: true, slug: true, industry: true },
	});

	return (
		<Suspense>
			<AuthenticatedScan
				organizationId={org.id}
				organizationSlug={organizationSlug}
				organizationName={orgData?.name || ""}
				orgIndustry={orgData?.industry || undefined}
			/>
		</Suspense>
	);
}
