import { SharedScanResults } from "@radiografia/components/SharedScanResults";
import { Suspense } from "react";

export const metadata = {
	title: "Scan Results | Auditora.ai",
	description:
		"Shared operational risk scan results from Auditora.ai — see the risks identified in this business process.",
};

export default function Page() {
	return (
		<Suspense>
			<SharedScanResults />
		</Suspense>
	);
}
