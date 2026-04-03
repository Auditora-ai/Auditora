"use client";

import { cn } from "@repo/ui";
import { AwardIcon, EyeIcon, LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { RiskRadarChart } from "./animations/RiskRadarChart";

const pillars = [
	{ id: "pillar1", icon: AwardIcon },
	{ id: "pillar2", icon: EyeIcon },
	{ id: "pillar3", icon: LockIcon },
] as const;

const cardVariants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function CredibilitySection() {
	const t = useTranslations();

	return (
		<section id="methodology" className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-6xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mb-10 sm:mb-14 max-w-3xl mx-auto text-center"
				>
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.credibility.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.credibility.title")}
					</h2>
				</motion.div>

				{/* Two-column layout: pillars + radar chart */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
					{/* Left: Pillar Cards */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-40px" }}
						className="grid grid-cols-1 gap-5"
					>
						{pillars.map((pillar, i) => {
							const Icon = pillar.icon;
							return (
								<motion.div
									key={pillar.id}
									custom={i}
									variants={cardVariants}
									whileHover={{ x: 4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
									className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors duration-300 hover:border-[#3B8FE8]/20"
								>
									<motion.div
										whileHover={{ scale: 1.1, rotate: 5 }}
										transition={{ type: "spring", stiffness: 400, damping: 20 }}
										className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-[#3B8FE8]/15 text-[#3B8FE8]"
									>
										<Icon className="size-5" strokeWidth={1.5} />
									</motion.div>
									<div>
										<h3 className="text-base font-semibold text-white mb-1.5">
											{t(`home.credibility.${pillar.id}.title`)}
										</h3>
										<p className="text-sm text-[#94A3B8] leading-relaxed">
											{t(`home.credibility.${pillar.id}.description`)}
										</p>
									</div>
								</motion.div>
							);
						})}
					</motion.div>

					{/* Right: Risk Radar Chart */}
					<motion.div
						initial={{ opacity: 0, x: 32 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="flex flex-col items-center gap-4"
					>
						<div className="hidden md:block"><RiskRadarChart /></div>
						<p className="text-center text-xs text-white/30 max-w-[260px] leading-relaxed">
							{t("home.credibility.radarCaption")}
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
