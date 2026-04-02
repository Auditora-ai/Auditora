"use client";

import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";

const steps = [
	{ id: "step1", number: "01", titleKey: "title", descKey: "description" },
	{ id: "step2", number: "02", titleKey: "title", descKey: "description" },
	{ id: "step3", number: "03", titleKey: "title", descKey: "description" },
	{ id: "step4", number: "04", titleKey: "title", descKey: "description" },
	{ id: "step5", number: "05", titleKey: "title", descKey: "description" },
	{ id: "step6", number: "06", titleKey: "title", descKey: "description" },
] as const;

export function ProductFlow() {
	const t = useTranslations("home.productFlow");

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#0A1428]">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="productflow-header mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<span className="anim-fade-up inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6">
						{t("badge")}
					</span>
					<h2 className="anim-fade-up anim-d1 font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("title")}
					</h2>
					<p className="anim-fade-up anim-d2 mt-4 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Steps Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
					{steps.map((step, index) => (
						<div
							key={step.id}
							className={cn(
								`anim-fade-up anim-d${index + 1} productflow-card relative rounded-2xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 hover:bg-white/[0.07]`,
								step.id === "step5"
									? "border-[#00E5C0]/50 bg-[#00E5C0]/5 shadow-lg shadow-[#00E5C0]/5"
									: "border-white/10 bg-white/5 backdrop-blur-sm hover:border-[#00E5C0]/20",
							)}
						>
							{/* Step number */}
							<span
								className={cn(
									"font-display text-4xl sm:text-5xl font-bold leading-none",
									step.id === "step5"
										? "text-[#00E5C0]"
										: "text-white/10",
								)}
							>
								{step.number}
							</span>

							{/* Title */}
							<h3 className="mt-4 text-lg font-semibold text-white">
								{t(`${step.id}.${step.titleKey}`)}
							</h3>

							{/* Description */}
							<p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
								{t(`${step.id}.${step.descKey}`)}
							</p>

							{/* Star badge for Simulate */}
							{step.id === "step5" && (
								<span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#00E5C0]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00E5C0]">
									★ {t("starFeature")}
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
