"use client";

import { config } from "@config";
import { Button, cn } from "@repo/ui";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";

const FADE_UP = {
	hidden: { opacity: 0, y: 20 },
	visible: (delay: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
	}),
};

export function HeroSection() {
	const t = useTranslations("home.hero");
	const [url, setUrl] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const handleSubmit = useCallback(() => {
		let finalUrl = url.trim();
		if (!finalUrl) {
			window.location.href = `${config.saasUrl}/scan?ref=hero`;
			return;
		}
		finalUrl = finalUrl.replace(/^(https?:\/\/)+/i, "");
		finalUrl = finalUrl.replace(/\/+$/, "");
		finalUrl = `https://${finalUrl}`;
		const encoded = encodeURIComponent(finalUrl);
		window.location.href = `${config.saasUrl}/scan?url=${encoded}&ref=hero`;
	}, [url]);

	return (
		<section className="relative min-h-[100svh] flex items-center overflow-hidden bg-transparent">
			{/* Single subtle gradient line across the top */}
			<div
				className="pointer-events-none absolute top-0 left-0 right-0 h-px"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(90deg, transparent 0%, #3B8FE8 50%, transparent 100%)",
					opacity: 0.3,
				}}
			/>

			<div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 sm:py-32 md:py-40">
				{/* Headline */}
				<motion.h1
					custom={0}
					initial="hidden"
					animate="visible"
					variants={FADE_UP}
					className={cn(
						"text-center font-bold tracking-tight text-white",
						"text-5xl md:text-6xl lg:text-7xl",
						"leading-[1.05]",
					)}
				>
					{t("title")}
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					custom={0.15}
					initial="hidden"
					animate="visible"
					variants={FADE_UP}
					className={cn(
						"mx-auto mt-6 max-w-2xl text-center",
						"text-lg sm:text-xl text-[#94A3B8] leading-relaxed",
					)}
				>
					{t("subtitle")}
				</motion.p>

				{/* URL Input — the main CTA */}
				<motion.div
					custom={0.3}
					initial="hidden"
					animate="visible"
					variants={FADE_UP}
					className="mx-auto mt-10 sm:mt-12 max-w-2xl"
				>
					<div
						className={cn(
							"relative rounded-2xl p-[1px]",
							"transition-all duration-500",
							isFocused
								? "shadow-[0_0_30px_rgba(59,143,232,0.15)]"
								: "shadow-none",
						)}
						style={{
							background: isFocused
								? "linear-gradient(135deg, #3B8FE8 0%, #3B8FE880 50%, #3B8FE8 100%)"
								: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
						}}
					>
						{/* Animated glow border via CSS animation */}
						<div
							className={cn(
								"absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500",
								isFocused && "opacity-100",
							)}
							aria-hidden="true"
							style={{
								background:
									"conic-gradient(from var(--glow-angle, 0deg), transparent 0%, #3B8FE8 10%, transparent 20%)",
								animation: isFocused
									? "hero-glow-spin 3s linear infinite"
									: "none",
							}}
						/>

						<div
							className={cn(
								"relative flex flex-col gap-3 rounded-2xl bg-[#0A1428] p-3",
								"sm:flex-row sm:items-center sm:gap-2 sm:p-2",
							)}
						>
							<input
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
								onFocus={() => setIsFocused(true)}
								onBlur={() => setIsFocused(false)}
								placeholder={t("inputPlaceholder")}
								className={cn(
									"flex-1 min-h-[52px] sm:min-h-[56px] rounded-xl bg-white/[0.04] px-5",
									"text-base sm:text-lg text-white outline-none",
									"placeholder:text-[#475569]",
									"focus:bg-white/[0.06] transition-colors duration-300",
								)}
							/>
							<Button
								size="lg"
								onClick={handleSubmit}
								className={cn(
									"w-full shrink-0 sm:w-auto min-h-[52px] sm:min-h-[56px] rounded-xl px-8",
									"bg-[#3B8FE8] hover:bg-[#2E7FD6] active:bg-[#2566B0]",
									"text-[#0A1428] font-bold text-base",
									"transition-all duration-200",
									"hover:shadow-[0_0_20px_rgba(59,143,232,0.3)]",
								)}
							>
								{t("cta")}
								<ArrowRightIcon className="ml-2 size-5" />
							</Button>
						</div>
					</div>

					{/* Trust line below input */}
					<motion.p
						custom={0.45}
						initial="hidden"
						animate="visible"
						variants={FADE_UP}
						className="mt-4 text-center text-sm text-white/40"
					>
						{t("trust")}
					</motion.p>
				</motion.div>

				{/* Standards trust signals */}
				<motion.div
					custom={0.6}
					initial="hidden"
					animate="visible"
					variants={FADE_UP}
					className="mt-12 flex items-center justify-center"
				>
					<p className="text-xs font-medium tracking-[0.2em] uppercase text-white/20">
						{t("standards")}
					</p>
				</motion.div>
			</div>

			{/* CSS for the animated conic-gradient glow */}
			<style jsx global>{`
				@property --glow-angle {
					syntax: "<angle>";
					inherits: false;
					initial-value: 0deg;
				}
				@keyframes hero-glow-spin {
					from {
						--glow-angle: 0deg;
					}
					to {
						--glow-angle: 360deg;
					}
				}
			`}</style>
		</section>
	);
}
