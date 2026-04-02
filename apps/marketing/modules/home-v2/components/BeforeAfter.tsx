"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui";
import { AlertTriangle, TrendingDown, Clock, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { AnimatedCounter } from "../../home/components/animations/AnimatedCounter";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
	hidden: { opacity: 0, y: 24 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.12, ease: EASE },
	}),
};

const beforeItems = [
	{ icon: AlertTriangle, metric: 12, suffix: "", label: "operational errors / month" },
	{ icon: TrendingDown, metric: 45, suffix: "%", label: "process alignment" },
	{ icon: Clock, metric: 3, suffix: " weeks", label: "onboarding time" },
];

const afterItems = [
	{ icon: CheckCircle, metric: 3, suffix: "", label: "errors / month" },
	{ icon: TrendingUp, metric: 82, suffix: "%", label: "process alignment" },
	{ icon: Zap, metric: 1, suffix: " week", label: "onboarding time" },
];

export function BeforeAfter() {
	const t = useTranslations("home.beforeAfter");

	return (
		<section className="relative py-24 lg:py-32 overflow-hidden">
			{/* Background glow */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(0,229,192,0.04),transparent)]" />

			<div className="max-w-6xl mx-auto px-6">
				{/* Story intro */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.4 }}
					className="text-center mb-16"
				>
					<motion.p
						custom={0}
						variants={fadeUp}
						className="text-[#00E5C0] text-sm font-semibold uppercase tracking-widest mb-4"
					>
						{t("label")}
					</motion.p>
					<motion.h2
						custom={1}
						variants={fadeUp}
						className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight"
					>
						{t("title")}
					</motion.h2>
					<motion.p
						custom={2}
						variants={fadeUp}
						className="mt-6 text-lg text-white/60 max-w-2xl mx-auto"
					>
						{t("story")}
					</motion.p>
				</motion.div>

				{/* Before / After columns */}
				<div className="grid md:grid-cols-2 gap-6 lg:gap-8">
					{/* BEFORE column */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, ease: EASE }}
						className={cn(
							"relative rounded-2xl border p-8",
							"bg-red-500/[0.03] border-red-500/20",
							"backdrop-blur-sm"
						)}
					>
						<div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(239,68,68,0.06),transparent)] pointer-events-none" />
						<div className="flex items-center gap-2 mb-8">
							<div className="size-3 rounded-full bg-red-500/80" />
							<span className="text-xs font-semibold uppercase tracking-widest text-red-400">
								{t("beforeLabel")}
							</span>
						</div>
						<div className="space-y-6">
							{beforeItems.map((item, i) => {
								const Icon = item.icon;
								return (
									<motion.div
										key={item.label}
										custom={i}
										variants={fadeUp}
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true }}
										className="flex items-center gap-4"
									>
										<div className="flex-shrink-0 size-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
											<Icon className="size-5 text-red-400" />
										</div>
										<div>
											<span className="text-2xl font-bold text-red-400">
												<AnimatedCounter target={item.metric} suffix={item.suffix} />
											</span>
											<p className="text-sm text-white/50">{t(`before.${i}`)}</p>
										</div>
									</motion.div>
								);
							})}
						</div>
					</motion.div>

					{/* AFTER column */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.7, ease: EASE }}
						className={cn(
							"relative rounded-2xl border p-8",
							"bg-[#00E5C0]/[0.03] border-[#00E5C0]/20",
							"backdrop-blur-sm"
						)}
					>
						<div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,229,192,0.06),transparent)] pointer-events-none" />
						<div className="flex items-center gap-2 mb-8">
							<div className="size-3 rounded-full bg-[#00E5C0]/80" />
							<span className="text-xs font-semibold uppercase tracking-widest text-[#00E5C0]">
								{t("afterLabel")}
							</span>
						</div>
						<div className="space-y-6">
							{afterItems.map((item, i) => {
								const Icon = item.icon;
								return (
									<motion.div
										key={item.label}
										custom={i}
										variants={fadeUp}
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true }}
										className="flex items-center gap-4"
									>
										<div className="flex-shrink-0 size-12 rounded-xl bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center">
											<Icon className="size-5 text-[#00E5C0]" />
										</div>
										<div>
											<span className="text-2xl font-bold text-[#00E5C0]">
												<AnimatedCounter target={item.metric} suffix={item.suffix} />
											</span>
											<p className="text-sm text-white/50">{t(`after.${i}`)}</p>
										</div>
									</motion.div>
								);
							})}
						</div>
					</motion.div>
				</div>

				{/* Bottom savings callout */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
					className="mt-10 text-center"
				>
					<div className="inline-flex items-center gap-3 rounded-full bg-[#00E5C0]/10 border border-[#00E5C0]/20 px-6 py-3">
						<span className="text-3xl font-bold text-[#00E5C0]">
							<AnimatedCounter target={200} prefix="$" suffix="K" />
						</span>
						<span className="text-sm text-white/70">{t("savings")}</span>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
