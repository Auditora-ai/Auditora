import { redirect } from "next/navigation";

export default async function DeliverablesRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	// Deliverables are now absorbed into their respective modules:
	// - Process deliverables → /processes
	// - Risk reports → /processes (risks tab)
	// - Evaluation reports → /evaluaciones?tab=dashboard
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/processes`);
}
