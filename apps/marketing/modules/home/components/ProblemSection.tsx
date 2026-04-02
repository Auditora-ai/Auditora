"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangleIcon, FileXIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const painCards = [
	{ id: "pain1", icon: ClockIcon },
	{ id: "pain2", icon: FileXIcon },
	{ id: "pain3", icon: AlertTriangleIcon },
] as const;

export function ProblemSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const statRef = useRef<HTMLDivElement>(null);

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

			// Header reveal
			tl.from(".problem-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			// Stat counter animation
			tl.from(
				".problem-stat-number",
				{
					opacity: 0,
					y: 40,
					scale: 0.8,
					duration: 0.8,
					ease: "back.out(1.4)",
				},
				"-=0.2",
			);

			tl.from(
				".problem-stat-label",
				{
					opacity: 0,
					y: 20,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.4",
			);

			tl.from(
				".problem-stat-source",
				{
					opacity: 0,
					duration: 0.4,
					ease: "power2.out",
				},
				"-=0.2",
			);

			// Cards staggered entrance
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

			// Animate the stat counter number
			if (statRef.current) {
				const obj = { val: 0 };
				tl.to(
					obj,
					{
						val: 73,
						duration: 2,
						ease: "power2.out",
						onUpdate: () => {
							if (statRef.current) {
								statRef.current.textContent = `${Math.round(obj.val)}%`;
							}
						},
					},
					"<",
				);
			}
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-16 sm:py-20 lg:py-28 bg-[#111827]"
		>
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="problem-header mb-10 sm:mb-14 text-center">
					<span className="inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6">
						{t("home.problem.badge")}
					</span>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white max-w-3xl mx-auto leading-tight">
						{t("home.problem.title")}
					</h2>
				</div>

				{/* Large Stat */}
				<div className="text-center mb-14 sm:mb-20">
					<div className="problem-stat-number font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-[#00E5C0] leading-none">
						<span ref={statRef}>0%</span>
					</div>
					<p className="problem-stat-label mt-4 text-base sm:text-lg text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
						{t("home.problem.statLabel")}
					</p>
					<p className="problem-stat-source mt-2 text-xs text-[#64748B]">
						{t("home.problem.statSource")}
					</p>
				</div>

				{/* Pain Point Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					{painCards.map((card) => {
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
