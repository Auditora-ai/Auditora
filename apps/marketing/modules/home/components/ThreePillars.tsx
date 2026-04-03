"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui";
import { Mic, FileText, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Pillar {
	id: string;
	icon: LucideIcon;
	accentColor: string;
	glowColor: string;
	number: string;
}

const pillars: Pillar[] = [
	{
		id: "capture",
		icon: Mic,
		accentColor: "#3B8FE8",
		glowColor: "rgba(59,143,232,0.08)",
		number: "01",
	},
	{
		id: "document",
		icon: FileText,
		accentColor: "#38BDF8",
		glowColor: "rgba(56,189,248,0.08)",
		number: "02",
	},
	{
		id: "evaluate",
		icon: GraduationCap,
		accentColor: "#A78BFA",
		glowColor: "rgba(167,139,250,0.08)",
		number: "03",
	},
];

function PillarCard({ pillar, index }: { pillar: Pillar; index: number }) {
	const t = useTranslations("home.pillars");
	const Icon = pillar.icon;

	return (
		<motion.div
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-60px" }}
			transition={{ duration: 0.7, delay: index * 0.15, ease: EASE }}
			className={cn(
				"group relative w-full rounded-2xl border p-8 md:p-10",
				"bg-white/[0.03] border-white/10 backdrop-blur-sm",
				"hover:border-white/20 transition-colors duration-500"
			)}
		>
			{/* Glow on hover */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				style={{
					background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${pillar.glowColor}, transparent)`,
				}}
			/>

			<div className="relative flex flex-col md:flex-row md:items-start gap-6">
				{/* Number + Icon */}
				<div className="flex-shrink-0 flex items-start gap-4">
					<span
						className="text-5xl md:text-6xl font-bold opacity-10"
						style={{ color: pillar.accentColor }}
					>
						{pillar.number}
					</span>
					<div
						className={cn(
							"flex items-center justify-center size-14 rounded-xl border",
							"mt-2"
						)}
						style={{
							backgroundColor: `${pillar.accentColor}15`,
							borderColor: `${pillar.accentColor}30`,
						}}
					>
						<Icon className="size-7" style={{ color: pillar.accentColor }} />
					</div>
				</div>

				{/* Content */}
				<div className="flex-1">
					<h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
						{t(`${pillar.id}.title`)}
					</h3>
					<p
						className="text-lg font-medium mb-2"
						style={{ color: pillar.accentColor }}
					>
						{t(`${pillar.id}.hook`)}
					</p>
					<p className="text-base text-white/50 leading-relaxed max-w-xl">
						{t(`${pillar.id}.description`)}
					</p>
				</div>
			</div>

			{/* Bottom accent line */}
			<motion.div
				className="absolute bottom-0 left-8 right-8 h-px"
				style={{ backgroundColor: pillar.accentColor }}
				initial={{ scaleX: 0, opacity: 0 }}
				whileInView={{ scaleX: 1, opacity: 0.3 }}
				viewport={{ once: true }}
				transition={{ duration: 1, delay: 0.5 + index * 0.15, ease: EASE }}
			/>
		</motion.div>
	);
}

export function ThreePillars() {
	const t = useTranslations("home.pillars");

	return (
		<section className="relative py-24 lg:py-32">
			<div className="max-w-4xl mx-auto px-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.4 }}
					transition={{ duration: 0.6, ease: EASE }}
					className="text-center mb-16"
				>
					<p className="text-[#3B8FE8] text-sm font-semibold uppercase tracking-widest mb-4">
						{t("label")}
					</p>
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight">
						{t("title")}
					</h2>
					<p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
						{t("subtitle")}
					</p>
				</motion.div>

				{/* Vertical pillar stack */}
				<div className="flex flex-col gap-6">
					{pillars.map((pillar, i) => (
						<PillarCard key={pillar.id} pillar={pillar} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
