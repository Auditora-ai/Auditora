"use client";

import { cn } from "@repo/ui";
import { Briefcase, ClipboardCheck, Factory } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { useScrollReveal } from "@shared/hooks/use-scroll-reveal";

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
	const [visibleTab, setVisibleTab] = useState<string>("tab1");
	const { ref, inView } = useScrollReveal();

	const handleTabChange = useCallback(
		(newTab: string) => {
			if (newTab === activeTab) return;
			setActiveTab(newTab);
			// Briefly hide then reveal for transition effect
			setVisibleTab("");
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setVisibleTab(newTab);
				});
			});
		},
		[activeTab],
	);

	return (
		<section
			ref={ref}
			className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white"
		>
			<div className="container max-w-4xl">
				{/* Header */}
				<div className="text-center">
					<div
						className={cn(
							"reveal-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5",
							inView && "is-visible",
						)}
					>
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2
						className={cn(
							"reveal-fade-up delay-100 font-display text-2xl sm:text-3xl lg:text-4xl text-white text-balance",
							inView && "is-visible",
						)}
					>
						{t("title")}
					</h2>
				</div>

				{/* Tabs */}
				<div
					className={cn(
						"reveal-fade-up delay-200 flex justify-center border-b border-white/[0.06] mb-8 sm:mb-10",
						inView && "is-visible",
					)}
				>
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
				<div
					key={visibleTab}
					className={cn(
						"reveal-fade-up",
						visibleTab && "is-visible",
						"card-lift text-center max-w-2xl mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10",
					)}
				>
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
