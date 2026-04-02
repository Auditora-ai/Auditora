"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@repo/ui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Briefcase, ClipboardCheck, Factory } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

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
	const sectionRef = useRef<HTMLElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [activeTab, setActiveTab] = useState<string>("tab1");

	const handleTabChange = useCallback(
		(newTab: string) => {
			if (newTab === activeTab || !contentRef.current) return;

			const el = contentRef.current;
			const tl = gsap.timeline();

			// Fade out old content
			tl.to(el, {
				opacity: 0,
				y: 8,
				duration: 0.3,
				ease: "power2.in",
				onComplete: () => {
					setActiveTab(newTab);
				},
			});

			// Fade in new content
			tl.fromTo(
				el,
				{ opacity: 0, y: -8 },
				{ opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
				"+=0.05",
			);
		},
		[activeTab],
	);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			tl.from(".uc-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".uc-tabs",
				{
					opacity: 0,
					y: 20,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);

			tl.from(
				".uc-content",
				{
					opacity: 0,
					y: 20,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white"
		>
			<div className="container max-w-4xl">
				{/* Header */}
				<div className="uc-header mb-10 sm:mb-14 text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6">
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white text-balance">
						{t("title")}
					</h2>
				</div>

				{/* Tabs */}
				<div className="uc-tabs flex justify-center border-b border-white/[0.06] mb-8 sm:mb-10">
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
				<div ref={contentRef} className="uc-content text-center max-w-2xl mx-auto">
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
