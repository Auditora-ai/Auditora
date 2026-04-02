"use client";

import { cn } from "@repo/ui";
import { SplitWords } from "@shared/components/SplitWords";
import {
	Brain,
	MapPin,
	Users,
	BarChart3,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

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
	const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);

	return (
		<section
			id="simulation"
			className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white"
		>
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="sim-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<div className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6">
						<Sparkles className="size-3.5 text-[#00E5C0]" strokeWidth={2} />
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</div>
					<h2
						className="anim-fade-up anim-d1 font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white text-balance"
						style={{ perspective: "600px" }}
					>
						<SplitWords innerClassName="sim-word-inner">
							{t("title")}
						</SplitWords>
					</h2>
					<p className="anim-fade-up anim-d2 mt-4 sm:mt-6 text-[#94A3B8] text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Two-column layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
					{/* LEFT: Interactive scenario mockup */}
					<div className="anim-fade-up anim-d3 sim-scenario-card">
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
										onClick={() => setSelectedOption(letter)}
										className={cn(
											"group flex items-start gap-3 w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
											selectedOption === letter
												? "border-[#00E5C0]/50 bg-[#00E5C0]/10"
												: "border-white/[0.06] bg-white/[0.02] hover:border-[#00E5C0]/30 hover:bg-[#00E5C0]/[0.04]",
											"cursor-pointer",
										)}
									>
										<span
											className={cn(
												"flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors duration-200",
												selectedOption === letter
													? "border-[#00E5C0] bg-[#00E5C0] text-[#0A1428]"
													: "border-white/[0.1] bg-white/[0.05] text-[#94A3B8] group-hover:border-[#00E5C0]/40 group-hover:bg-[#00E5C0]/10 group-hover:text-[#00E5C0]",
											)}
										>
											{letter}
										</span>
										<span className="text-sm text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-200">
											{t(`exampleOption${letter}`)}
										</span>
									</button>
								))}

								{/* Feedback message */}
								{selectedOption && (
									<p className="text-xs text-[#00E5C0] pt-1 pl-1">
										✓ Answer recorded — this is a demo preview
									</p>
								)}
							</div>
						</div>
					</div>

					{/* RIGHT: Feature cards */}
					<div className="space-y-4">
						{features.map(({ id, icon: Icon }, index) => (
							<div
								key={id}
								className={cn(
									"sim-feature-card group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-[#00E5C0]/20 hover:bg-[#00E5C0]/[0.02]",
									`anim-fade-up anim-d${4 + index}`,
								)}
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
