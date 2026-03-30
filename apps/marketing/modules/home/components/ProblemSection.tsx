"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClockIcon, RefreshCwIcon, DatabaseIcon, BotIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const cards = [
	{ id: "card1", icon: ClockIcon },
	{ id: "card2", icon: RefreshCwIcon },
	{ id: "card3", icon: DatabaseIcon },
	{ id: "card4", icon: BotIcon },
] as const;

export function ProblemSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 80%",
					once: true,
				},
			});

			tl.from(".problem-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".problem-card",
				{
					opacity: 0,
					y: 40,
					x: -30,
					stagger: 0.15,
					duration: 0.8,
					ease: "power3.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-16 sm:py-20 lg:py-28 bg-[#111827]"
		>
			<div className="container max-w-5xl">
				<div className="problem-header mb-10 sm:mb-16 text-center">
					<small className="font-medium text-xs uppercase tracking-widest mb-4 block text-[#00E5C0]">
						{t("home.problem.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.problem.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
					{cards.map((card) => {
						const Icon = card.icon;
						return (
							<div
								key={card.id}
								className="problem-card rounded-2xl p-5 sm:p-6 lg:p-8 border border-white/10 bg-white/5 backdrop-blur-sm"
							>
								<div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#00E5C0]/15">
									<Icon
										className="size-5 text-[#00E5C0]"
										strokeWidth={1.5}
									/>
								</div>
								<h3 className="text-lg font-semibold mb-3 text-white">
									{t(`home.problem.${card.id}.title`)}
								</h3>
								<p className="text-sm leading-relaxed text-[#94A3B8]">
									{t(`home.problem.${card.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
