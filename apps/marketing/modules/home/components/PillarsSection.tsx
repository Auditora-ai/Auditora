"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@repo/ui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	BrainCircuit,
	GitBranch,
	Layers,
	MessageSquareText,
	Mic,
	Search,
	Share2,
	Sparkles,
	Users,
	Video,
	Workflow,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
	{
		id: "pillar1",
		icon: MessageSquareText,
		benefits: [
			{ icon: Sparkles, key: "benefit1" },
			{ icon: Layers, key: "benefit2" },
			{ icon: GitBranch, key: "benefit3" },
		],
	},
	{
		id: "pillar2",
		icon: Video,
		benefits: [
			{ icon: Mic, key: "benefit1" },
			{ icon: Sparkles, key: "benefit2" },
			{ icon: Workflow, key: "benefit3" },
		],
	},
	{
		id: "pillar3",
		icon: BrainCircuit,
		benefits: [
			{ icon: Search, key: "benefit1" },
			{ icon: Search, key: "benefit2" },
			{ icon: Users, key: "benefit3" },
		],
	},
	{
		id: "pillar4",
		icon: Workflow,
		benefits: [
			{ icon: Layers, key: "benefit1" },
			{ icon: GitBranch, key: "benefit2" },
			{ icon: Share2, key: "benefit3" },
		],
	},
] as const;

export function PillarsSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Header reveal
			if (headerRef.current) {
				gsap.from(headerRef.current.children, {
					opacity: 0,
					y: 30,
					stagger: 0.1,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: headerRef.current,
						start: "top 85%",
						once: true,
					},
				});
			}

			// Each card gets independent ScrollTrigger with alternating direction
			cardsRef.current.forEach((card, i) => {
				if (!card) return;

				const direction = i % 2 === 0 ? 60 : -60;
				const iconEl = card.querySelector(".pillar-icon");
				const textEls = card.querySelectorAll(".pillar-text");
				const benefitEls = card.querySelectorAll(".pillar-benefit");

				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: card,
						start: "top 80%",
						once: true,
					},
				});

				// Card slides in from alternating direction
				tl.from(card, {
					opacity: 0,
					x: direction,
					duration: 0.8,
					ease: "power3.out",
				});

				// Icon bounces in
				if (iconEl) {
					tl.from(
						iconEl,
						{
							scale: 0,
							duration: 0.5,
							ease: "back.out(2.5)",
						},
						"-=0.4",
					);
				}

				// Text elements stagger
				if (textEls.length) {
					tl.from(
						textEls,
						{
							opacity: 0,
							y: 20,
							stagger: 0.08,
							duration: 0.5,
							ease: "power3.out",
						},
						"-=0.3",
					);
				}

				// Benefits cascade with slight directional shift
				if (benefitEls.length) {
					tl.from(
						benefitEls,
						{
							opacity: 0,
							x: direction * 0.3,
							stagger: 0.08,
							duration: 0.4,
							ease: "power3.out",
						},
						"-=0.2",
					);
				}
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="features" className="scroll-my-20 py-20 lg:py-28">
			<div className="container">
				<div ref={headerRef} className="mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.pillars.badge")}
					</small>
					<h2 className="font-display text-3xl lg:text-4xl xl:text-5xl text-foreground">
						{t("home.pillars.title")}
					</h2>
					<p className="mt-4 text-base lg:text-lg text-muted-foreground text-balance">
						{t("home.pillars.description")}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8">
					{pillars.map((pillar, index) => {
						const Icon = pillar.icon;
						const isReversed = index % 2 === 1;

						return (
							<div
								key={pillar.id}
								ref={(el) => {
									cardsRef.current[index] = el;
								}}
								className="bg-card border rounded-3xl p-6 md:p-8 lg:p-12"
							>
								<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
									<div
										className={cn("flex flex-col", {
											"md:order-2": isReversed,
										})}
									>
										<div className="flex items-center gap-3 mb-4">
											<div className="pillar-icon flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
												<Icon className="size-5" strokeWidth={1.5} />
											</div>
										</div>

										<h3 className="pillar-text text-xl lg:text-2xl text-foreground leading-tight">
											<span className="font-semibold">
												{t(`home.pillars.${pillar.id}.title`)}.{" "}
											</span>
											<span className="text-muted-foreground">
												{t(`home.pillars.${pillar.id}.subtitle`)}
											</span>
										</h3>

										<p className="pillar-text mt-4 text-muted-foreground leading-relaxed">
											{t(`home.pillars.${pillar.id}.description`)}
										</p>
									</div>

									<div
										className={cn(
											"grid gap-4 sm:grid-cols-1 lg:grid-cols-1",
											{ "md:order-1": isReversed },
										)}
									>
										{pillar.benefits.map((benefit) => {
											const BenefitIcon = benefit.icon;
											return (
												<div
													key={benefit.key}
													className="pillar-benefit flex gap-4 rounded-2xl p-4 bg-muted/50"
												>
													<div className="flex-shrink-0">
														<BenefitIcon
															className="size-5 text-primary mt-0.5"
															strokeWidth={1.5}
														/>
													</div>
													<div>
														<strong className="block font-medium text-sm text-foreground">
															{t(`home.pillars.${pillar.id}.${benefit.key}.title`)}
														</strong>
														<p className="mt-1 text-xs text-muted-foreground leading-relaxed">
															{t(`home.pillars.${pillar.id}.${benefit.key}.description`)}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
