"use client";

import { config } from "@config";
import { useGSAP } from "@gsap/react";
import { LocaleLink } from "@i18n/routing";
import { config as paymentsConfig } from "@repo/payments/config";
import type { PaidPlan, SubscriptionPrice } from "@repo/payments/types";
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
				to: isEnterprise
					? "mailto:sales@prozea.com?subject=Prozea Enterprise"
					: (signupUrl ?? "#"),
			});
		}

		return result;
	}, [t, signupUrl]);

	const hasSubscriptions = plans.some((p) =>
		p.prices?.some((price) => price.type === "subscription"),
	);

	// Calculate yearly savings percentage
	const yearlySavingsPercent = useMemo(() => {
		for (const plan of Object.values(paymentsConfig.plans)) {
			if (!("prices" in plan)) continue;
			const monthly = (plan as PaidPlan).prices.find(
				(p) => p.type === "subscription" && p.interval === "month",
			) as (SubscriptionPrice & { amount: number }) | undefined;
			const yearly = (plan as PaidPlan).prices.find(
				(p) => p.type === "subscription" && p.interval === "year",
			) as (SubscriptionPrice & { amount: number }) | undefined;
			if (monthly && yearly) {
				return Math.round(
					(1 - yearly.amount / (monthly.amount * 12)) * 100,
				);
			}
		}
		return 0;
	}, []);

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
			const cards =
				sectionRef.current.querySelectorAll(".pricing-card");
			const recommendedBadge =
				sectionRef.current.querySelector(".pricing-recommended-badge");

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
				const checkmarks =
					sectionRef.current.querySelectorAll(".pricing-feature");
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
		<section
			ref={sectionRef}
			id="pricing"
			className="scroll-mt-16 py-16 lg:py-24 border-y"
		>
			<div className="container">
				<div className="pricing-header mb-10 max-w-3xl mx-auto text-center">
					<h2 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight text-foreground">
						{t("pricing.title")}
					</h2>
					<p className="mt-3 text-foreground/60 text-sm sm:text-lg">
						{t("pricing.description")}
					</p>
				</div>

				{hasSubscriptions && (
					<div className="mb-10 flex items-center justify-center gap-3">
						<Tabs
							value={interval}
							onValueChange={(value) =>
								setBillingInterval(value as "month" | "year")
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
						{yearlySavingsPercent > 0 && (
							<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
								{t("pricing.savePercent", {
									percent: yearlySavingsPercent,
								})}
							</span>
						)}
					</div>
				)}

				<div
					ref={cardsContainerRef}
					className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-5xl mx-auto items-start"
					style={{ perspective: "1000px" }}
				>
					{plans.map((plan) => {
						const price = plan.prices?.find(
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

						// Calculate monthly equivalent for yearly pricing
						const monthlyEquivalent =
							price?.type === "subscription" &&
							price.interval === "year"
								? Math.round(price.amount / 12)
								: undefined;

						return (
							<div
								key={plan.id}
								className={cn(
									"pricing-card relative rounded-3xl bg-card border p-6 lg:p-8 transition-shadow",
									plan.recommended
										? "border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/10 lg:scale-105"
										: "border-border",
								)}
								data-test="price-table-plan"
							>
								{plan.recommended && (
									<div
										className="pricing-recommended-badge flex items-center justify-center absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-center font-semibold text-primary-foreground text-sm"
										style={{
											clipPath: "inset(0 0% 0 0)",
										}}
									>
										<StarIcon className="mr-1.5 inline-block size-3.5" />
										{t("pricing.recommended")}
									</div>
								)}
								<div className="flex h-full flex-col justify-between gap-6">
									<div>
										<h3 className="my-0 font-semibold text-2xl">
											{plan.title}
										</h3>
										{plan.description && (
											<p className="mt-2 text-foreground/60 text-sm">
												{plan.description}
											</p>
										)}

										{/* Price display */}
										<div className="mt-6">
											{plan.isEnterprise ? (
												<div className="font-medium text-2xl lg:text-3xl">
													Custom
												</div>
											) : price ? (
												<div data-test="price-table-plan-price">
													{monthlyEquivalent !==
													undefined ? (
														<>
															<span className="font-medium text-2xl lg:text-3xl">
																{format.number(
																	monthlyEquivalent,
																	{
																		style: "currency",
																		currency:
																			price.currency,
																		maximumFractionDigits: 0,
																	},
																)}
															</span>
															<span className="font-normal text-sm opacity-60">
																{t(
																	"pricing.perMonth",
																)}
															</span>
															{("seatBased" in
																price &&
																price.seatBased) && (
																<span className="font-normal text-sm opacity-60">
																	{" "}
																	/{" "}
																	{t(
																		"pricing.perSeat",
																	)}
																</span>
															)}
															<p className="mt-1 text-xs text-foreground/50">
																{format.number(
																	price.amount,
																	{
																		style: "currency",
																		currency:
																			price.currency,
																		maximumFractionDigits: 0,
																	},
																)}{" "}
																{t(
																	"pricing.billedAnnually",
																)}
															</p>
														</>
													) : (
														<>
															<span className="font-medium text-2xl lg:text-3xl">
																{format.number(
																	price.amount,
																	{
																		style: "currency",
																		currency:
																			price.currency,
																		maximumFractionDigits: 0,
																	},
																)}
															</span>
															{price.type ===
																"subscription" && (
																<span className="font-normal text-sm opacity-60">
																	/
																	{t(
																		"pricing.month",
																		{
																			count: 1,
																		},
																	)}
																</span>
															)}
															{("seatBased" in
																price &&
																price.seatBased) && (
																<span className="font-normal text-sm opacity-60">
																	{" "}
																	/{" "}
																	{t(
																		"pricing.perSeat",
																	)}
																</span>
															)}
														</>
													)}
												</div>
											) : null}
										</div>

										{trialPeriodDays !== undefined &&
											trialPeriodDays > 0 && (
												<div className="mt-3 flex items-center justify-start font-medium text-primary text-sm">
													<BadgePercentIcon className="mr-2 size-4" />
													{t(
														"pricing.trialPeriod",
														{
															days: trialPeriodDays,
														},
													)}
												</div>
											)}

										{!!plan.features?.length && (
											<ul className="mt-6 grid list-none gap-2.5 text-sm">
												{plan.features.map(
													(feature, key) => (
														<li
															key={key}
															className="pricing-feature flex items-center justify-start"
														>
															<CheckIcon className="mr-2.5 size-4 shrink-0 text-primary" />
															<span>
																{feature}
															</span>
														</li>
													),
												)}
											</ul>
										)}
									</div>

									<div>
										{plan.isEnterprise ? (
											<Button
												className="mt-4 w-full"
												variant="secondary"
												asChild
											>
												<a href={plan.to}>
													{plan.cta}
													<ArrowRightIcon className="ml-2 size-4" />
												</a>
											</Button>
										) : plan.to.startsWith("/") ? (
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
		</section>
	);
}
