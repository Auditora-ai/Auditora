"use client";

import { useTranslations } from "next-intl";
import { SplitWords } from "@shared/components/SplitWords";
import { motion } from "framer-motion";

const steps = [
	{ number: 1, titleKey: "step1.title", descriptionKey: "step1.description" },
	{ number: 2, titleKey: "step2.title", descriptionKey: "step2.description" },
	{ number: 3, titleKey: "step3.title", descriptionKey: "step3.description" },
] as const;

const stepVariants = {
	hidden: { opacity: 0, y: 24 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function HowItWorks() {
	const t = useTranslations("home.howItWorks");

	return (
		<section className="relative py-24 px-6 bg-grid-dense" id="how-it-works">
			<div className="mx-auto max-w-5xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mb-16 text-center"
				>
					<span className="mb-4 inline-block rounded-full border border-[#00E5C0]/20 bg-[#00E5C0]/5 px-4 py-1.5 text-xs font-medium text-[#00E5C0]">
						{t("badge")}
					</span>
					<h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
						<SplitWords>{t("title")}</SplitWords>
					</h2>
				</motion.div>

				{/* Steps */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="flex flex-col items-center gap-12 md:flex-row md:gap-0"
				>
					{steps.map((step, index) => (
						<motion.div key={step.number} custom={index} variants={stepVariants} className="flex items-center md:flex-1">
							<div className="flex flex-col items-center text-center md:w-full">
								<motion.div
									whileHover={{ scale: 1.1, borderColor: "rgba(0,229,192,0.5)" }}
									transition={{ type: "spring", stiffness: 400, damping: 20 }}
									className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00E5C0]/30 bg-[#00E5C0]/10 text-lg font-bold text-[#00E5C0]"
								>
									{step.number}
								</motion.div>
								<h3 className="mt-5 text-lg font-semibold text-white">
									{t(step.titleKey)}
								</h3>
								<p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/50">
									{t(step.descriptionKey)}
								</p>
							</div>

							{index < steps.length - 1 && (
								<motion.div
									initial={{ scaleX: 0 }}
									whileInView={{ scaleX: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8, delay: 0.5 + index * 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
									className="mx-6 hidden flex-shrink-0 md:block relative h-px w-16 bg-white/10 origin-left"
								/>
							)}

							{index < steps.length - 1 && (
								<div className="flex flex-col items-center md:hidden">
									<motion.div
										initial={{ scaleY: 0 }}
										whileInView={{ scaleY: 1 }}
										viewport={{ once: true }}
										transition={{ duration: 0.6, delay: 0.5 + index * 0.2 }}
										className="h-8 w-px bg-white/10 origin-top"
									/>
									<div className="h-0 w-0 border-l-[5px] border-l-white/20 border-t-[6px] border-t-transparent border-r-[5px] border-r-transparent" />
								</div>
							)}
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
