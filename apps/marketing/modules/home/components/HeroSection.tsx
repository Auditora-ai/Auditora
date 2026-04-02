"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button, cn } from "@repo/ui";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { BpmnHeroBackground } from "./BpmnHeroBackground";

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
	const sectionRef = useRef<HTMLElement>(null);
	const [url, setUrl] = useState("");

	function handleSubmit() {
		let finalUrl = url.trim();
		if (!finalUrl) {
			window.location.href = `${config.saasUrl}/scan?ref=hero`;
			return;
		}
		// Strip any existing protocol to avoid duplication
		finalUrl = finalUrl.replace(/^(https?:\/\/)+/i, "");
		finalUrl = finalUrl.replace(/\/+$/, "");
		finalUrl = `https://${finalUrl}`;
		const encoded = encodeURIComponent(finalUrl);
		window.location.href = `${config.saasUrl}/scan?url=${encoded}&ref=hero`;
	}

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

			// 0s — Badge: clip-path horizontal wipe
			tl.from(".hero-badge", {
				clipPath: "inset(0 100% 0 0)",
				duration: 0.6,
				ease: "power2.inOut",
			});

			// 0.3s — Title words stagger in
			tl.from(
				".hero-word-inner",
				{
					y: "100%",
					rotateX: 8,
					duration: 1.0,
					stagger: 0.04,
				},
				0.3,
			);

			// 0.8s — Subtitle blur-fade
			tl.from(
				".hero-subtitle",
				{
					opacity: 0,
					filter: "blur(10px)",
					duration: 0.8,
					ease: "power3.out",
				},
				0.8,
			);

			// 1.1s — Input card slides up
			tl.from(
				".hero-input-group",
				{
					opacity: 0,
					y: 30,
					duration: 0.7,
					ease: "back.out(1.2)",
				},
				1.1,
			);

			// 1.3s — Subtext fade
			tl.from(
				".hero-subtext",
				{
					opacity: 0,
					duration: 0.5,
					ease: "power2.out",
				},
				1.3,
			);

			// 1.4s — Secondary link fade
			tl.from(
				".hero-secondary-link",
				{
					opacity: 0,
					duration: 0.4,
					ease: "power2.out",
				},
				1.4,
			);

			// 0.5s — Mockup scales in (parallel with title)
			tl.from(
				".hero-mockup",
				{
					opacity: 0,
					scale: 0.95,
					y: 30,
					duration: 0.9,
					ease: "power3.out",
				},
				0.5,
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="relative overflow-hidden">
			{/* Background glows */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
			>
				<div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#00E5C0]/20 blur-[120px]" />
				<div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#00E5C0]/10 blur-[100px]" />
			</div>

			{/* Animated BPMN diagram background — hidden on mobile */}
			<div className="pointer-events-none hidden md:block" aria-hidden="true">
				<BpmnHeroBackground />
			</div>

			<div className="container relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-24">
				<div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
					{/* ── Left Column: Text Content ── */}
					<div className="text-center lg:text-left">
						{/* Badge pill */}
						<div
							className="hero-badge mb-6 flex justify-center lg:justify-start"
							style={{ clipPath: "inset(0 0% 0 0)" }}
						>
							<div
								className={cn(
									"inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium",
									"border-[#00E5C0]/20 bg-[#00E5C0]/10 text-[#00E5C0]",
								)}
							>
								{t("badge")}
							</div>
						</div>

						{/* Headline */}
						<h1
							className={cn(
								"font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] text-white",
								"mx-auto max-w-2xl lg:mx-0",
							)}
							style={{ perspective: "600px" }}
						>
							<SplitWords innerClassName="hero-word-inner">
								{t("title")}
							</SplitWords>
						</h1>

						{/* Subtitle */}
						<p
							className={cn(
								"hero-subtitle mt-6 text-base sm:text-lg lg:text-xl max-w-xl",
								"mx-auto lg:mx-0 leading-relaxed text-[#94A3B8]",
							)}
						>
							{t("subtitle")}
						</p>

						{/* URL Input area */}
						<div className="hero-input-group mt-8 sm:mt-10 mx-auto lg:mx-0 max-w-xl">
							<div
								className={cn(
									"flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm",
									"sm:flex-row sm:items-center",
								)}
							>
								<div className="flex flex-1 items-center gap-2">
									<SearchIcon className="ml-2 size-5 shrink-0 text-[#94A3B8]" />
									<input
										type="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleSubmit()
										}
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

							{/* Subtext */}
							<p className="hero-subtext mt-3 text-sm text-white/50">
								{t("subtext")}
							</p>

							{/* Secondary link */}
							<a
								href={`${config.saasUrl}/scan?mode=text&ref=hero`}
								className={cn(
									"hero-secondary-link mt-2 inline-flex items-center gap-1 text-sm transition-colors",
									"text-white/40 hover:text-[#00E5C0]/70",
								)}
							>
								{t("ctaSecondary")}
								<ArrowRightIcon className="size-3.5" />
							</a>
						</div>
					</div>

					{/* ── Right Column: Product Mockup ── */}
					<div className="hero-mockup hidden lg:block">
						<div
							className={cn(
								"relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
								"shadow-2xl shadow-[#00E5C0]/5",
							)}
						>
							{/* Browser chrome bar */}
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

							{/* App layout: sidebar + main */}
							<div className="grid min-h-[380px]" style={{ gridTemplateColumns: "180px 1fr" }}>
								{/* Sidebar: numbered steps */}
								<div className="flex flex-col border-r border-white/10 bg-white/[0.02] p-4">
									{MOCKUP_STEPS.map((step, i) => (
										<div
											key={step.num}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
												i === 0
													? "bg-[#00E5C0]/10 text-[#00E5C0]"
													: i === 1
														? "bg-white/5 text-white/70"
														: "text-white/30",
											)}
										>
											<span
												className={cn(
													"flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
													i === 0
														? "bg-[#00E5C0] text-[#0A1428]"
														: "bg-white/10 text-white/40",
												)}
											>
												{step.num}
											</span>
											<span className="font-medium">{step.label}</span>
										</div>
									))}
								</div>

								{/* Main content area: BPMN diagram + risk cards */}
								<div className="flex flex-col p-5">
									{/* Mini header */}
									<div className="mb-4 flex items-center justify-between">
										<div className="h-4 w-32 rounded bg-white/15" />
										<div className="h-4 w-20 rounded bg-[#00E5C0]/20" />
									</div>

									{/* BPMN diagram */}
									<div className="flex flex-1 items-center justify-center">
										<svg
											viewBox="0 0 400 200"
											className="h-auto w-full opacity-70"
											fill="none"
										>
											{/* Start event */}
											<circle
												cx="30"
												cy="100"
												r="14"
												stroke="#00E5C0"
												strokeWidth="2"
												fill="rgba(0,229,192,0.15)"
											/>
											{/* Arrow → Task 1 */}
											<line x1="44" y1="100" x2="80" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
											<circle cx="80" cy="100" r="2" fill="#00E5C0" />
											{/* Task 1: "Identify" */}
											<rect x="88" y="80" width="76" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
											<text x="126" y="104" textAnchor="middle" fill="#00E5C0" fontSize="9" fontFamily="system-ui">Identify</text>
											{/* Arrow → Gateway */}
											<line x1="164" y1="100" x2="200" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
											{/* Diamond gateway */}
											<rect x="200" y="88" width="24" height="24" rx="3" transform="rotate(45 212 100)" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.08)" />
											{/* Branch up → Task 2 */}
											<line x1="217" y1="83" x2="255" y2="55" stroke="#00E5C0" strokeWidth="1.5" />
											<circle cx="255" cy="55" r="2" fill="#00E5C0" />
											<rect x="263" y="35" width="76" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
											<text x="301" y="59" textAnchor="middle" fill="#00E5C0" fontSize="9" fontFamily="system-ui">Assess</text>
											{/* Branch down → Task 3 */}
											<line x1="217" y1="117" x2="255" y2="145" stroke="#00E5C0" strokeWidth="1.5" />
											<circle cx="255" cy="145" r="2" fill="#00E5C0" />
											<rect x="263" y="125" width="76" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
											<text x="301" y="149" textAnchor="middle" fill="#00E5C0" fontSize="9" fontFamily="system-ui">Document</text>
											{/* Merge → End */}
											<line x1="339" y1="55" x2="365" y2="85" stroke="#00E5C0" strokeWidth="1.5" />
											<line x1="339" y1="145" x2="365" y2="115" stroke="#00E5C0" strokeWidth="1.5" />
											<circle cx="380" cy="100" r="14" stroke="#00E5C0" strokeWidth="3" fill="rgba(0,229,192,0.15)" />
										</svg>
									</div>

									{/* Risk indicator row */}
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
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
