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

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 70%",
					once: true,
				},
			});

			tl.from(".cta-word-inner", {
				y: "110%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
			});

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

			// Pulsing teal glow behind button
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
			className="py-16 sm:py-24 lg:py-32 bg-[#0A1428] text-white"
			style={{ clipPath: "inset(0 0 0 0)" }}
		>
			<div className="container max-w-3xl text-center">
				<h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-white text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="cta-word-inner">
						{t("cta.title")}
					</SplitWords>
				</h2>

				<p className="cta-subtitle mt-4 sm:mt-6 text-[#94A3B8] text-base sm:text-lg text-balance">
					{t("cta.subtitle")}
				</p>

				<div className="cta-button mt-8 sm:mt-10 relative inline-block">
					<div className="cta-glow absolute inset-0 rounded-full bg-[#00E5C0]/30 blur-xl opacity-30 scale-100" />
					<Button size="lg" variant="primary" asChild className="relative bg-[#00E5C0] hover:bg-[#00C4A3] text-[#0A1428]">
						<a href={`${config.saasUrl}/scan`}>
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
