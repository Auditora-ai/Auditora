import { getActiveOrganization } from "@auth/lib/server";
import { PanoramaView } from "@panorama/components/PanoramaView";
import { MOCK_PANORAMA } from "@panorama/data/mock-panorama";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	return { title: `Panorama — ${activeOrganization?.name ?? ""}` };
}

export default async function PanoramaPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<div className="h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] overflow-y-auto">
			<PanoramaView
				data={MOCK_PANORAMA}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
