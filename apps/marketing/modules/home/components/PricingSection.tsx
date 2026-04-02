"use client";

import { config } from "@config";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	CheckIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const PLAN_IDS = ["starter", "growth", "scale", "enterprise"] as const;

const PLAN_METRICS = {
	starter: { processes: "3", evaluations: "10", evaluators: "5" },
	growth: { processes: "15", evaluations: "50", evaluators: "30" },
	scale: { processes: "∞", evaluations: "250", evaluators: "150" },
	enterprise: { processes: "∞", evaluations: "∞", evaluators: "∞" },
} as const;

const PLAN_STYLES = {
	starter: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
	growth: {
		card: "border-[#00E5C0]/40 bg-[#00E5C0]/[0.04] ring-1 ring-[#00E5C0]/20",
		price: "text-[#00E5C0]",
		cta: "bg-[#00E5C0] hover:bg-[#00C4A3] text-[#0A1428]",
	},
	scale: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
	enterprise: {
		card: "border-white/[0.08] bg-white/[0.03]",
		price: "text-white",
		cta: "border-white/10 text-white hover:bg-white/5",
	},
} as const;

export function PricingSection() {
	const t = useTranslations();

	const signupUrl = useMemo(
		() =>
			config.saasUrl &&
			`${String(config.saasUrl).replace(/\/$/, "")}/signup`,
		[],
	);

	return (
		<section id="pricing" className="scroll-mt-16 py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="anim-fade-up mb-4 max-w-3xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-[#00E5C0]/30 bg-[#00E5C0]/10 px-4 py-1.5 mb-6">
						<ZapIcon className="size-3.5 text-[#00E5C0]" strokeWidth={2} />
						<span className="text-xs font-medium uppercase tracking-widest text-[#00E5C0]">
							Pricing
						</span>
					</div>
				</div>
				<h2 className="anim-fade-up anim-d1 font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white max-w-3xl mx-auto text-center leading-tight">
					{t("pricing.title")}
				</h2>
				<p className="anim-fade-up anim-d2 mt-4 text-[#94A3B8] text-sm sm:text-base max-w-xl mx-auto text-center leading-relaxed">
					{t("pricing.subtitle")}
				</p>

				{/* Plans grid */}
				<div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
					{PLAN_IDS.map((planId, index) => {
						const metrics = PLAN_METRICS[planId];
						const styles = PLAN_STYLES[planId];
						const isRecommended = planId === "growth";
						const isEnterprise = planId === "enterprise";

						const features = t.raw(
							`pricing.products.${planId}.features`,
						) as Record<string, string>;
						const featureList = Object.values(features);

						return (
							<div
								key={planId}
								className={cn(
									"anim-fade-up relative rounded-2xl border p-6 lg:p-7 transition-all",
									styles.card,
									isRecommended && "lg:-mt-3 lg:mb-3",
								)}
								style={{ animationDelay: `${(index + 3) * 80}ms` }}
							>
								{isRecommended && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00E5C0] px-3.5 py-1 text-xs font-semibold text-[#0A1428]">
										{t("pricing.recommended")}
									</div>
								)}

								<div className="flex flex-col h-full">
									{/* Plan name + description */}
									<h3 className="text-lg font-semibold text-white">
										{t(`pricing.products.${planId}.title`)}
									</h3>
									<p className="mt-1.5 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
										{t(`pricing.products.${planId}.description`)}
									</p>

									{/* Key metrics row */}
									<div className="mt-5 flex items-baseline gap-4">
										<span className={cn("font-display text-3xl sm:text-4xl font-bold tracking-tight", styles.price)}>
											{t(`pricing.products.${planId}.price`)}
										</span>
										<span className="text-sm text-[#64748B]">
											{t(`pricing.products.${planId}.unit`)}
										</span>
									</div>

									{/* Metrics badges */}
									<div className="mt-4 flex flex-wrap gap-2">
										<span className="inline-flex items-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-[#94A3B8]">
											{metrics.processes} proc
										</span>
										<span className="inline-flex items-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-[#94A3B8]">
											{metrics.evaluations} eval
										</span>
										<span className="inline-flex items-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-[#94A3B8]">
											{metrics.evaluators} users
										</span>
									</div>

									{/* Features */}
									<ul className="mt-6 flex-1 space-y-2.5">
										{featureList.map((feature, key) => (
											<li
												key={key}
												className="flex items-start gap-2.5 text-sm"
											>
												<CheckIcon className="mt-0.5 size-4 shrink-0 text-[#00E5C0]" />
												<span className="text-white/70 leading-snug">
													{feature}
												</span>
											</li>
										))}
									</ul>

									{/* CTA */}
									<div className="mt-6">
										{isEnterprise ? (
											<Button
												variant="secondary"
												className={cn("w-full", styles.cta)}
												asChild
											>
												<a href="mailto:sales@auditora.ai?subject=Auditora.ai Enterprise">
													{t("pricing.contactSales")}
													<ArrowRightIcon className="ml-2 size-4" />
												</a>
											</Button>
										) : (
											<Button
												variant={isRecommended ? "primary" : "secondary"}
												className={cn("w-full", styles.cta)}
												asChild
											>
												<a href={signupUrl ?? "#"}>
													{t("pricing.getStarted")}
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
