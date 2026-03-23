import { redirect } from "next/navigation";

export default async function NewSessionPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/procesos`);
}
