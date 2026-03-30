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

			// URL input: slide up
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
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="relative overflow-hidden">
			<div className="container relative z-10 pt-12 pb-8 sm:pt-20 sm:pb-10 md:pt-28 md:pb-12 lg:pt-36 lg:pb-14 text-center">
				<div className="hero-badge mb-6 flex justify-center" style={{ clipPath: "inset(0 0% 0 0)" }}>
					<div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
						{t("home.hero.badge")}
					</div>
				</div>

				<h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] text-foreground mx-auto max-w-3xl sm:max-w-4xl text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="hero-word-inner">
						{t("home.hero.title")}
					</SplitWords>
				</h1>

				<p className="hero-subtitle mt-6 text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-balance leading-relaxed">
					{t("home.hero.subtitle")}
				</p>

				<div className="hero-input-group mt-8 sm:mt-10 mx-auto max-w-xl">
					<div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-lg">
						<SearchIcon className="ml-2 size-5 text-muted-foreground shrink-0" />
						<input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
							placeholder={t("home.hero.inputPlaceholder")}
							className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none min-h-[44px]"
						/>
						<Button
							size="lg"
							variant="primary"
							onClick={handleSubmit}
							disabled={!url.trim()}
							className="shrink-0"
						>
							{t("home.hero.cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</Button>
					</div>
					<p className="hero-subtext mt-3 text-muted-foreground text-sm">
						{t("home.hero.subtext")}
					</p>
					<a
						href={`${config.saasUrl}/scan?ref=hero-manual`}
						className="hero-subtext mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
					>
						{t("home.hero.ctaSecondary")}
						<ArrowRightIcon className="size-3.5" />
					</a>
				</div>
			</div>

			{/* Animated BPMN diagram background — hidden on mobile */}
			<div className="hidden md:block">
				<BpmnHeroBackground />
			</div>
			{/* Fallback gradient for mobile */}
			<div className="md:hidden absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/[0.06] via-primary/[0.02] to-transparent" />
		</section>
	);
}
