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
import { motion, AnimatePresence } from "framer-motion";
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

const featureVariants = {
	hidden: { opacity: 0, x: 32 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function SimulationShowcase() {
	const t = useTranslations("home.evaluacion");
	const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | null>(null);

	return (
		<section id="simulation" className="py-16 sm:py-20 lg:py-28 bg-[#0A1428] text-white">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: -12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6"
					>
						<Sparkles className="size-3.5 text-[#00E5C0]" strokeWidth={2} />
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							{t("badge")}
						</span>
					</motion.div>
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white text-balance"
						style={{ perspective: "600px" }}
					>
						<SplitWords innerClassName="sim-word-inner">
							{t("title")}
						</SplitWords>
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="mt-4 sm:mt-6 text-[#94A3B8] text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
					>
						{t("subtitle")}
					</motion.p>
				</div>

				{/* Two-column layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
					{/* LEFT: Scenario mockup */}
					<motion.div
						initial={{ opacity: 0, x: -32 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					>
						<motion.div
							whileHover={{ borderColor: "rgba(0,229,192,0.15)" }}
							transition={{ duration: 0.3 }}
							className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden"
						>
							{/* Top bar */}
							<div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
								<div className="flex items-center gap-2">
									<Brain className="size-4 text-[#00E5C0]" strokeWidth={1.5} />
									<span className="text-xs font-medium text-[#94A3B8]">Decision 3 of 8</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="text-xs text-[#64748B]">COO</span>
									<div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
										<motion.div
											initial={{ width: "0%" }}
											whileInView={{ width: "37.5%" }}
											viewport={{ once: true }}
											transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
											className="h-full rounded-full bg-[#00E5C0]"
										/>
									</div>
								</div>
							</div>

							{/* Progress bar */}
							<div className="h-0.5 w-full bg-white/[0.04]">
								<motion.div
									initial={{ width: "0%" }}
									whileInView={{ width: "37.5%" }}
									viewport={{ once: true }}
									transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
									className="h-full bg-gradient-to-r from-[#00E5C0] to-[#00E5C0]/60"
								/>
							</div>

							{/* Question */}
							<div className="px-5 sm:px-6 pt-6 pb-2">
								<p className="text-[11px] uppercase tracking-widest text-[#00E5C0]/70 font-medium mb-3">Scenario</p>
								<p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
									{t("exampleQuestion")}
								</p>
							</div>

							{/* Options */}
							<div className="px-5 sm:px-6 pb-6 pt-4 space-y-2.5">
								{OPTIONS.map((letter, i) => (
									<motion.button
										key={letter}
										type="button"
										initial={{ opacity: 0, x: -16 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
										onClick={() => setSelectedOption(letter)}
										whileHover={{ borderColor: "rgba(0,229,192,0.3)", backgroundColor: "rgba(0,229,192,0.04)" }}
										whileTap={{ scale: 0.98 }}
										className={cn(
											"group flex items-start gap-3 w-full rounded-xl border px-4 py-3.5 text-left transition-colors duration-200",
											selectedOption === letter
												? "border-[#00E5C0]/50 bg-[#00E5C0]/10"
												: "border-white/[0.06] bg-white/[0.02]",
											"cursor-pointer",
										)}
									>
										<span className={cn(
											"flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors duration-200",
											selectedOption === letter
												? "border-[#00E5C0] bg-[#00E5C0] text-[#0A1428]"
												: "border-white/[0.1] bg-white/[0.05] text-[#94A3B8] group-hover:border-[#00E5C0]/40 group-hover:bg-[#00E5C0]/10 group-hover:text-[#00E5C0]",
										)}>
											{letter}
										</span>
										<span className="text-sm text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-200">
											{t(`exampleOption${letter}`)}
										</span>
									</motion.button>
								))}

								<AnimatePresence>
									{selectedOption && (
										<motion.p
											initial={{ opacity: 0, y: -8, height: 0 }}
											animate={{ opacity: 1, y: 0, height: "auto" }}
											exit={{ opacity: 0, y: -8, height: 0 }}
											className="text-xs text-[#00E5C0] pt-1 pl-1 overflow-hidden"
										>
											✓ Answer recorded — this is a demo preview
										</motion.p>
									)}
								</AnimatePresence>
							</div>
						</motion.div>
					</motion.div>

					{/* RIGHT: Feature cards */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-60px" }}
						className="space-y-4"
					>
						{features.map(({ id, icon: Icon }, i) => (
							<motion.div
								key={id}
								custom={i}
								variants={featureVariants}
								whileHover={{
									x: 4,
									borderColor: "rgba(0,229,192,0.25)",
									backgroundColor: "rgba(0,229,192,0.03)",
									transition: { type: "spring", stiffness: 300, damping: 20 },
								}}
								className="sim-feature-card group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors duration-300"
							>
								<div className="flex items-start gap-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#00E5C0]/10 border border-[#00E5C0]/20">
										<Icon className="size-5 text-[#00E5C0]" strokeWidth={1.5} />
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
							</motion.div>
						))}
					</motion.div>
				</div>
			</div>
		</section>
	);
}
