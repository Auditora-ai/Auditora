"use client";

import { cn } from "@repo/ui";
import {
	MapPin,
	Users,
	BarChart3,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { DecisionTreeInteractive } from "./animations/DecisionTreeInteractive";

interface Feature {
	id: string;
	icon: LucideIcon;
}

const features: Feature[] = [
	{ id: "feature1", icon: MapPin },
	{ id: "feature2", icon: Users },
	{ id: "feature3", icon: BarChart3 },
];

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
						className="inline-flex items-center gap-2 rounded-full border border-[#3B8FE8]/30 bg-[#3B8FE8]/10 px-4 py-1.5 mb-6"
					>
						<Sparkles className="size-3.5 text-[#3B8FE8]" strokeWidth={2} />
						<span className="text-xs font-medium uppercase tracking-widest text-[#3B8FE8]">
							{t("badge")}
						</span>
					</motion.div>
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white text-balance"
					>
						{t("title")}
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
					{/* LEFT: DecisionTreeInteractive animation */}
					<motion.div
						initial={{ opacity: 0, x: -32 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					>
						<DecisionTreeInteractive loopMs={7500} />
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
									borderColor: "rgba(59,143,232,0.25)",
									backgroundColor: "rgba(59,143,232,0.03)",
									transition: { type: "spring", stiffness: 300, damping: 20 },
								}}
								className="sim-feature-card group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors duration-300"
							>
								<div className="flex items-start gap-4">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3B8FE8]/10 border border-[#3B8FE8]/20">
										<Icon className="size-5 text-[#3B8FE8]" strokeWidth={1.5} />
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
