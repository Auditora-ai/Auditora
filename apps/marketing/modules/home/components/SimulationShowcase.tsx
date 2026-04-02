"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@repo/ui";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	Brain,
	MapPin,
	Users,
	BarChart3,
	Sparkles,
	CircleDot,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
	id: string;
	icon: LucideIcon;
}

const features: Feature[] = [
	{ id: "feature1", icon: MapPin },
	{ id: "feature2", icon: Users },
	{ id: "feature3", icon: BarChart3 },
];

const OPTIONS = ["A", "B", "C"] as const;

export function SimulationShowcase() {
	const t = useTranslations("home.simulation");
	const sectionRef = useRef<HTMLElement>(null);

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

			// Header reveal
			tl.from(".sim-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			// Scenario card slides in from left
			tl.from(
				".sim-scenario-card",
				{
					opacity: 0,
					x: -60,
					duration: 0.9,
					ease: "power3.out",
				},
				"-=0.3",
			);

			// Feature cards slide in from right
			tl.from(
				".sim-feature-card",
				{
					opacity: 0,
					x: 60,
					stagger: 0.15,
					duration: 0.7,
					ease: "power3.out",
				},
				"-=0.5",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			id="simulation"
			className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white"
		>
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="sim-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6">
						<Sparkles className="size-3.5 text-[#00E5C0]" strokeWidth={2} />
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white text-balance"
						style={{ perspective: "600px" }}
					>
						<SplitWords innerClassName="sim-word-inner">
							{t("title")}
						</SplitWords>
					</h2>
					<p className="mt-4 sm:mt-6 text-[#94A3B8] text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Two-column layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
					{/* LEFT: Interactive scenario mockup */}
					<div className="sim-scenario-card">
						<div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
							{/* Top bar — progress indicator */}
							<div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
								<div className="flex items-center gap-2">
									<Brain
										className="size-4 text-[#00E5C0]"
										strokeWidth={1.5}
									/>
									<span className="text-xs font-medium text-[#94A3B8]">
										Decision 3 of 8
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-xs text-[#64748B]">COO</span>
									<div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
										<div
											className="h-full w-[37.5%] rounded-full bg-[#00E5C0]"
											style={{ width: "37.5%" }}
										/>
									</div>
								</div>
							</div>

							{/* Progress bar */}
							<div className="h-0.5 w-full bg-white/[0.04]">
								<div
									className="h-full bg-gradient-to-r from-[#00E5C0] to-[#00E5C0]/60"
									style={{ width: "37.5%" }}
								/>
							</div>

							{/* Question */}
							<div className="px-5 sm:px-6 pt-6 pb-2">
								<p className="text-[11px] uppercase tracking-widest text-[#00E5C0]/70 font-medium mb-3">
									Scenario
								</p>
								<p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
									{t("exampleQuestion")}
								</p>
							</div>

							{/* Options */}
							<div className="px-5 sm:px-6 pb-6 pt-4 space-y-2.5">
								{OPTIONS.map((letter, i) => (
									<button
										key={letter}
										type="button"
										className={cn(
											"group flex items-start gap-3 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-left transition-all duration-200",
											"hover:border-[#00E5C0]/30 hover:bg-[#00E5C0]/[0.04] cursor-pointer",
										)}
									>
										<span
											className={cn(
												"flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors duration-200",
												"border-white/[0.1] bg-white/[0.05] text-[#94A3B8] group-hover:border-[#00E5C0]/40 group-hover:bg-[#00E5C0]/10 group-hover:text-[#00E5C0]",
											)}
										>
											{letter}
										</span>
										<span className="text-sm text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-200">
											{t(`exampleOption${letter}`)}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>

					{/* RIGHT: Feature cards */}
					<div className="space-y-4">
						{features.map(({ id, icon: Icon }) => (
							<div
								key={id}
								className="sim-feature-card group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-[#00E5C0]/20 hover:bg-[#00E5C0]/[0.02]"
							>
								<div className="flex items-start gap-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#00E5C0]/10 border border-[#00E5C0]/20">
										<Icon
											className="size-5 text-[#00E5C0]"
											strokeWidth={1.5}
										/>
									</div>
									<div className="min-w-0">
										<h3 className="text-sm sm:text-base font-semibold text-white mb-1">
											{t(`${id}.title`)}
										</h3>
										<p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
											{t(`${id}.description`)}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
