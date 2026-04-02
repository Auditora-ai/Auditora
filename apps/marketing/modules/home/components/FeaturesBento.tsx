"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@repo/ui";
import {
	Scan,
	GitBranch,
	Shield,
	MessageSquare,
	FileText,
	Play,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
	id: string;
	icon: LucideIcon;
	span: string;
	highlighted?: boolean;
}

const features: Feature[] = [
	{
		id: "feature1",
		icon: Scan,
		span: "md:col-span-2",
	},
	{
		id: "feature2",
		icon: GitBranch,
		span: "md:col-span-1",
	},
	{
		id: "feature3",
		icon: Shield,
		span: "md:col-span-1",
	},
	{
		id: "feature4",
		icon: MessageSquare,
		span: "md:col-span-1",
	},
	{
		id: "feature5",
		icon: FileText,
		span: "md:col-span-1",
	},
	{
		id: "feature6",
		icon: Play,
		span: "md:col-span-2",
		highlighted: true,
	},
];

export function FeaturesBento() {
	const t = useTranslations("home.features");
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

			// Header reveal
			tl.from(".bento-features-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			// Cards staggered entrance
			tl.from(
				".bento-features-card",
				{
					opacity: 0,
					y: 40,
					scale: 0.97,
					stagger: 0.1,
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
			className="py-16 sm:py-20 lg:py-28 bg-[#111827]"
		>
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="bento-features-header mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<span className="inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6">
						{t("badge")}
					</span>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("title")}
					</h2>
					<p className="mt-4 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Bento Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.id}
								className={cn(
									"bento-features-card rounded-2xl border p-5 sm:p-6 lg:p-8 transition-all duration-300",
									feature.span,
									feature.highlighted
										? "border-[#00E5C0]/50 bg-[#00E5C0]/5 backdrop-blur-sm shadow-lg shadow-[#00E5C0]/5 hover:border-[#00E5C0]/70"
										: "border-white/10 bg-white/5 backdrop-blur-sm hover:border-[#00E5C0]/30 hover:bg-white/[0.07]",
								)}
							>
								<div className="flex items-center gap-3 mb-3">
									<div
										className={cn(
											"flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
											feature.highlighted
												? "bg-[#00E5C0]/20"
												: "bg-[#00E5C0]/15",
										)}
									>
										<Icon
											className="size-5 text-[#00E5C0]"
											strokeWidth={1.5}
										/>
									</div>
									<h3 className="font-display text-base sm:text-lg font-semibold text-white">
										{t(`${feature.id}.title`)}
									</h3>
								</div>
								<p className="text-sm text-[#94A3B8] leading-relaxed">
									{t(`${feature.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
