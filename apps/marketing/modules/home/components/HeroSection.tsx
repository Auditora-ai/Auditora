"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { BpmnHeroBackground } from "./BpmnHeroBackground";

export function HeroSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const [url, setUrl] = useState("");

	function handleSubmit() {
		if (!url.trim()) return;
		let finalUrl = url.trim();
		if (!/^https?:\/\//i.test(finalUrl)) {
			finalUrl = `https://${finalUrl}`;
		}
		const encoded = encodeURIComponent(finalUrl);
		window.location.href = `${config.saasUrl}/scan?url=${encoded}&ref=hero`;
	}

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

			// Badge: clip-path horizontal wipe
			tl.from(".hero-badge", {
				clipPath: "inset(0 100% 0 0)",
				duration: 0.6,
				ease: "power2.inOut",
			});

			// Title: word-level reveal from below
			tl.from(
				".hero-word-inner",
				{
					y: "110%",
					rotateX: 8,
					duration: 1.0,
					stagger: 0.06,
				},
				0,
			);

			// Subtitle: blur-fade
			tl.from(
				".hero-subtitle",
				{
					opacity: 0,
					y: 15,
					filter: "blur(4px)",
					duration: 0.8,
					ease: "power2.out",
				},
				0.4,
			);

			// URL input: slide up with elastic feel
			tl.from(
				".hero-input-group",
				{
					opacity: 0,
					y: 20,
					duration: 0.6,
					ease: "back.out(1.4)",
				},
				0.6,
			);

			// Subtext fade
			tl.from(
				".hero-subtext",
				{
					opacity: 0,
					y: 10,
					duration: 0.5,
					ease: "power2.out",
				},
				0.8,
			);

			// Product mockup fade + scale
			tl.from(
				".hero-mockup",
				{
					opacity: 0,
					scale: 0.95,
					y: 30,
					duration: 0.8,
					ease: "power3.out",
				},
				0.6,
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="relative overflow-hidden bg-[#0A1428]"
		>
			<div className="container relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20 lg:pt-40 lg:pb-24">
				<div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
					{/* Left: Text content */}
					<div className="text-center lg:text-left">
						<div
							className="hero-badge mb-6 flex justify-center lg:justify-start"
							style={{ clipPath: "inset(0 0% 0 0)" }}
						>
							<div className="inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-sm font-medium text-[#00E5C0]">
								{t("home.hero.badge")}
							</div>
						</div>

						<h1
							className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl leading-[1.05] text-white mx-auto lg:mx-0 max-w-2xl"
							style={{ perspective: "600px" }}
						>
							<SplitWords innerClassName="hero-word-inner">
								{t("home.hero.title")}
							</SplitWords>
						</h1>

						<p className="hero-subtitle mt-6 text-[#94A3B8] text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
							{t("home.hero.subtitle")}
						</p>

						<div className="hero-input-group mt-8 sm:mt-10 mx-auto lg:mx-0 max-w-xl">
							<div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:flex-row sm:items-center">
								<div className="flex flex-1 items-center gap-2">
									<SearchIcon className="ml-2 size-5 text-[#94A3B8] shrink-0" />
									<input
										type="url"
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleSubmit()
										}
										placeholder={t(
											"home.hero.inputPlaceholder",
										)}
										className="flex-1 bg-transparent text-white placeholder:text-[#64748B] text-base outline-none min-h-[44px]"
									/>
								</div>
								<Button
									size="lg"
									variant="primary"
									onClick={handleSubmit}
									disabled={!url.trim()}
									className="w-full sm:w-auto shrink-0 bg-[#00E5C0] hover:bg-[#00C4A3] text-[#0A1428]"
								>
									{t("home.hero.cta")}
									<ArrowRightIcon className="ml-2 size-4" />
								</Button>
							</div>
							<p className="hero-subtext mt-3 text-[#64748B] text-sm">
								{t("home.hero.subtext")}
							</p>
							<a
								href={`${config.saasUrl}/scan`}
								className="hero-subtext mt-2 inline-flex items-center gap-1 text-sm text-[#00E5C0] hover:text-[#00E5C0]/80 transition-colors"
							>
								{t("home.hero.ctaSecondary")}
								<ArrowRightIcon className="size-3.5" />
							</a>
						</div>
					</div>

					{/* Right: Product mockup placeholder */}
					<div className="hero-mockup hidden lg:block">
						<div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-[#00E5C0]/5">
							{/* Mockup header bar */}
							<div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
								<div className="flex gap-1.5">
									<div className="size-3 rounded-full bg-white/20" />
									<div className="size-3 rounded-full bg-white/20" />
									<div className="size-3 rounded-full bg-white/20" />
								</div>
								<div className="flex-1 mx-8">
									<div className="h-5 rounded-full bg-white/10 max-w-[200px] mx-auto" />
								</div>
							</div>
							{/* Mockup content area — BPMN diagram + chat */}
							<div className="grid grid-cols-3 gap-0 min-h-[340px]">
								{/* Chat panel */}
								<div className="col-span-1 border-r border-white/10 p-4 space-y-3">
									<div className="h-3 rounded bg-[#00E5C0]/20 w-3/4" />
									<div className="h-3 rounded bg-white/10 w-full" />
									<div className="h-3 rounded bg-white/10 w-5/6" />
									<div className="mt-4 h-3 rounded bg-[#00E5C0]/20 w-2/3" />
									<div className="h-3 rounded bg-white/10 w-full" />
									<div className="h-3 rounded bg-white/10 w-4/5" />
									<div className="mt-4 h-3 rounded bg-[#00E5C0]/20 w-1/2" />
									<div className="h-3 rounded bg-white/10 w-full" />
								</div>
								{/* BPMN diagram area */}
								<div className="col-span-2 p-6 flex items-center justify-center">
									<svg viewBox="0 0 400 200" className="w-full h-auto opacity-60" fill="none">
										{/* Mini BPMN diagram */}
										<circle cx="40" cy="100" r="14" stroke="#00E5C0" strokeWidth="2" fill="rgba(0,229,192,0.15)" />
										<line x1="54" y1="100" x2="100" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
										<rect x="100" y="80" width="80" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
										<line x1="180" y1="100" x2="220" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
										<rect x="210" y="90" width="20" height="20" rx="3" transform="rotate(45 220 100)" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
										<line x1="234" y1="86" x2="270" y2="60" stroke="#00E5C0" strokeWidth="1.5" />
										<line x1="234" y1="114" x2="270" y2="140" stroke="#00E5C0" strokeWidth="1.5" />
										<rect x="270" y="40" width="80" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
										<rect x="270" y="120" width="80" height="40" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="rgba(0,229,192,0.1)" />
										<line x1="350" y1="60" x2="370" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
										<line x1="350" y1="140" x2="370" y2="100" stroke="#00E5C0" strokeWidth="1.5" />
										<circle cx="380" cy="100" r="14" stroke="#00E5C0" strokeWidth="3" fill="rgba(0,229,192,0.15)" />
									</svg>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Animated BPMN diagram background — hidden on mobile */}
			<div className="hidden md:block">
				<BpmnHeroBackground />
			</div>

			{/* Gradient overlays */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,229,192,0.15),_transparent_60%)]" />
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,229,192,0.08),_transparent_60%)]" />
		</section>
	);
}
