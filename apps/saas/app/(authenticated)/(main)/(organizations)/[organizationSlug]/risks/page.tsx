import { redirect } from "next/navigation";

export default async function DeprecatedRisksPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/processes`);
}
