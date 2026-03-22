"use client";

import { useGSAP } from "@gsap/react";
import { SplitWords } from "@shared/components/SplitWords";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GitBranch, MessageSquareText, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
	{ key: "step1", icon: Video },
	{ key: "step2", icon: MessageSquareText },
	{ key: "step3", icon: GitBranch },
] as const;

export function HowItWorksSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Title word-reveal
			gsap.from(sectionRef.current.querySelectorAll(".hiw-word-inner"), {
				y: "100%",
				stagger: 0.05,
				duration: 0.8,
				ease: "power4.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			// Scrub-driven sequential step reveal
			const stepsContainer = sectionRef.current.querySelector(".steps-grid");
			if (!stepsContainer) return;

			const stepCards = stepsContainer.querySelectorAll(".step-card");
			const stepLines = stepsContainer.querySelectorAll(".step-line");
			const stepIcons = stepsContainer.querySelectorAll(".step-icon-wrapper");

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: stepsContainer,
					start: "top 70%",
					end: "bottom 50%",
					scrub: 0.5,
				},
			});

			stepCards.forEach((card, i) => {
				// Card slides in
				tl.from(card, {
					opacity: 0,
					y: 30,
					duration: 1,
					ease: "none",
				});

				// Icon rotation on arrival
				if (stepIcons[i]) {
					tl.from(
						stepIcons[i],
						{
							rotate: -10,
							scale: 0.8,
							duration: 0.5,
							ease: "back.out(2)",
						},
						"<",
					);
				}

				// Connecting line draws after card
				if (stepLines[i]) {
					tl.from(
						stepLines[i],
						{
							scaleX: 0,
							duration: 0.5,
							ease: "none",
						},
						">-0.3",
					);
				}
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="how-it-works" className="py-20 lg:py-28 bg-muted/50">
			<div className="container">
				<h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground text-center max-w-3xl mx-auto text-balance" style={{ perspective: "600px" }}>
					<SplitWords innerClassName="hiw-word-inner">
						{t("home.howItWorks.title")}
					</SplitWords>
				</h2>

				<div className="steps-grid mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
					{steps.map((step, i) => {
						const Icon = step.icon;
						return (
							<div key={step.key} className="step-card relative flex flex-col items-center text-center px-6">
								{i < steps.length - 1 && (
									<div className="step-line hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border origin-left" />
								)}

								<div className="step-icon-wrapper flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6">
									<Icon className="size-8" strokeWidth={1.5} />
								</div>

								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
									{t("home.howItWorks.stepLabel", { number: i + 1 })}
								</span>

								<h3 className="text-xl font-semibold text-foreground mb-3">
									{t(`home.howItWorks.${step.key}.title`)}
								</h3>

								<p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
									{t(`home.howItWorks.${step.key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
