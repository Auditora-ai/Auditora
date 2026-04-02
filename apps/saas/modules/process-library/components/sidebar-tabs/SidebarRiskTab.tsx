"use client";

import { RiskTab } from "../risks/RiskTab";

export function SidebarRiskTab({ processId }: { processId: string }) {
	return <RiskTab processId={processId} />;
}
