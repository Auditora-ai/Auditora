"use client";

import { RiskTab } from "@risk/components/RiskTab";

export function SidebarRiskTab({ processId }: { processId: string }) {
	return <RiskTab processId={processId} />;
}
