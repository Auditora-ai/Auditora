"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { Button } from "@repo/ui/components/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	FolderOpenIcon,
	MessageCircleIcon,
	WorkflowIcon,
	ShieldCheckIcon,
	UsersIcon,
	FileOutputIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const features = [
	{ id: "feature1", icon: FolderOpenIcon },
	{ id: "feature2", icon: MessageCircleIcon },
	{ id: "feature3", icon: WorkflowIcon },
	{ id: "feature4", icon: ShieldCheckIcon },
	{ id: "feature5", icon: UsersIcon },
	{ id: "feature6", icon: FileOutputIcon },
] as const;

export function PlatformFeaturesSection() {
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

			tl.from(".pf-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".pf-card",
				{
					opacity: 0,
					y: 30,
					scale: 0.95,
					stagger: { from: "start", each: 0.08 },
					duration: 0.6,
					ease: "back.out(1.4)",
				},
				"-=0.3",
			);

			tl.from(
				".pf-cta",
				{
					opacity: 0,
					y: 20,
					duration: 0.5,
					ease: "power3.out",
				},
				"-=0.2",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-12 sm:py-16 lg:py-28">
			<div className="container max-w-5xl">
				<div className="pf-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.platform.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-foreground">
						{t("home.platform.title")}
					</h2>
					<p className="mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground text-balance">
						{t("home.platform.subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.id}
								className="pf-card rounded-2xl border border-border bg-card p-4 sm:p-6"
							>
								<div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary mb-4">
									<Icon className="size-5" strokeWidth={1.5} />
								</div>
								<h3 className="text-base font-semibold text-foreground mb-2">
									{t(`home.platform.${feature.id}.title`)}
								</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{t(`home.platform.${feature.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>

				<div className="pf-cta mt-8 sm:mt-12 text-center">
					<Button size="lg" variant="primary" asChild>
						<a href={`${config.saasUrl}/sign-up`}>
							{t("home.platform.cta")}
							<ArrowRightIcon className="ml-2 size-4" />
						</a>
					</Button>
					<p className="mt-3 text-sm text-muted-foreground">
						{t("home.platform.ctaSubtext")}
					</p>
				</div>
			</div>
		</section>
	);
}
