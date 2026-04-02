import { redirect } from "next/navigation";

export default function DeliverablesRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	// Deliverables are now absorbed into their respective modules:
	// - Process deliverables → /processes
	// - Risk reports → /processes (risks tab)
	// - Evaluation reports → /evaluaciones?tab=dashboard
	params.then(({ organizationSlug }) => {
		redirect(`/${organizationSlug}/processes`);
	});

	return null;
}
