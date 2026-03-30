"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AwardIcon, EyeIcon, LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
	{ id: "pillar1", icon: AwardIcon },
	{ id: "pillar2", icon: EyeIcon },
	{ id: "pillar3", icon: LockIcon },
] as const;

export function CredibilitySection() {
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

			tl.from(".cred-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".cred-card",
				{
					opacity: 0,
					y: 30,
					stagger: 0.12,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-16 lg:py-20 border-y border-border">
			<div className="container max-w-5xl">
				<div className="cred-header mb-12 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.credibility.badge")}
					</small>
					<h2 className="font-display text-3xl lg:text-4xl text-foreground">
						{t("home.credibility.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{pillars.map((pillar) => {
						const Icon = pillar.icon;
						return (
							<div key={pillar.id} className="cred-card text-center">
								<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-4">
									<Icon className="size-6" strokeWidth={1.5} />
								</div>
								<h3 className="text-base font-semibold text-foreground mb-2">
									{t(`home.credibility.${pillar.id}.title`)}
								</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
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
