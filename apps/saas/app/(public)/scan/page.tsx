import { RadiografiaPage } from "@radiografia/components/RadiografiaPage";
import { RadiografiaWizard } from "@radiografia/components/v2/RadiografiaWizard";
import { Suspense } from "react";

export const metadata = {
	title: "Free Process Scan | Auditora.ai",
	description:
		"Discover hidden risks in your business processes. Free AI-powered analysis in under 2 minutes.",
};

/**
 * Public scan page — two modes:
 * 1. With ?url=X param → Skip wizard, auto-start scan immediately (RadiografiaPage)
 * 2. Without URL → Show the full wizard with company form (RadiografiaWizard)
 */
export default function Page({
	searchParams,
}: {
	searchParams: Promise<{ url?: string; mode?: string; ref?: string }>;
}) {
	return (
		<Suspense>
			<ScanRouter searchParams={searchParams} />
		</Suspense>
	);
}

async function ScanRouter({
	searchParams,
}: {
	searchParams: Promise<{ url?: string; mode?: string; ref?: string }>;
}) {
	const params = await searchParams;

	// If URL provided, go straight to scan — zero friction
	if (params.url) {
		return <RadiografiaPage />;
	}

	// Otherwise show the wizard
	return <RadiografiaWizard />;
}
