"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BookOpen, Cpu, RefreshCw } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const values = [
	{ id: "value1", icon: BookOpen },
	{ id: "value2", icon: Cpu },
	{ id: "value3", icon: RefreshCw },
];

const cardVariants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease },
	}),
};

export function AboutClient({ saasUrl }: { saasUrl?: string }) {
	const t = useTranslations("about");

	return (
		<div data-landing className="dark bg-gradient-to-b from-[#050A15] via-[#0A1428] to-[#0F2847] text-slate-50">
			{/* Hero */}
			<section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
				<div className="absolute inset-0 bg-gradient-to-b from-[#3B8FE8]/5 to-transparent" />
				<div className="container relative max-w-4xl text-center">
					<motion.span
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease }}
						className="inline-flex items-center rounded-full bg-[#3B8FE8]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#3B8FE8] mb-6"
					>
						{t("heroLabel")}
					</motion.span>
					<motion.h1
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1, ease }}
						className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
					>
						{t("title")}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2, ease }}
						className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
					>
						{t("subtitle")}
					</motion.p>
				</div>
			</section>

			{/* Why we exist */}
			<section className="py-16 sm:py-24 bg-[#111827]">
				<div className="container max-w-4xl">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, ease }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-6"
					>
						{t("section1Title")}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, delay: 0.1, ease }}
						className="text-white/60 text-base sm:text-lg leading-relaxed"
					>
						{t("section1Text")}
					</motion.p>
				</div>
			</section>

			{/* Our approach */}
			<section className="py-16 sm:py-24">
				<div className="container max-w-4xl">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, ease }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-6"
					>
						{t("section2Title")}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, delay: 0.1, ease }}
						className="text-white/60 text-base sm:text-lg leading-relaxed"
					>
						{t("section2Text")}
					</motion.p>
				</div>
			</section>

			{/* Values grid */}
			<section className="py-16 sm:py-24 bg-[#111827]">
				<div className="container max-w-5xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-40px" }}
						className="grid grid-cols-1 sm:grid-cols-3 gap-5"
					>
						{values.map((value, i) => {
							const Icon = value.icon;
							return (
								<motion.div
									key={value.id}
									custom={i}
									variants={cardVariants}
									className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8 hover:border-[#3B8FE8]/30 transition-colors"
								>
									<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#3B8FE8]/10 text-[#3B8FE8] mb-4">
										<Icon className="w-6 h-6" />
									</div>
									<h3 className="font-display text-lg font-semibold mb-2">
										{t(`${value.id}Title`)}
									</h3>
									<p className="text-white/50 text-sm leading-relaxed">
										{t(`${value.id}Text`)}
									</p>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-16 sm:py-24">
				<div className="container max-w-3xl text-center">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, ease }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-8"
					>
						{t("ctaTitle")}
					</motion.h2>
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, delay: 0.1, ease }}
					>
						<a
							href={saasUrl ?? "/#pricing"}
							className="inline-flex items-center justify-center rounded-full bg-[#3B8FE8] px-8 py-3.5 text-sm font-semibold text-[#0A1428] hover:bg-[#3B8FE8]/90 transition-colors"
						>
							{t("ctaButton")}
						</a>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
