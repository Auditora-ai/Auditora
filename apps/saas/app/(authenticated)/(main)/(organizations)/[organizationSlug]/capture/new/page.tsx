import { NewProcessForm } from "@capture/components/NewProcessForm";

export async function generateMetadata() {
	return { title: "Capturar proceso" };
}

export default async function CaptureNewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return <NewProcessForm organizationSlug={organizationSlug} />;
}
