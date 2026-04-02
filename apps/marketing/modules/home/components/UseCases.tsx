"use client";

import { cn } from "@repo/ui";
import { Briefcase, ClipboardCheck, Factory } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";

interface Tab {
	id: string;
	icon: LucideIcon;
}

const TABS: Tab[] = [
	{ id: "tab1", icon: Briefcase },
	{ id: "tab2", icon: ClipboardCheck },
	{ id: "tab3", icon: Factory },
];

export function UseCases() {
	const t = useTranslations("home.useCases");
	const [activeTab, setActiveTab] = useState<string>("tab1");

	const handleTabChange = useCallback(
		(newTab: string) => {
			if (newTab === activeTab) return;
			setActiveTab(newTab);
		},
		[activeTab],
	);

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white">
			<div className="container max-w-4xl">
				{/* Header */}
				<div className="mb-10 sm:mb-14 text-center">
					<div className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6">
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2 className="anim-fade-up anim-d1 font-display text-2xl sm:text-3xl lg:text-4xl text-white text-balance">
						{t("title")}
					</h2>
				</div>

				{/* Tabs */}
				<div className="anim-fade-up anim-d2 flex justify-center border-b border-white/[0.06] mb-8 sm:mb-10">
					{TABS.map(({ id, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => handleTabChange(id)}
							className={cn(
								"relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-colors duration-200",
								activeTab === id
									? "text-[#00E5C0]"
									: "text-[#64748B] hover:text-[#94A3B8]",
							)}
						>
							<Icon
								className="size-4"
								strokeWidth={1.5}
							/>
							<span>{t(`${id}.label`)}</span>
							{/* Active indicator */}
							{activeTab === id && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5C0] rounded-full" />
							)}
						</button>
					))}
				</div>

				{/* Tab content */}
				<div className="anim-fade-up anim-d3 text-center max-w-2xl mx-auto">
					<h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-3">
						{t(`${activeTab}.title`)}
					</h3>
					<p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
						{t(`${activeTab}.description`)}
					</p>
				</div>
			</div>
		</section>
	);
}
