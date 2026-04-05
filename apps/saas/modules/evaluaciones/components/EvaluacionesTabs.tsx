"use client";

import { useTranslations } from "next-intl";
import { GraduationCapIcon, BarChart3Icon, TrendingUpIcon } from "lucide-react";
import { cn } from "@repo/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { HumanRiskDashboard } from "./HumanRiskDashboard";
import { ProgressDashboard } from "./ProgressDashboard";
import type { DashboardData, ProgressData } from "@evaluaciones/lib/dashboard-queries";

type TabId = "catalog" | "dashboard" | "progress";

interface EvaluacionesTabsProps {
	activeTab: TabId;
	organizationSlug: string;
	catalogContent: React.ReactNode;
	dashboardData: DashboardData;
	progressData: ProgressData;
}

const TABS = [
	{ id: "catalog" as const, icon: GraduationCapIcon, labelKey: "evaluaciones.tabs.catalog" },
	{ id: "dashboard" as const, icon: BarChart3Icon, labelKey: "evaluaciones.tabs.dashboard" },
	{ id: "progress" as const, icon: TrendingUpIcon, labelKey: "evaluaciones.tabs.progress" },
];

export function EvaluacionesTabs({
	activeTab,
	organizationSlug,
	catalogContent,
	dashboardData,
	progressData,
}: EvaluacionesTabsProps) {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleTabChange = useCallback(
		(tabId: TabId) => {
			const params = new URLSearchParams(searchParams.toString());
			if (tabId === "catalog") {
				params.delete("tab");
			} else {
				params.set("tab", tabId);
			}
			router.replace(`/${organizationSlug}/evaluaciones?${params.toString()}`);
		},
		[router, organizationSlug, searchParams],
	);

	return (
		<div>
			{/* Tab bar — horizontally scrollable on mobile */}
			<div
				role="tablist"
				aria-label={t("evaluaciones.tabs.label")}
				className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1 overflow-x-auto no-scrollbar"
			>
				{TABS.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`tabpanel-${tab.id}`}
							id={`tab-${tab.id}`}
							onClick={() => handleTabChange(tab.id)}
							className={cn(
								"flex items-center gap-1.5 md:gap-2 rounded-md px-3 py-2.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap min-h-[48px] flex-1 justify-center md:flex-none",
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<tab.icon className="size-4 shrink-0" />
							{t(tab.labelKey)}
						</button>
					);
				})}
			</div>

			{/* Tab content */}
			<div
				role="tabpanel"
				id={`tabpanel-${activeTab}`}
				aria-labelledby={`tab-${activeTab}`}
				className="mt-4 md:mt-6"
			>
				{activeTab === "catalog" && catalogContent}
				{activeTab === "dashboard" && (
					<HumanRiskDashboard
						data={dashboardData}
						organizationSlug={organizationSlug}
					/>
				)}
				{activeTab === "progress" && (
					<ProgressDashboard
						data={progressData}
						organizationSlug={organizationSlug}
					/>
				)}
			</div>
		</div>
	);
}
