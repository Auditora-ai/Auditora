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

/* ─── SIPOC diagram data for the product preview ─── */
const SIPOC_COLUMNS = [
	{
		key: "S",
		label: "Suppliers",
		color: "#8B5CF6",
		items: ["Raw Material Co.", "Logistics Partner", "IT Services"],
	},
	{
		key: "I",
		label: "Inputs",
		color: "#3B82F6",
		items: ["Steel Grade A", "Transport Schedule", "ERP System Data"],
	},
	{
		key: "P",
		label: "Process",
		color: "#00E5C0",
		items: ["Receive Order", "Quality Check", "Assembly Line"],
	},
	{
		key: "O",
		label: "Outputs",
		color: "#F59E0B",
		items: ["Finished Product", "QC Report", "Shipping Docs"],
	},
	{
		key: "C",
		label: "Customers",
		color: "#EF4444",
		items: ["End Consumer", "Distributor", "Retail Partner"],
	},
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
				<div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">
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
								type="text"
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

							{/* Trust indicators */}
							<div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/40 lg:justify-start">
								<span>✓ No signup required</span>
								<span>✓ Results in 2 min</span>
								<span>✓ SIPOC + FMEA included</span>
							</div>

							<p className="mt-3 text-sm text-white/50">{t("subtext")}</p>

							{/* No credit card line */}
							<p className="mt-1.5 text-xs text-white/35">
								No credit card required · 14-day free trial
							</p>

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

					{/* Right Column: Product Preview Mockup */}
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
									<div className="size-3 rounded-full bg-[#FF5F57]" />
									<div className="size-3 rounded-full bg-[#FEBC2E]" />
									<div className="size-3 rounded-full bg-[#28C840]" />
								</div>
								<div className="mx-4 flex-1">
									<div className="mx-auto flex h-6 max-w-[260px] items-center rounded-md bg-white/[0.08] px-3">
										<span className="text-[10px] text-white/30 truncate">app.auditora.ai/analysis/sipoc-diagram</span>
									</div>
								</div>
							</div>

							{/* App toolbar */}
							<div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
								<div className="flex items-center gap-2">
									<div className="size-2 rounded-full bg-[#00E5C0] shadow-[0_0_6px_rgba(0,229,192,0.8)]" />
									<span className="text-xs font-medium text-white/60">SIPOC Diagram</span>
									<span className="text-[10px] text-white/25">—</span>
									<span className="text-[10px] text-white/30">Manufacturing Process</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="rounded bg-[#00E5C0]/10 px-2 py-0.5 text-[10px] font-medium text-[#00E5C0]">Complete</span>
								</div>
							</div>

							{/* SIPOC Diagram Content */}
							<div className="p-4">
								{/* Column Headers */}
								<div className="grid grid-cols-5 gap-2 mb-3">
									{SIPOC_COLUMNS.map((col, colIdx) => (
										<motion.div
											key={col.key}
											initial={{ opacity: 0, y: -8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.9 + colIdx * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
											className="text-center"
										>
											<div
												className="rounded-lg px-2 py-2"
												style={{ backgroundColor: `${col.color}15`, borderBottom: `2px solid ${col.color}40` }}
											>
												<span
													className="text-sm font-bold"
													style={{ color: col.color }}
												>
													{col.key}
												</span>
												<p
													className="text-[9px] font-medium mt-0.5"
													style={{ color: `${col.color}99` }}
												>
													{col.label}
												</p>
											</div>
										</motion.div>
									))}
								</div>

								{/* Column Items */}
								<div className="grid grid-cols-5 gap-2">
									{SIPOC_COLUMNS.map((col, colIdx) => (
										<div key={col.key} className="flex flex-col gap-1.5">
											{col.items.map((item, itemIdx) => (
												<motion.div
													key={item}
													initial={{ opacity: 0, x: -6 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{
														delay: 1.3 + colIdx * 0.12 + itemIdx * 0.15,
														duration: 0.35,
														ease: [0.22, 1, 0.36, 1],
													}}
													className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-2"
												>
													<span className="text-[10px] leading-tight text-white/60 block">
														{item}
													</span>
												</motion.div>
											))}
										</div>
									))}
								</div>

								{/* Flow arrows between columns */}
								<div className="mt-3 grid grid-cols-5 gap-2">
									{[0, 1, 2, 3].map((i) => (
										<motion.div
											key={i}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 2.0 + i * 0.15, duration: 0.3 }}
											className="flex items-center justify-end col-span-1"
										>
											<svg width="100%" height="12" viewBox="0 0 80 12" className="text-white/15">
												<line x1="10" y1="6" x2="70" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
												<polygon points="70,3 76,6 70,9" fill="currentColor" />
											</svg>
										</motion.div>
									))}
									<div />
								</div>
							</div>

							{/* Status footer */}
							<div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-2">
								<div className="flex items-center gap-3">
									<span className="text-[10px] text-white/30">5 categories</span>
									<span className="text-[10px] text-white/15">·</span>
									<span className="text-[10px] text-white/30">15 elements mapped</span>
									<span className="text-[10px] text-white/15">·</span>
									<span className="text-[10px] text-white/30">ISO 9001</span>
								</div>
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 2.6, duration: 0.4 }}
									className="flex items-center gap-1.5 rounded-full bg-[#00E5C0]/10 px-2.5 py-0.5"
								>
									<div className="size-1.5 rounded-full bg-[#00E5C0]" />
									<span className="text-[10px] font-medium text-[#00E5C0]">Analysis ready</span>
								</motion.div>
							</div>

							{/* Ambient glow */}
							<div
								className="pointer-events-none absolute inset-0 rounded-2xl"
								style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,229,192,0.04) 0%, transparent 70%)" }}
							/>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
