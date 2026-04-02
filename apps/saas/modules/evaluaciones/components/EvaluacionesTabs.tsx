"use client";

import { useTranslations } from "next-intl";
import { GraduationCapIcon, BarChart3Icon } from "lucide-react";
import { cn } from "@repo/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { HumanRiskDashboard } from "./HumanRiskDashboard";
import type { DashboardData } from "@evaluaciones/lib/dashboard-queries";

interface EvaluacionesTabsProps {
	activeTab: "catalog" | "dashboard";
	organizationSlug: string;
	catalogContent: React.ReactNode;
	dashboardData: DashboardData;
}

const TABS = [
	{ id: "catalog" as const, icon: GraduationCapIcon, labelKey: "evaluaciones.tabs.catalog" },
	{ id: "dashboard" as const, icon: BarChart3Icon, labelKey: "evaluaciones.tabs.dashboard" },
];

export function EvaluacionesTabs({
	activeTab,
	organizationSlug,
	catalogContent,
	dashboardData,
}: EvaluacionesTabsProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleTabChange = useCallback(
		(tabId: "catalog" | "dashboard") => {
			const params = new URLSearchParams(searchParams.toString());
			if (tabId === "dashboard") {
				params.set("tab", "dashboard");
			} else {
				params.delete("tab");
			}
			router.replace(`/${organizationSlug}/evaluaciones?${params.toString()}`);
		},
		[router, organizationSlug, searchParams],
	);

	return (
		<div>
			{/* Tab bar */}
			<div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
				{TABS.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							className={cn(
								"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<tab.icon className="size-4" />
							{t(tab.labelKey)}
						</button>
					);
				})}
			</div>

			{/* Tab content */}
			<div className="mt-6">
				{activeTab === "catalog" && catalogContent}
				{activeTab === "dashboard" && (
					<HumanRiskDashboard
						data={dashboardData}
						organizationSlug={organizationSlug}
					/>
				)}
			</div>
		</div>
	);
}
