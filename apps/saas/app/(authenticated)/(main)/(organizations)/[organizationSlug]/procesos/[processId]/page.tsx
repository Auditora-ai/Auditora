import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ organizationSlug: string; processId: string }> }) {
	const { organizationSlug, processId } = await params;
	redirect(`/${organizationSlug}/process/${processId}`);
}
