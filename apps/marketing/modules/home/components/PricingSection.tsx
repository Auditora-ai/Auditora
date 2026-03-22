"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { LocaleLink } from "@i18n/routing";
import { config as paymentsConfig } from "@repo/payments/config";
import type { PaidPlan } from "@repo/payments/types";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	BadgePercentIcon,
	CheckIcon,
	StarIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

export function PricingSection() {
	const t = useTranslations();
	const format = useFormatter();
	const [interval, setBillingInterval] = useState<"month" | "year">("month");
	const sectionRef = useRef<HTMLElement>(null);
	const cardsContainerRef = useRef<HTMLDivElement>(null);

	const signupUrl = useMemo(
		() =>
			config.saasUrl &&
			`${String(config.saasUrl).replace(/\/$/, "")}/signup`,
		[],
	);

	const plans = useMemo(() => {
		const result: Array<{
			id: string;
			title: string;
			description: string;
			features: string[];
			cta: string;
			recommended?: boolean;
			isEnterprise?: boolean;
			prices?: PaidPlan["prices"];
			to: string;
		}> = [];

		if (!paymentsConfig.requireActiveSubscription) {
			result.push({
				id: "free",
				title: t("pricing.products.free.title") ?? "",
				description: t("pricing.products.free.description") ?? "",
				features: Object.values(
					(t.raw("pricing.products.free.features") as Record<
						string,
						string
					>) ?? {},
				),
				cta: t("pricing.getStarted") ?? "",
				to: signupUrl ?? "#",
			});
		}

		for (const [planId, plan] of Object.entries(paymentsConfig.plans)) {
			const isEnterprise = "isEnterprise" in plan;
			const prices =
				"prices" in plan ? (plan as PaidPlan).prices : undefined;

			result.push({
				id: planId,
				title: t(`pricing.products.${planId}.title`) ?? "",
				description: t(`pricing.products.${planId}.description`) ?? "",
				features: Object.values(
					(t.raw(`pricing.products.${planId}.features`) as Record<
						string,
						string
					>) ?? {},
				),
				cta: isEnterprise
					? (t("pricing.contactSales") ?? "")
					: (t("pricing.getStarted") ?? ""),
				recommended: plan.recommended,
				isEnterprise,
				prices,
				to: signupUrl ?? "#",
			});
		}

		return result;
	}, [t, signupUrl]);

	const hasSubscriptions = plans.some((p) =>
		p.prices?.some((price) => price.type === "subscription"),
	);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			// Header reveal
			const header = sectionRef.current.querySelector(".pricing-header");
			if (header) {
				gsap.from(header.children, {
					opacity: 0,
					y: 30,
					stagger: 0.1,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: header,
						start: "top 85%",
						once: true,
					},
				});
			}

			// Cards cascade with 3D tilt
			const cards = sectionRef.current.querySelectorAll(".pricing-card");
			const recommendedBadge = sectionRef.current.querySelector(".pricing-recommended-badge");

			if (cards.length) {
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: cardsContainerRef.current,
						start: "top 75%",
						once: true,
					},
				});

				// Regular cards cascade
				tl.from(cards, {
					y: 60,
					opacity: 0,
					scale: 0.95,
					rotateX: 5,
					stagger: 0.15,
					duration: 0.7,
					ease: "power3.out",
				});

				// Recommended badge clip-path wipe
				if (recommendedBadge) {
					tl.from(
						recommendedBadge,
						{
							clipPath: "inset(0 100% 0 0)",
							duration: 0.4,
							ease: "power2.inOut",
						},
						"-=0.2",
					);
				}

				// Feature checkmarks micro-stagger
				const checkmarks = sectionRef.current.querySelectorAll(".pricing-feature");
				if (checkmarks.length) {
					tl.from(
						checkmarks,
						{
							opacity: 0,
							x: -10,
							stagger: 0.04,
							duration: 0.3,
							ease: "power3.out",
						},
						"-=0.3",
					);
				}
			}
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="pricing" className="scroll-mt-16 py-12 lg:py-16 border-y">
			<div className="container">
				<div className="pricing-header mb-6 max-w-3xl mx-auto text-center">
					<h2 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-foreground">
						{t("pricing.title")}
					</h2>
					<p className="mt-2 text-foreground/60 text-sm sm:text-lg">
						{t("pricing.description")}
					</p>
				</div>

				<div className="@container">
					{hasSubscriptions && (
						<div className="mb-8 flex justify-center">
							<Tabs
								value={interval}
								onValueChange={(value) =>
									setBillingInterval(
										value as "month" | "year",
									)
								}
								data-test="price-table-interval-tabs"
							>
								<TabsList className="border-foreground/10">
									<TabsTrigger value="month">
										{t("pricing.monthly")}
									</TabsTrigger>
									<TabsTrigger value="year">
										{t("pricing.yearly")}
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					)}
					<div
						ref={cardsContainerRef}
						className={cn(
							"grid grid-cols-1 gap-4",
							plans.length >= 2 && "@xl:grid-cols-2",
							plans.length >= 3 && "@3xl:grid-cols-3",
							plans.length >= 4 && "@4xl:grid-cols-4",
						)}
						style={{ perspective: "1000px" }}
					>
						{plans.map((plan) => {
							const isFree = !plan.prices && !plan.isEnterprise;
							const price = isFree
								? undefined
								: plan.prices?.find(
										(p) =>
											p.type === "one-time" ||
											p.interval === interval,
									);
							const trialPeriodDays =
								price &&
								"trialPeriodDays" in price &&
								price.trialPeriodDays
									? price.trialPeriodDays
									: undefined;

							return (
								<div
									key={plan.id}
									className={cn(
										"pricing-card relative rounded-3xl bg-card border p-6",
										plan.recommended
											? "border-primary"
											: "border-primary/20",
									)}
									data-test="price-table-plan"
								>
									{plan.recommended && (
										<div
											className="pricing-recommended-badge flex items-center justify-center absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-1 text-center font-semibold text-primary-foreground text-xs"
											style={{ clipPath: "inset(0 0% 0 0)" }}
										>
											<StarIcon className="mr-1.5 inline-block size-3" />
											{t("pricing.recommended")}
										</div>
									)}
									<div className="flex h-full flex-col justify-between gap-4">
										<div>
											<h3 className="my-0 font-semibold text-2xl">
												{plan.title}
											</h3>
											{plan.description && (
												<div className="prose mt-2 text-foreground/60 text-sm">
													{plan.description}
												</div>
											)}

											{!!plan.features?.length && (
												<ul className="mt-4 grid list-none gap-2 text-sm">
													{plan.features.map(
														(feature, key) => (
															<li
																key={key}
																className="pricing-feature flex items-center justify-start"
															>
																<CheckIcon className="mr-2 size-4 text-primary" />
																<span>
																	{feature}
																</span>
															</li>
														),
													)}
												</ul>
											)}

											{trialPeriodDays !== undefined &&
												trialPeriodDays > 0 && (
													<div className="mt-4 flex items-center justify-start font-medium text-primary text-sm opacity-80">
														<BadgePercentIcon className="mr-2 size-4" />
														{t(
															"pricing.trialPeriod",
															{
																days: trialPeriodDays,
															},
														)}
													</div>
												)}
										</div>

										<div>
											{isFree && (
												<strong
													className="block font-medium text-2xl lg:text-3xl"
													data-test="price-table-plan-price"
												>
													{format.number(0, {
														style: "currency",
														currency: "USD",
													})}
												</strong>
											)}

											{price && (
												<strong
													className="block font-medium text-2xl lg:text-3xl"
													data-test="price-table-plan-price"
												>
													{format.number(
														price.amount,
														{
															style: "currency",
															currency:
																price.currency,
														},
													)}
													{price.type ===
														"subscription" && (
														<span className="font-normal text-xs opacity-60">
															/
															{price.interval ===
															"year"
																? t(
																		"pricing.year",
																		{
																			count: 1,
																		},
																	)
																: t(
																		"pricing.month",
																		{
																			count: 1,
																		},
																	)}
														</span>
													)}
												</strong>
											)}

											{plan.to.startsWith("/") ? (
												<Button
													className="mt-4 w-full"
													variant={
														plan.recommended
															? "primary"
															: "secondary"
													}
													asChild
												>
													<LocaleLink href={plan.to}>
														{plan.cta}
														<ArrowRightIcon className="ml-2 size-4" />
													</LocaleLink>
												</Button>
											) : (
												<Button
													className="mt-4 w-full"
													variant={
														plan.recommended
															? "primary"
															: "secondary"
													}
													asChild
												>
													<a href={plan.to}>
														{plan.cta}
														<ArrowRightIcon className="ml-2 size-4" />
													</a>
												</Button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
