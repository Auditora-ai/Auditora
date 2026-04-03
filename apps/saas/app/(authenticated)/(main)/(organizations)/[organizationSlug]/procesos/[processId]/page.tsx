import { redirect } from "next/navigation";

export default async function ProcesoDetailRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;
	redirect(`/${organizationSlug}/processes/${processId}`);
}
