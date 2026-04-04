import { redirect } from "next/navigation";

export default async function SessionsInterviewIdRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string; sessionId: string }>;
}) {
	const { organizationSlug, sessionId } = await params;
	redirect(`/${organizationSlug}/descubrir/interview/${sessionId}`);
}
