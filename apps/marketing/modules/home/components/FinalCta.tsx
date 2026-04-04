"use client";

import { useState } from "react";
import { config } from "@config";
import { useTranslations } from "next-intl";
import { SplitWords } from "@shared/components/SplitWords";
import { Button, cn } from "@repo/ui";
import { motion } from "framer-motion";

export function FinalCta() {
	const t = useTranslations("home.finalCta");
	const [url, setUrl] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = url.trim();
		const targetUrl = trimmed
			? `${config.saasUrl}/scan?url=${encodeURIComponent(trimmed)}&ref=cta`
			: `${config.saasUrl}/scan?ref=cta`;
		window.open(targetUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<section className="relative overflow-hidden py-24 px-6" id="cta">
			{/* Radial teal glow */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,rgba(59,143,232,0.06),transparent_70%)]" />

			{/* Floating orbs */}
			<motion.div
				animate={{ x: [0, -15, 10, 0], y: [0, 10, -12, 0] }}
				transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
				className="pointer-events-none absolute -top-16 left-1/3 size-64 rounded-full bg-[#3B8FE8]/[0.05] blur-3xl"
			/>
			<motion.div
				animate={{ x: [0, 12, -10, 0], y: [0, -8, 14, 0] }}
				transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
				className="pointer-events-none absolute -bottom-20 right-1/3 size-80 rounded-full bg-[#3B8FE8]/[0.04] blur-3xl"
			/>

			<div className="relative mx-auto max-w-2xl text-center">
				{/* Title */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
				>
					<h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-gradient-animated">
						<SplitWords>{t("title")}</SplitWords>
					</h2>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/50"
					>
						{t("subtitle")}
					</motion.p>
				</motion.div>

				{/* Glass card with input */}
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.96 }}
					whileInView={{ opacity: 1, y: 0, scale: 1 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
					className="mt-10"
				>
					<motion.form
						onSubmit={handleSubmit}
						whileHover={{ borderColor: "rgba(59,143,232,0.2)" }}
						transition={{ duration: 0.3 }}
						className={cn(
							"mx-auto relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md",
							"sm:flex-row sm:gap-0 sm:p-2",
							"overflow-hidden",
						)}
					>
						{/* Shimmer line */}
						<div className="shimmer-line absolute inset-x-0 top-0 h-px" />

				<input
					type="text"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder={t("inputPlaceholder")}
							className={cn(
								"w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/30",
								"outline-none transition-colors focus:border-[#3B8FE8]/40 sm:flex-1",
							)}
						/>
						<Button
							type="submit"
							variant="primary"
							size="lg"
							className="w-full sm:w-auto bg-[#3B8FE8] hover:bg-[#2E7FD6] text-[#0A1428]"
						>
							{t("button")}
						</Button>
					</motion.form>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.5 }}
						className="mt-5 text-xs leading-relaxed text-white/30"
					>
						{t("note")}
					</motion.p>
				</motion.div>
			</div>
		</section>
	);
}
