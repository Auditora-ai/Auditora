"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlobeIcon, CpuIcon, FileBarChartIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
	{ icon: GlobeIcon, key: "step1" },
	{ icon: CpuIcon, key: "step2" },
	{ icon: FileBarChartIcon, key: "step3" },
	{ icon: PencilIcon, key: "step4" },
] as const;

export function TryItSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			gsap.from(sectionRef.current.querySelectorAll(".hiw-reveal"), {
				opacity: 0,
				y: 30,
				stagger: 0.12,
				duration: 0.7,
				ease: "power3.out",
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="how-it-works" className="py-20 lg:py-28" style={{ backgroundColor: "#1C1917" }}>
			<div className="container max-w-5xl">
				<div className="text-center mb-16">
					<small className="hiw-reveal font-medium text-xs uppercase tracking-wider mb-4 block" style={{ color: "#D97706" }}>
						{t("home.howItWorks.badge")}
					</small>
					<h2 className="hiw-reveal font-display text-3xl lg:text-4xl xl:text-5xl" style={{ color: "#FAFAF9" }}>
						{t("home.howItWorks.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{steps.map((step, i) => {
						const Icon = step.icon;
						return (
							<div key={step.key} className="hiw-reveal text-center">
								<div className="relative mx-auto mb-6">
									<div
										className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
										style={{ backgroundColor: "#292524" }}
									>
										<Icon className="size-7" style={{ color: "#D97706" }} />
									</div>
									<span
										className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
										style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
									>
										{i + 1}
									</span>
								</div>
								<h3 className="text-lg font-semibold mb-2" style={{ color: "#FAFAF9", fontFamily: "var(--font-sans)" }}>
									{t(`home.howItWorks.${step.key}.title`)}
								</h3>
								<p className="text-sm leading-relaxed" style={{ color: "#A8A29E" }}>
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
