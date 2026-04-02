"use client";

import { cn } from "@repo/ui";
import { Briefcase, ClipboardCheck, Factory } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

	const handleTabChange = useCallback((newTab: string) => {
		if (newTab === activeTab) return;
		setActiveTab(newTab);
	}, [activeTab]);

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white">
			<div className="container max-w-4xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
					className="text-center"
				>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5">
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2 className="reveal-fade-up delay-100 font-display text-2xl sm:text-3xl lg:text-4xl text-white text-balance">
						{t("title")}
					</h2>
				</motion.div>

				{/* Tabs */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
					className="flex justify-center border-b border-white/[0.06] mb-8 sm:mb-10"
				>
					{TABS.map(({ id, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => handleTabChange(id)}
							className="relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer"
							style={{ color: activeTab === id ? "#00E5C0" : "#64748B" }}
							onMouseEnter={(e) => { if (activeTab !== id) (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
							onMouseLeave={(e) => { if (activeTab !== id) (e.currentTarget as HTMLElement).style.color = "#64748B"; }}
						>
							<Icon className="size-4" strokeWidth={1.5} />
							<span>{t(`${id}.label`)}</span>
							<motion.span
								layoutId="usecase-tab-indicator"
								className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5C0] rounded-full"
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							/>
						</button>
					))}
				</motion.div>

				{/* Tab content */}
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
						whileHover={{ borderColor: "rgba(0,229,192,0.15)" }}
						className="text-center max-w-2xl mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 transition-colors duration-300"
					>
						<h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-3">
							{t(`${activeTab}.title`)}
						</h3>
						<p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
							{t(`${activeTab}.description`)}
						</p>
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	);
}
