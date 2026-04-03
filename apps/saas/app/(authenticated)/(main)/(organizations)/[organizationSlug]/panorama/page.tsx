import { redirect } from "next/navigation";

export default async function PanoramaRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}`);
}
