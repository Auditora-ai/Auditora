"use client";

import { cn } from "@repo/ui";
import { useScrollReveal } from "@shared/hooks/use-scroll-reveal";
import { AwardIcon, EyeIcon, LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const pillars = [
	{ id: "pillar1", icon: AwardIcon },
	{ id: "pillar2", icon: EyeIcon },
	{ id: "pillar3", icon: LockIcon },
] as const;

export function CredibilitySection() {
	const t = useTranslations();
	const { ref, inView } = useScrollReveal();

	return (
		<section ref={ref} id="methodology" className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-5xl">
				<div className="mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<small className={cn("reveal-fade-up font-medium text-xs uppercase tracking-widest text-[#00E5C0] mb-4 block", inView && "is-visible")}>
						{t("home.credibility.badge")}
					</small>
					<h2 className={cn("reveal-fade-up delay-100 font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white", inView && "is-visible")}>
						{t("home.credibility.title")}
					</h2>
				</div>

				<div className="stagger grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
					{pillars.map((pillar) => {
						const Icon = pillar.icon;
						return (
							<div key={pillar.id} className={cn("reveal-fade-up card-lift text-center", inView && "is-visible")}>
								<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#00E5C0]/15 text-[#00E5C0] mx-auto mb-5">
									<Icon className="size-6" strokeWidth={1.5} />
								</div>
								<h3 className="text-base font-semibold text-white mb-3">
									{t(`home.credibility.${pillar.id}.title`)}
								</h3>
								<p className="text-sm text-[#94A3B8] leading-relaxed">
									{t(`home.credibility.${pillar.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
