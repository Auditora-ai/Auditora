"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIAL_KEYS = ["testimonial1", "testimonial2", "testimonial3"] as const;

const LOGO_PLACEHOLDERS = [
	"Firmas Big4",
	"Consultoras líderes",
	"Empresas Fortune 500",
];

export function SocialProofSection() {
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

			tl.from(".sp-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".sp-card",
				{
					opacity: 0,
					y: 30,
					stagger: 0.15,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);

			tl.from(
				".sp-logos",
				{
					opacity: 0,
					y: 15,
					duration: 0.5,
					ease: "power2.out",
				},
				"-=0.2",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="cases" className="py-16 sm:py-20 lg:py-28 bg-white">
			<div className="container max-w-5xl">
				<div className="sp-header mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#00E5C0] mb-4 block">
						{t("home.socialProof.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-[#0A1428]">
						{t("home.socialProof.title")}
					</h2>
				</div>

				{/* Testimonial cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
					{TESTIMONIAL_KEYS.map((key) => (
						<div
							key={key}
							className="sp-card rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-6 flex flex-col"
						>
							{/* Stars */}
							<div className="flex gap-0.5 mb-4">
								{Array.from({ length: 5 }).map((_, i) => (
									<StarIcon
										key={i}
										className="size-4 fill-[#00E5C0] text-[#00E5C0]"
									/>
								))}
							</div>

							{/* Quote */}
							<p className="text-sm text-[#0A1428]/80 italic leading-relaxed flex-1 mb-5">
								&ldquo;{t(`home.socialProof.${key}.quote`)}&rdquo;
							</p>

							{/* Author */}
							<div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
								<div className="w-10 h-10 rounded-full bg-[#00E5C0]/15 flex items-center justify-center text-[#00E5C0] font-semibold text-sm">
									{t(`home.socialProof.${key}.name`).split(" ").map(n => n[0]).join("")}
								</div>
								<div>
									<p className="text-sm font-semibold text-[#0A1428]">
										{t(`home.socialProof.${key}.name`)}
									</p>
									<p className="text-xs text-[#64748B]">
										{t(`home.socialProof.${key}.role`)}, {t(`home.socialProof.${key}.company`)}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Logo strip */}
				<div className="sp-logos mt-12 sm:mt-16">
					<p className="text-xs uppercase tracking-widest text-[#94A3B8] text-center mb-6 font-medium">
						{t("home.socialProof.logosLabel")}
					</p>
					<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
						{LOGO_PLACEHOLDERS.map((label) => (
							<div
								key={label}
								className="px-5 py-2.5 rounded-lg bg-[#F1F5F9] text-[#94A3B8] text-xs font-medium tracking-wide"
							>
								{label}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
