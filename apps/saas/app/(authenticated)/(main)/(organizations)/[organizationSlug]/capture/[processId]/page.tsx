import { redirect } from "next/navigation";

export default async function CaptureProcessPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; processId: string }>;
}) {
	const { organizationSlug, processId } = await params;
	// Route to the interview flow with this process
	redirect(`/${organizationSlug}/descubrir/interview?processId=${processId}`);
}
