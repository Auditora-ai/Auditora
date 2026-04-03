import { redirect } from "next/navigation";

export default async function SessionsNewRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/descubrir/new`);
}
