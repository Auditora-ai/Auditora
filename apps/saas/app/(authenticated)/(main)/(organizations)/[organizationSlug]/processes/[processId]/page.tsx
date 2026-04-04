import { redirect } from "next/navigation";

export default async function ProcessDetailRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;
	redirect(`/${organizationSlug}/procesos/${processId}`);
}
