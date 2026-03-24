"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BpmnHeroBackground } from "./BpmnHeroBackground";

export function HeroSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const [processCount, setProcessCount] = useState<number | null>(null);

	useEffect(() => {
		fetch(`${config.saasUrl}/api/public/stats`)
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (data?.processSteps && data.processSteps >= 100) {
					setProcessCount(data.processSteps);
				}
			})
			.catch(() => {});
	}, []);

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

			// CTA buttons: stagger with overshoot
			tl.from(
				".hero-cta > *",
				{
					opacity: 0,
					y: 20,
					scale: 0.95,
					stagger: 0.1,
					duration: 0.6,
					ease: "back.out(1.4)",
				},
				0.6,
			);

			// Counter fade in
			tl.from(
				".hero-counter",
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
			<div className="container relative z-10 pt-20 pb-10 md:pt-28 md:pb-12 lg:pt-36 lg:pb-14 text-center">
				<div className="hero-badge mb-6 flex justify-center" style={{ clipPath: "inset(0 0% 0 0)" }}>
					<div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
						{t("home.hero.badge")}
					</div>
				</div>

				<h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] text-foreground mx-auto max-w-4xl text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="hero-word-inner">
						{t("home.hero.title")}
					</SplitWords>
				</h1>

				<p className="hero-subtitle mt-6 text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-balance leading-relaxed">
					{t("home.hero.subtitle")}
				</p>

				<div className="hero-cta mt-10 flex items-center justify-center gap-4">
					<Button size="lg" variant="primary" asChild>
						<a href={config.saasUrl}>
							{t("home.hero.cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</a>
					</Button>
					<Button variant="ghost" size="lg" asChild>
						<a href="/tools">
							{t("home.hero.ctaSecondary")}
						</a>
					</Button>
				</div>

				{processCount !== null && (
					<div className="hero-counter mt-8 inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
						<span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
						<span className="font-medium tabular-nums text-foreground">{processCount.toLocaleString()}</span>
						{t("home.hero.counterLabel")}
					</div>
				)}
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
