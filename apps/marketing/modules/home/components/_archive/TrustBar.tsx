"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimatedCounter } from "./animations/AnimatedCounter";

/* ─── Data ─────────────────────────────────────────────── */

const metrics = [
	{ target: 500, suffix: "+", labelKey: "metric1.label" },
	{ target: 8, suffix: "x", labelKey: "metric2.label" },
	{ target: 2, suffix: "min", labelKey: "metric3.label" },
	{ target: 73, suffix: "%", labelKey: "metric4.label" },
] as const;

const frameworks = [
	{ name: "SIPOC", standard: "Six Sigma" },
	{ name: "BPMN 2.0", standard: "OMG Standard" },
	{ name: "FMEA", standard: "ISO 17359" },
	{ name: "ISO 31000", standard: "Risk Management" },
] as const;

/* ─── Animations ───────────────────────────────────────── */

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.1 },
	},
};

const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			delay: i * 0.08,
			ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
		},
	}),
};

const badgeFadeUp = {
	hidden: { opacity: 0, y: 16 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			delay: 0.3 + i * 0.08,
			ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
		},
	}),
};

/* ─── Component ────────────────────────────────────────── */

export function TrustBar() {
	const t = useTranslations("home.trustBar");

	return (
		<section
			id="trust"
			className="relative overflow-hidden border-y border-white/[0.06] bg-[#0A1428] py-16 px-6"
		>
			{/* Subtle gradient glow behind metrics */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,143,232,0.06),transparent)]"
			/>

			<div className="relative mx-auto max-w-5xl">
				{/* ── Metrics Row ──────────────────────────── */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-60px" }}
					variants={containerVariants}
					className="grid grid-cols-2 gap-8 sm:grid-cols-4"
				>
					{metrics.map((metric, i) => (
						<motion.div
							key={metric.labelKey}
							variants={fadeUp}
							custom={i}
							className="flex flex-col items-center text-center"
						>
							<AnimatedCounter
								target={metric.target}
								suffix={metric.suffix}
								duration={2.2}
								className="text-3xl font-bold tracking-tight text-[#3B8FE8] sm:text-4xl"
							/>
							<span className="mt-2 text-sm leading-snug text-white/60">
								{t(metric.labelKey)}
							</span>
						</motion.div>
					))}
				</motion.div>

				{/* ── Divider ──────────────────────────────── */}
				<motion.div
					initial={{ scaleX: 0, opacity: 0 }}
					whileInView={{ scaleX: 1, opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
					className="mx-auto my-10 h-px w-full max-w-md origin-center bg-gradient-to-r from-transparent via-white/10 to-transparent"
				/>

				{/* ── Framework Badges ─────────────────────── */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-40px" }}
					className="flex flex-wrap items-center justify-center gap-3"
				>
					{frameworks.map((fw, i) => (
						<motion.div
							key={fw.name}
							variants={badgeFadeUp}
							custom={i}
							whileHover={{
								scale: 1.04,
								borderColor: "rgba(59,143,232,0.25)",
							}}
							transition={{ type: "spring", stiffness: 400, damping: 25 }}
							className="flex flex-col items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm cursor-default"
						>
							<span className="text-sm font-semibold text-white/80">
								{fw.name}
							</span>
							<span className="mt-0.5 text-[11px] leading-tight text-white/40">
								{fw.standard}
							</span>
						</motion.div>
					))}
				</motion.div>

				{/* ── Subtitle ─────────────────────────────── */}
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ delay: 0.6, duration: 0.6 }}
					className="mt-8 text-center text-sm text-white/40"
				>
					{t("subtitle")}
				</motion.p>
			</div>
		</section>
	);
}
