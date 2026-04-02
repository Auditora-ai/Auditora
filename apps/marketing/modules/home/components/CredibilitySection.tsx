"use client";

import { cn } from "@repo/ui";
import { AwardIcon, EyeIcon, LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

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
			<div className="container max-w-5xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mb-10 sm:mb-14 max-w-3xl mx-auto text-center"
				>
					<small className="font-medium text-xs uppercase tracking-widest text-[#00E5C0] mb-4 block">
						{t("home.credibility.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.credibility.title")}
					</h2>
				</motion.div>

				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
				>
					{pillars.map((pillar, i) => {
						const Icon = pillar.icon;
						return (
							<motion.div
								key={pillar.id}
								custom={i}
								variants={cardVariants}
								whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
								className="text-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-colors duration-300 hover:border-[#00E5C0]/20"
							>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 20 }}
									className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#00E5C0]/15 text-[#00E5C0] mx-auto mb-5"
								>
									<Icon className="size-6" strokeWidth={1.5} />
								</motion.div>
								<h3 className="text-base font-semibold text-white mb-3">
									{t(`home.credibility.${pillar.id}.title`)}
								</h3>
								<p className="text-sm text-[#94A3B8] leading-relaxed">
									{t(`home.credibility.${pillar.id}.description`)}
								</p>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}
