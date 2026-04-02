"use client";

import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { WorkflowEndToEnd } from "./animations/WorkflowEndToEnd";

const steps = [
	{ id: "step1", number: "01", titleKey: "title", descKey: "description" },
	{ id: "step2", number: "02", titleKey: "title", descKey: "description" },
	{ id: "step3", number: "03", titleKey: "title", descKey: "description" },
	{ id: "step4", number: "04", titleKey: "title", descKey: "description" },
	{ id: "step5", number: "05", titleKey: "title", descKey: "description" },
	{ id: "step6", number: "06", titleKey: "title", descKey: "description" },
] as const;

const cardVariants = {
	hidden: { opacity: 0, y: 28, scale: 0.97 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function ProductFlow() {
	const t = useTranslations("home.productFlow");

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<motion.span
						initial={{ opacity: 0, y: -12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className={cn(
							"badge-pulse inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6",
						)}
					>
						{t("badge")}
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white"
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

				{/* Workflow Animation */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mb-12 sm:mb-14 max-w-2xl mx-auto hidden md:block"
					aria-hidden="true"
				>
					<WorkflowEndToEnd />
				</motion.div>

				{/* Steps Grid */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
				>
					{steps.map((step, i) => (
						<motion.div
							key={step.id}
							custom={i}
							variants={cardVariants}
							whileHover={{
								y: -6,
								borderColor: step.id === "step5" ? "rgba(0,229,192,0.6)" : "rgba(0,229,192,0.25)",
								transition: { type: "spring", stiffness: 300, damping: 20 },
							}}
							className={cn(
								"relative rounded-2xl border p-5 sm:p-6 lg:p-8 transition-colors duration-300",
								step.id === "step5"
									? "border-glow border-[#00E5C0]/50 bg-[#00E5C0]/5 shadow-lg shadow-[#00E5C0]/5"
									: "border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/[0.07]",
							)}
						>
							<span className={cn(
								"font-display text-4xl sm:text-5xl font-bold leading-none",
								step.id === "step5" ? "text-[#00E5C0]" : "text-white/10",
							)}>
								{step.number}
							</span>
							<h3 className="mt-4 text-lg font-semibold text-white">
								{t(`${step.id}.${step.titleKey}`)}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
								{t(`${step.id}.${step.descKey}`)}
							</p>
							{step.id === "step5" && (
								<span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#00E5C0]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00E5C0] badge-pulse">
									★ {t("starFeature")}
								</span>
							)}
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
