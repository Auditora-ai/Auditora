import { redirect } from "next/navigation";

export default function EvaluationRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	// Redirect to evaluaciones with dashboard tab active
	params.then(({ organizationSlug }) => {
		redirect(`/${organizationSlug}/evaluaciones?tab=dashboard`);
	});

	return null;
}
