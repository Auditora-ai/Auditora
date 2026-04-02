"use client";

import { cn } from "@repo/ui";
import {
	Scan,
	GitBranch,
	Shield,
	MessageSquare,
	FileText,
	Play,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { FmeaHeatmap } from "./animations/FmeaHeatmap";
import { SopGeneration } from "./animations/SopGeneration";
import { BpmnRealTimeBuilder } from "./animations/BpmnRealTimeBuilder";

interface Feature {
	id: string;
	icon: LucideIcon;
	span: string;
	highlighted?: boolean;
}

const features: Feature[] = [
	{ id: "feature1", icon: Scan, span: "md:col-span-2" },
	{ id: "feature2", icon: GitBranch, span: "md:col-span-1" },
	{ id: "feature3", icon: Shield, span: "md:col-span-1" },
	{ id: "feature4", icon: MessageSquare, span: "md:col-span-1" },
	{ id: "feature5", icon: FileText, span: "md:col-span-1" },
	{ id: "feature6", icon: Play, span: "md:col-span-2", highlighted: true },
];

const cardVariants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function FeaturesBento() {
	const t = useTranslations("home.features");

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#111827]">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<motion.span
						initial={{ opacity: 0, y: -12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6"
					>
						{t("badge")}
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white text-gradient-teal"
					>
						{t("title")}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="mt-4 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
					>
						{t("subtitle")}
					</motion.p>
				</div>

				{/* Bento Grid */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
				>
					{features.map((feature, i) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.id}
								custom={i}
								variants={cardVariants}
								whileHover={{
									y: -6,
									borderColor: feature.highlighted ? "rgba(0,229,192,0.7)" : "rgba(0,229,192,0.3)",
									transition: { type: "spring", stiffness: 300, damping: 20 },
								}}
								className={cn(
									"rounded-2xl border p-5 sm:p-6 lg:p-8 transition-colors duration-300",
									feature.span,
									feature.highlighted
										? "border-glow border-[#00E5C0]/50 bg-[#00E5C0]/5 backdrop-blur-sm shadow-lg shadow-[#00E5C0]/5"
										: "border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.07]",
								)}
							>
								<div className="flex items-center gap-3 mb-3">
									<div className={cn(
										"flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
										feature.highlighted ? "bg-[#00E5C0]/20" : "bg-[#00E5C0]/15",
									)}>
										<Icon className="size-5 text-[#00E5C0]" strokeWidth={1.5} />
									</div>
									<h3 className="font-display text-base sm:text-lg font-semibold text-white">
										{t(`${feature.id}.title`)}
									</h3>
								</div>
								<p className="text-sm text-[#94A3B8] leading-relaxed">
									{t(`${feature.id}.description`)}
								</p>
					{feature.id === "feature2" && (
								<div className="mt-5 hidden sm:block">
									<BpmnRealTimeBuilder loopMs={8000} />
								</div>
							)}
							{feature.id === "feature3" && (
								<div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 max-w-[280px]">
									<div className="hidden sm:block"><FmeaHeatmap className="opacity-80" /></div>
								</div>
							)}
								{feature.id === "feature6" && (
									<div className="mt-5">
										<div className="hidden sm:block"><SopGeneration loopMs={6000} /></div>
									</div>
								)}
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}
