"use client";

import { AlertTriangleIcon, FileXIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BeforeAfterComparison } from "./animations/BeforeAfterComparison";

const painCards = [
	{ id: "pain1", icon: ClockIcon },
	{ id: "pain2", icon: FileXIcon },
	{ id: "pain3", icon: AlertTriangleIcon },
] as const;

function AnimatedCounter({ target, suffix = "%" }: { target: number; suffix?: string }) {
	const [display, setDisplay] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const hasAnimated = useRef(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !hasAnimated.current) {
					hasAnimated.current = true;
					const motionVal = useMotionValue(0);
					const rounded = useTransform(motionVal, (v) => Math.round(v));

					const unsubscribe = rounded.on("change", (v) => setDisplay(v));
					animate(motionVal, target, {
						duration: 2.2,
						ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
					});

					// Cleanup after animation
					setTimeout(() => {
						unsubscribe();
						motionVal.set(target);
					}, 3000);
				}
			},
			{ threshold: 0.3 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [target]);

	return <span ref={ref}>{display}{suffix}</span>;
}

const cardVariants = {
	hidden: { opacity: 0, y: 28 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function ProblemSection() {
	const t = useTranslations();

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#111827] relative overflow-hidden">
			{/* Subtle gradient */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,229,192,0.04),transparent)]" />

			<div className="container relative max-w-6xl">
				{/* Header */}
				<div className="mb-10 sm:mb-14 text-center">
					<motion.span
						initial={{ opacity: 0, y: -12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className={cn(
							"badge-pulse inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6",
						)}
					>
						{t("home.problem.badge")}
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white max-w-3xl mx-auto leading-tight"
					>
						{t("home.problem.title")}
					</motion.h2>
				</div>

				{/* Large Stat */}
				<div className="text-center mb-14 sm:mb-20">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
						className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-[#00E5C0] leading-none"
					>
						<AnimatedCounter target={73} />
					</motion.div>
					<motion.p
						initial={{ opacity: 0, y: 12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="mt-4 text-base sm:text-lg text-[#94A3B8] max-w-xl mx-auto leading-relaxed"
					>
						{t("home.problem.statLabel")}
					</motion.p>
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.5 }}
						className="mt-2 text-xs text-[#64748B]"
					>
						{t("home.problem.statSource")}
					</motion.p>
				</div>

				{/* Before / After Comparison Animation */}
				<motion.div
					initial={{ opacity: 0, y: 32 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
					className="mb-12 sm:mb-16"
				>
					<BeforeAfterComparison />
				</motion.div>

				{/* Pain Point Cards */}
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-60px" }}
					className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
				>
					{painCards.map((card, i) => {
						const Icon = card.icon;
						return (
							<motion.div
								key={card.id}
								custom={i}
								variants={cardVariants}
								whileHover={{ y: -6, borderColor: "rgba(0,229,192,0.2)", transition: { type: "spring", stiffness: 300, damping: 20 } }}
								className="card-hover rounded-2xl p-5 sm:p-6 lg:p-8 border border-white/10 bg-white/5 backdrop-blur-sm"
							>
								<div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#00E5C0]/15">
									<Icon className="size-5 text-[#00E5C0]" strokeWidth={1.5} />
								</div>
								<h3 className="text-lg font-semibold mb-3 text-white">
									{t(`home.problem.${card.id}.title`)}
								</h3>
								<p className="text-sm leading-relaxed text-[#94A3B8]">
									{t(`home.problem.${card.id}.description`)}
								</p>
							</motion.div>
						);
					})}
				</motion.div>
			</div>
		</section>
	);
}
