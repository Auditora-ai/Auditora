import { RadiografiaPage } from "@radiografia/components/RadiografiaPage";
import { Suspense } from "react";

export const metadata = {
	title: "Business Process Scan | Auditora.ai",
	description:
		"Discover hidden risks in your business processes. Free AI-powered analysis in under a minute.",
};

export default function Page() {
	return (
		<Suspense>
			<RadiografiaPage />
		</Suspense>
	);
}
