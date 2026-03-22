"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function CtaSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Section clip-path portal reveal
			gsap.from(sectionRef.current, {
				clipPath: "inset(100% 0 0 0)",
				duration: 1.0,
				ease: "power2.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 90%",
					once: true,
				},
			});

			// Content timeline (delayed for after portal opens)
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 70%",
					once: true,
				},
			});

			// Title word-reveal in white
			tl.from(".cta-word-inner", {
				y: "110%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
			});

			// Subtitle blur-fade
			tl.from(
				".cta-subtitle",
				{
					opacity: 0,
					y: 15,
					filter: "blur(4px)",
					duration: 0.6,
					ease: "power2.out",
				},
				"-=0.3",
			);

			// Button pop-in
			tl.from(
				".cta-button",
				{
					scale: 0.8,
					opacity: 0,
					duration: 0.6,
					ease: "back.out(2)",
				},
				"-=0.2",
			);

			// Note fade
			tl.from(
				".cta-note",
				{
					opacity: 0,
					y: 10,
					duration: 0.4,
					ease: "power2.out",
				},
				"-=0.2",
			);

			// Pulsing glow behind button (continuous after reveal)
			gsap.to(".cta-glow", {
				opacity: 0.6,
				scale: 1.1,
				repeat: -1,
				yoyo: true,
				duration: 2,
				ease: "power1.inOut",
				delay: 1.5,
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-24 lg:py-32 bg-[#0F172A] text-white"
			style={{ clipPath: "inset(0 0 0 0)" }}
		>
			<div className="container max-w-3xl text-center">
				<h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[#F1F5F9] text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="cta-word-inner">
						{t("cta.title")}
					</SplitWords>
				</h2>

				<p className="cta-subtitle mt-6 text-[#94A3B8] text-lg text-balance">
					{t("cta.subtitle")}
				</p>

				<div className="cta-button mt-10 relative inline-block">
					<div className="cta-glow absolute inset-0 rounded-full bg-primary/30 blur-xl opacity-30 scale-100" />
					<Button size="lg" variant="primary" asChild>
						<a href={config.saasUrl} className="relative">
							{t("cta.button")}
							<ArrowRightIcon className="ml-2 size-4" />
						</a>
					</Button>
				</div>

				<p className="cta-note mt-4 text-[#64748B] text-sm">
					{t("cta.note")}
				</p>
			</div>
		</section>
	);
}
