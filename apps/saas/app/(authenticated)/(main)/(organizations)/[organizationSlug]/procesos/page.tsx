import { redirect } from "next/navigation";

export default async function ProcesosRedirect({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/processes`);
}
