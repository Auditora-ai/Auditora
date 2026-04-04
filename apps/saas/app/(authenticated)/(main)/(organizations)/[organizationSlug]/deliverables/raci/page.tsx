import { redirect } from "next/navigation";

export default async function DeliverablesraciRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/procesos`);
}
