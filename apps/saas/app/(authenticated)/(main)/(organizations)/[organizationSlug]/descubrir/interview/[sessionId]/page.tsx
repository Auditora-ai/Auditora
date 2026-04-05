import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ organizationSlug: string; sessionId: string }> }) {
	const { organizationSlug, sessionId } = await params;
	redirect(`/${organizationSlug}/capture/${sessionId}`);
}
