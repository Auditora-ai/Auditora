"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClockIcon, DollarSignIcon, MessageCircleWarningIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const cards = [
	{ id: "card1", icon: ClockIcon },
	{ id: "card2", icon: DollarSignIcon },
	{ id: "card3", icon: MessageCircleWarningIcon },
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
					stagger: 0.15,
					duration: 0.7,
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
			className="py-12 sm:py-16 lg:py-28"
			style={{ backgroundColor: "#1C1917" }}
		>
			<div className="container max-w-5xl">
				<div className="problem-header mb-10 sm:mb-16 text-center">
					<small
						className="font-medium text-xs uppercase tracking-wider mb-4 block"
						style={{ color: "#D97706" }}
					>
						{t("home.problem.badge")}
					</small>
					<h2
						className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl"
						style={{ color: "#FAFAF9" }}
					>
						{t("home.problem.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					{cards.map((card) => {
						const Icon = card.icon;
						return (
							<div
								key={card.id}
								className="problem-card rounded-2xl p-4 sm:p-6 lg:p-8 border"
								style={{
									backgroundColor: "#292524",
									borderColor: "#44403C",
								}}
							>
								<div
									className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-4 sm:mb-5"
									style={{ backgroundColor: "#44403C" }}
								>
									<Icon
										className="size-5"
										style={{ color: "#D97706" }}
										strokeWidth={1.5}
									/>
								</div>
								<h3
									className="text-lg font-semibold mb-3"
									style={{ color: "#FAFAF9", fontFamily: "var(--font-sans)" }}
								>
									{t(`home.problem.${card.id}.title`)}
								</h3>
								<p
									className="text-sm leading-relaxed"
									style={{ color: "#A8A29E" }}
								>
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
