import { DiscoveryChat } from "@discovery/components/DiscoveryChat";

export async function generateMetadata() {
	return { title: "Discovery Organizacional" };
}

export default async function DiscoveryPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return <DiscoveryChat organizationSlug={organizationSlug} />;
}
