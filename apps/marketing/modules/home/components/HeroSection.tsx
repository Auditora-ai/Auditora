"use client";

import { config } from "@config";
import { Button, cn } from "@repo/ui";
import { SplitWords } from "@shared/components/SplitWords";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BpmnHeroBackground } from "./BpmnHeroBackground";
import { ParticleNetwork } from "./animations/ParticleNetwork";
import { BpmnRealTimeBuilder } from "./animations/BpmnRealTimeBuilder";

const MOCKUP_STEPS = [
	{ num: "01", label: "Scan" },
	{ num: "02", label: "Map" },
	{ num: "03", label: "Assess" },
	{ num: "04", label: "Document" },
	{ num: "05", label: "Simulate" },
	{ num: "06", label: "Evaluate" },
] as const;

export function HeroSection() {
	const t = useTranslations("home.hero");
	const [url, setUrl] = useState("");

	function handleSubmit() {
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
	}

	return (
		<section className="bg-grid relative overflow-hidden">
			{/* Background orbs */}
			<div className="pointer-events-none absolute inset-0" aria-hidden="true">
				<motion.div
					animate={{ x: [0, 15, -10, 0], y: [0, -25, -15, 0], scale: [1, 1.05, 0.98, 1] }}
					transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
					className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#00E5C0]/20 blur-[120px]"
				/>
				<motion.div
					animate={{ x: [0, -20, 15, 0], y: [0, 12, -10, 0], scale: [1, 0.95, 1.08, 1] }}
					transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
					className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#00E5C0]/10 blur-[100px]"
				/>
			</div>

			{/* BPMN diagram background */}
			<div className="pointer-events-none hidden md:block" aria-hidden="true">
				<BpmnHeroBackground />
			</div>

			{/* Particle network background */}
			<div className="pointer-events-none hidden lg:block" aria-hidden="true">
				<ParticleNetwork />
			</div>

			<div className="container relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-24">
				<div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
					{/* Left Column */}
					<div className="text-center lg:text-left">
						{/* Badge */}
						<motion.div
							initial={{ opacity: 0, y: -16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
							className="mb-6 flex justify-center lg:justify-start"
						>
							<div className={cn(
								"badge-pulse inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium",
								"border-[#00E5C0]/20 bg-[#00E5C0]/10 text-[#00E5C0]",
							)}>
								{t("badge")}
							</div>
						</motion.div>

						{/* Headline */}
						<motion.h1
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
							className={cn(
								"font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] text-white",
								"mx-auto max-w-2xl lg:mx-0",
							)}
							style={{ perspective: "600px" }}
						>
							<SplitWords innerClassName="hero-word-reveal">
								{t("title")}
							</SplitWords>
						</motion.h1>

						{/* Subtitle */}
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
							className={cn(
								"mt-6 text-base sm:text-lg lg:text-xl max-w-xl",
								"mx-auto lg:mx-0 leading-relaxed text-[#94A3B8]",
							)}
						>
							{t("subtitle")}
						</motion.p>

						{/* Input area */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
							className="mt-8 sm:mt-10 mx-auto lg:mx-0 max-w-xl"
						>
							<div className={cn(
								"flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm",
								"sm:flex-row sm:items-center",
							)}>
								<div className="flex flex-1 items-center gap-2">
									<SearchIcon className="ml-2 size-5 shrink-0 text-[#94A3B8]" />
									<input
										type="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
										placeholder={t("inputPlaceholder")}
										className={cn(
											"flex-1 min-h-[44px] bg-transparent text-white text-base outline-none",
											"placeholder:text-[#64748B]",
										)}
									/>
								</div>
								<Button
									size="lg"
									variant="primary"
									onClick={handleSubmit}
									className={cn(
										"w-full shrink-0 sm:w-auto",
										"bg-[#00E5C0] hover:bg-[#00C4A3] text-[#0A1428] font-semibold",
									)}
								>
									{t("cta")}
									<ArrowRightIcon className="ml-2 size-4" />
								</Button>
							</div>
							<p className="mt-3 text-sm text-white/50">{t("subtext")}</p>
							<a
								href={`${config.saasUrl}/scan?mode=text&ref=hero`}
								className={cn(
									"mt-2 inline-flex items-center gap-1 text-sm transition-colors",
									"text-white/40 hover:text-[#00E5C0]/70",
								)}
							>
								{t("ctaSecondary")}
								<ArrowRightIcon className="size-3.5" />
							</a>
						</motion.div>
					</div>

					{/* Right Column: Mockup */}
					<motion.div
						initial={{ opacity: 0, scale: 0.92, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
						className="hidden lg:block"
					>
						<div className="pointer-events-none absolute -inset-4 -z-10" aria-hidden="true">
							<div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(0,229,192,0.12)_0%,transparent_70%)]" />
						</div>
						<motion.div
							whileHover={{ y: -8, boxShadow: "0 30px 60px -12px rgba(0,229,192,0.15), 0 0 0 1px rgba(0,229,192,0.08)" }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
							className={cn(
								"relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
								"shadow-2xl shadow-[#00E5C0]/5",
							)}
						>
							{/* Browser chrome */}
							<div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
								<div className="flex gap-1.5">
									<div className="size-3 rounded-full bg-white/20" />
									<div className="size-3 rounded-full bg-white/20" />
									<div className="size-3 rounded-full bg-white/20" />
								</div>
								<div className="mx-8 flex-1">
									<div className="mx-auto h-5 max-w-[200px] rounded-full bg-white/10" />
								</div>
							</div>

							{/* App layout */}
							<div className="grid min-h-[380px]" style={{ gridTemplateColumns: "180px 1fr" }}>
								<div className="flex flex-col border-r border-white/10 bg-white/[0.02] p-4">
									{MOCKUP_STEPS.map((step, i) => (
										<motion.div
											key={step.num}
											initial={{ opacity: 0, x: -12 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
												i === 0 ? "bg-[#00E5C0]/10 text-[#00E5C0]"
													: i === 1 ? "bg-white/5 text-white/70"
													: "text-white/30",
											)}
										>
											<span className={cn(
												"flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
												i === 0 ? "bg-[#00E5C0] text-[#0A1428]" : "bg-white/10 text-white/40",
											)}>
												{step.num}
											</span>
											<span className="font-medium">{step.label}</span>
										</motion.div>
									))}
								</div>

								<div className="flex flex-col p-5">
									<div className="mb-4 flex items-center justify-between">
										<div className="h-4 w-32 rounded bg-white/15" />
										<div className="h-4 w-20 rounded bg-[#00E5C0]/20" />
									</div>
						<div className="flex flex-1 items-center justify-center p-2">
									<BpmnRealTimeBuilder className="w-full" loopMs={9000} />
								</div>
									<div className="mt-3 flex gap-2">
										<div className="flex-1 rounded-lg bg-red-500/10 px-3 py-2">
											<div className="mb-1 h-2 w-12 rounded bg-red-400/30" />
											<div className="h-3 w-16 rounded bg-red-400/20" />
										</div>
										<div className="flex-1 rounded-lg bg-amber-500/10 px-3 py-2">
											<div className="mb-1 h-2 w-12 rounded bg-amber-400/30" />
											<div className="h-3 w-16 rounded bg-amber-400/20" />
										</div>
										<div className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-2">
											<div className="mb-1 h-2 w-12 rounded bg-emerald-400/30" />
											<div className="h-3 w-16 rounded bg-emerald-400/20" />
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
