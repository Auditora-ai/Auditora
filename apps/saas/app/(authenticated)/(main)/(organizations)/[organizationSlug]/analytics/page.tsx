import { redirect } from "next/navigation";

export default async function DeprecatedAnalyticsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/panorama`);
}
