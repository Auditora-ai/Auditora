"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpenCheckIcon, WorkflowIcon, ShieldAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const differentiators = [
	{ id: "diff1", icon: BookOpenCheckIcon },
	{ id: "diff2", icon: WorkflowIcon },
	{ id: "diff3", icon: ShieldAlertIcon },
] as const;

export function SolutionSection() {
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

			tl.from(".solution-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".solution-card",
				{
					opacity: 0,
					x: -40,
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
		<section ref={sectionRef} className="py-20 lg:py-28">
			<div className="container max-w-4xl">
				<div className="solution-header mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.solution.badge")}
					</small>
					<h2 className="font-display text-3xl lg:text-4xl xl:text-5xl text-foreground">
						{t("home.solution.title")}
					</h2>
					<p className="mt-6 text-base lg:text-lg text-muted-foreground text-balance leading-relaxed">
						{t("home.solution.description")}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-5">
					{differentiators.map((diff) => {
						const Icon = diff.icon;
						return (
							<div
								key={diff.id}
								className="solution-card flex gap-5 rounded-2xl border border-border bg-card p-6 lg:p-8"
								style={{ borderLeftWidth: "3px", borderLeftColor: "#D97706" }}
							>
								<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
									<Icon className="size-5" strokeWidth={1.5} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-foreground mb-2">
										{t(`home.solution.${diff.id}.title`)}
									</h3>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{t(`home.solution.${diff.id}.description`)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
