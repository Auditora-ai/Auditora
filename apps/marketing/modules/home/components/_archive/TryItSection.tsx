"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlobeIcon, CpuIcon, ShieldAlertIcon, MessageSquareTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
	{ icon: GlobeIcon, key: "step1" },
	{ icon: CpuIcon, key: "step2" },
	{ icon: ShieldAlertIcon, key: "step3" },
	{ icon: MessageSquareTextIcon, key: "step4" },
] as const;

export function TryItSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const lineRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Header reveal
			gsap.from(sectionRef.current.querySelectorAll(".hiw-header > *"), {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			// Timeline line drawing on scroll
			if (lineRef.current) {
				gsap.to(lineRef.current, {
					scaleY: 1,
					ease: "none",
					scrollTrigger: {
						trigger: sectionRef.current?.querySelector(".hiw-timeline"),
						start: "top 75%",
						end: "bottom 50%",
						scrub: true,
					},
				});
			}

			// Steps fade in sequentially
			gsap.from(".hiw-step", {
				opacity: 0,
				scale: 0.8,
				y: 20,
				stagger: 0.2,
				duration: 0.6,
				ease: "back.out(1.5)",
				scrollTrigger: {
					trigger: ".hiw-timeline",
					start: "top 70%",
					once: true,
				},
			});

			// Disclaimer
			gsap.from(".hiw-disclaimer", {
				opacity: 0,
				y: 15,
				duration: 0.5,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".hiw-disclaimer",
					start: "top 90%",
					once: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="how-it-works" className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-4xl">
				<div className="hiw-header text-center mb-12 sm:mb-16">
					<small className="font-medium text-xs uppercase tracking-widest mb-4 block text-[#3B8FE8]">
						{t("home.howItWorks.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.howItWorks.title")}
					</h2>
					<p className="mt-4 text-sm lg:text-base max-w-2xl mx-auto text-balance text-[#94A3B8]">
						{t("home.howItWorks.subtitle")}
					</p>
				</div>

				{/* Vertical timeline */}
				<div className="hiw-timeline relative max-w-xl mx-auto">
					{/* Timeline connecting line */}
					<div
						ref={lineRef}
						className="absolute left-[23px] sm:left-[27px] top-[24px] sm:top-[28px] bottom-[24px] sm:bottom-[28px] w-[2px] bg-[#3B8FE8] origin-top scale-y-0 z-0 hidden sm:block"
					/>

					<div className="space-y-8 sm:space-y-10">
						{steps.map((step, i) => {
							const Icon = step.icon;
							return (
								<div key={step.key} className="hiw-step flex gap-4 sm:gap-6 relative z-[1]">
									{/* Step number circle */}
									<div className="relative z-10 shrink-0">
										<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-[#0A1428] bg-gradient-to-br from-[#3B8FE8]/15 to-[#3B8FE8]/15 border border-[#3B8FE8]/30">
											<Icon className="size-5 sm:size-6 text-[#3B8FE8]" strokeWidth={1.5} />
										</div>
										<span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#3B8FE8] text-[#0A1428]">
											{i + 1}
										</span>
									</div>
									{/* Step content */}
									<div className="pt-1 sm:pt-2">
										<h3 className="text-lg font-semibold text-white mb-2">
											{t(`home.howItWorks.${step.key}.title`)}
										</h3>
										<p className="text-sm leading-relaxed text-[#94A3B8]">
											{t(`home.howItWorks.${step.key}.description`)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<p className="hiw-disclaimer mt-10 text-xs text-center leading-relaxed max-w-2xl mx-auto text-[#64748B]">
					{t("home.howItWorks.disclaimer")}
				</p>
			</div>
		</section>
	);
}
