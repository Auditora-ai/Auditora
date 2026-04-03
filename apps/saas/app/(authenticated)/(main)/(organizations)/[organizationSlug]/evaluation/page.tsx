import { redirect } from "next/navigation";

export default async function EvaluationRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/evaluaciones?tab=dashboard`);
}
