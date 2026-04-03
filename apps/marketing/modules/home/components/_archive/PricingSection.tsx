"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	CheckIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { motion } from "framer-motion";

const PLAN_IDS = ["starter", "growth", "scale", "enterprise"] as const;

const PLAN_METRICS = {
	starter: { processes: "3", evaluations: "10", evaluators: "5" },
	growth: { processes: "15", evaluations: "50", evaluators: "30" },
	scale: { processes: "∞", evaluations: "250", evaluators: "150" },
	enterprise: { processes: "∞", evaluations: "∞", evaluators: "∞" },
} as const;

type MetricKey = "processes" | "evaluations" | "evaluators";

const METRIC_TRANSLATION_KEYS: Record<MetricKey, string> = {
	processes: "pricing.metricProcesses",
	evaluations: "pricing.metricEvaluations",
	evaluators: "pricing.metricEvaluators",
} as const;

const PLAN_STYLES = {
	starter: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
	growth: {
		card: "border-[#3B8FE8]/40 bg-[#3B8FE8]/[0.04] ring-1 ring-[#3B8FE8]/20",
		price: "text-gradient-teal",
		cta: "bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428]",
	},
	scale: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
	enterprise: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
} as const;

const cardVariants = {
	hidden: { opacity: 0, y: 32, scale: 0.96 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function PricingSection() {
	const t = useTranslations();

	const signupUrl = useMemo(
		() => config.saasUrl && `${String(config.saasUrl).replace(/\/$/, "")}/signup`,
		[],
	);

	return (
		<section id="pricing" className="scroll-mt-16 py-16 sm:py-20 lg:py-28 bg-[#0A1428] relative overflow-hidden">
			{/* Floating orbs */}
			<motion.div
				animate={{ x: [0, -15, 10, 0], y: [0, 12, -8, 0] }}
				transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
				className="pointer-events-none absolute -top-20 left-1/4 size-72 rounded-full bg-[#3B8FE8]/[0.04] blur-3xl"
			/>
			<motion.div
				animate={{ x: [0, 10, -15, 0], y: [0, -10, 15, 0] }}
				transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
				className="pointer-events-none absolute -bottom-32 right-1/4 size-96 rounded-full bg-[#3B8FE8]/[0.03] blur-3xl"
			/>

			<div className="container relative max-w-6xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="text-center"
				>
					<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3B8FE8]/30 bg-[#3B8FE8]/10 px-4 py-1.5">
						<ZapIcon className="size-3.5 text-[#3B8FE8]" strokeWidth={2} />
						<span className="badge-pulse text-xs font-medium uppercase tracking-widest text-[#3B8FE8]">{t("pricing.badge")}</span>
					</div>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white max-w-3xl mx-auto text-center leading-tight">
						{t("pricing.title")}
					</h2>
					<p className="mt-4 text-[#94A3B8] text-sm sm:text-base max-w-xl mx-auto text-center leading-relaxed">
						{t("pricing.subtitle")}
					</p>
				</motion.div>

				{/* Plans grid */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start"
				>
					{PLAN_IDS.map((planId, index) => {
						const metrics = PLAN_METRICS[planId];
						const styles = PLAN_STYLES[planId];
						const isRecommended = planId === "growth";
						const isEnterprise = planId === "enterprise";

						const features = t.raw(`pricing.products.${planId}.features`) as Record<string, string>;
						const featureList = Object.values(features);

						return (
							<motion.div
								key={planId}
								custom={index}
								variants={cardVariants}
								whileHover={{
									y: -6,
									transition: { type: "spring", stiffness: 300, damping: 20 },
								}}
								className={cn(
									"relative rounded-2xl border p-6 lg:p-7 transition-all",
									styles.card,
									isRecommended && "lg:-mt-3 lg:mb-3",
								)}
							>
								{/* Animated glow ring for recommended plan */}
								{isRecommended && (
									<>
										<div className="pointer-events-none absolute inset-0 rounded-2xl border-glow" />
										<motion.div
											animate={{
												boxShadow: [
													"0 0 15px 2px rgba(59, 143, 232, 0.15)",
													"0 0 25px 6px rgba(59, 143, 232, 0.25)",
													"0 0 15px 2px rgba(59, 143, 232, 0.15)",
												],
											}}
											transition={{
												duration: 3,
												repeat: Infinity,
												ease: "easeInOut",
											}}
											className="pointer-events-none absolute -inset-[1px] rounded-2xl"
										/>
									</>
								)}

								{isRecommended && (
									<motion.div
										initial={{ opacity: 0, y: -8, scale: 0.9 }}
										whileInView={{ opacity: 1, y: 0, scale: 1 }}
										viewport={{ once: true }}
										transition={{ duration: 0.4, delay: 0.5 }}
										className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3B8FE8] px-3.5 py-1 text-xs font-semibold text-[#0A1428]"
									>
										{t("pricing.recommended")}
									</motion.div>
								)}

								<div className="relative flex flex-col h-full">
									<h3 className="text-lg font-semibold text-white">
										{t(`pricing.products.${planId}.title`)}
									</h3>
									<p className="mt-1.5 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
										{t(`pricing.products.${planId}.description`)}
									</p>

									<div className="mt-5 flex items-baseline gap-4">
										<span className={cn(
											"font-display text-3xl sm:text-4xl font-bold tracking-tight",
											styles.price,
										)}>
											{t(`pricing.products.${planId}.price`)}
										</span>
										<span className="text-sm text-[#64748B]">
											{t(`pricing.products.${planId}.unit`)}
										</span>
									</div>

									<div className="mt-4 flex flex-wrap gap-2">
										{(Object.entries(metrics) as [MetricKey, string][]).map(([key, val]) => (
											<span key={key} className="inline-flex items-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-[#94A3B8]">
												{val} {t(METRIC_TRANSLATION_KEYS[key])}
											</span>
										))}
									</div>

									<ul className="mt-6 flex-1 space-y-2.5">
										{featureList.map((feature, idx) => (
											<li key={idx} className="flex items-start gap-2.5 text-sm">
												<CheckIcon className="mt-0.5 size-4 shrink-0 text-[#3B8FE8]" />
												<span className="text-white/70 leading-snug">{feature}</span>
											</li>
										))}
									</ul>

									<div className="mt-6">
										{isEnterprise ? (
											<Button variant="secondary" className={cn("w-full", styles.cta)} asChild>
												<a href="mailto:sales@auditora.ai?subject=Auditora.ai Enterprise">
													{t("pricing.contactSales")}
													<ArrowRightIcon className="ml-2 size-4" />
												</a>
											</Button>
										) : (
											<Button
												variant={isRecommended ? "primary" : "secondary"}
												className={cn("w-full", styles.cta)}
												asChild
											>
												<a href={signupUrl ?? "#"}>
													{t("pricing.getStarted")}
													<ArrowRightIcon className="ml-2 size-4" />
												</a>
											</Button>
										)}
									</div>
								</div>
							</motion.div>
						);
					})}
				</motion.div>

				{/* Trial note */}
				<motion.p
					initial={{ opacity: 0, y: 12 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-20px" }}
					transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mt-8 text-center text-sm text-[#64748B]"
				>
					{t("pricing.trialNote")}
				</motion.p>
			</div>
		</section>
	);
}
