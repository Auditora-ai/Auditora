"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui";
import { Crown, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Profile {
	id: string;
	icon: LucideIcon;
	accentColor: string;
}

const profiles: Profile[] = [
	{
		id: "ceo",
		icon: Crown,
		accentColor: "#00E5C0",
	},
	{
		id: "ops",
		icon: Settings,
		accentColor: "#38BDF8",
	},
	{
		id: "hr",
		icon: Users,
		accentColor: "#A78BFA",
	},
];

function QuoteCard({ profile, index }: { profile: Profile; index: number }) {
	const t = useTranslations("home.whoItsFor");
	const Icon = profile.icon;

	return (
		<motion.div
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.6, delay: index * 0.15, ease: EASE }}
			className={cn(
				"group relative rounded-2xl border p-8",
				"bg-white/[0.03] border-white/10 backdrop-blur-sm",
				"hover:border-white/20 transition-colors duration-500"
			)}
		>
			{/* Subtle glow */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				style={{
					background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${profile.accentColor}08, transparent)`,
				}}
			/>

			{/* Quote mark */}
			<div className="relative">
				<span
					className="absolute -top-2 -left-1 text-5xl font-serif leading-none opacity-20"
					style={{ color: profile.accentColor }}
				>
					&ldquo;
				</span>
				<blockquote className="relative text-xl md:text-2xl font-medium text-white leading-relaxed pl-6 mb-6">
					{t(`${profile.id}.quote`)}
				</blockquote>
			</div>

			{/* Attribution */}
			<div className="flex items-center gap-4 pt-4 border-t border-white/10">
				<div
					className={cn(
						"flex items-center justify-center size-11 rounded-full border"
					)}
					style={{
						backgroundColor: `${profile.accentColor}15`,
						borderColor: `${profile.accentColor}30`,
					}}
				>
					<Icon className="size-5" style={{ color: profile.accentColor }} />
				</div>
				<div>
					<p className="text-sm font-semibold text-white">
						{t(`${profile.id}.role`)}
					</p>
					<p className="text-xs text-white/40">
						{t(`${profile.id}.company`)}
					</p>
				</div>
			</div>

			{/* Pain point tag */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: EASE }}
				className="mt-6"
			>
				<span
					className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border"
					style={{
						color: profile.accentColor,
						backgroundColor: `${profile.accentColor}10`,
						borderColor: `${profile.accentColor}20`,
					}}
				>
					{t(`${profile.id}.pain`)}
				</span>
			</motion.div>
		</motion.div>
	);
}

export function WhoItsFor() {
	const t = useTranslations("home.whoItsFor");

	return (
		<section className="relative py-24 lg:py-32">
			<div className="max-w-6xl mx-auto px-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.4 }}
					transition={{ duration: 0.6, ease: EASE }}
					className="text-center mb-16"
				>
					<p className="text-[#00E5C0] text-sm font-semibold uppercase tracking-widest mb-4">
						{t("label")}
					</p>
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight">
						{t("title")}
					</h2>
					<p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
						{t("subtitle")}
					</p>
				</motion.div>

				{/* Quote cards grid — all visible, no tabs */}
				<div className="grid md:grid-cols-3 gap-6">
					{profiles.map((profile, i) => (
						<QuoteCard key={profile.id} profile={profile} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
