import { redirect } from "next/navigation";

export default async function DeliverablesRedirectPage({
	params,
}: {
	// Deliverables are now absorbed into their respective modules:
	// - Process deliverables → /procesos
	// - Risk reports → /procesos (risks tab)
	// - Evaluation reports → /evaluaciones?tab=dashboard
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/${organizationSlug}/procesos`);
}
