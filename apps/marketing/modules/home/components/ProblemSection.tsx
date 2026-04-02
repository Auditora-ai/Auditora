"use client";

import { AlertTriangleIcon, FileXIcon, ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const painCards = [
	{ id: "pain1", icon: ClockIcon },
	{ id: "pain2", icon: FileXIcon },
	{ id: "pain3", icon: AlertTriangleIcon },
] as const;

export function ProblemSection() {
	const t = useTranslations();

	return (
		<section className="py-16 sm:py-20 lg:py-28 bg-[#111827]">
			<div className="container max-w-6xl">
				{/* Header */}
				<div className="mb-10 sm:mb-14 text-center">
					<span className="anim-fade-up inline-flex items-center rounded-full bg-[#00E5C0]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5C0] mb-6">
						{t("home.problem.badge")}
					</span>
					<h2 className="anim-fade-up anim-d1 font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white max-w-3xl mx-auto leading-tight">
						{t("home.problem.title")}
					</h2>
				</div>

				{/* Large Stat */}
				<div className="text-center mb-14 sm:mb-20">
					<div className="anim-fade-up anim-d2 font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-[#00E5C0] leading-none">
						73%
					</div>
					<p className="anim-fade-up anim-d3 mt-4 text-base sm:text-lg text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
						{t("home.problem.statLabel")}
					</p>
					<p className="anim-fade-up anim-d4 mt-2 text-xs text-[#64748B]">
						{t("home.problem.statSource")}
					</p>
				</div>

				{/* Pain Point Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					{painCards.map((card, index) => {
						const Icon = card.icon;
						return (
							<div
								key={card.id}
								className={`anim-fade-up anim-d${index + 1} rounded-2xl p-5 sm:p-6 lg:p-8 border border-white/10 bg-white/5 backdrop-blur-sm`}
							>
								<div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#00E5C0]/15">
									<Icon
										className="size-5 text-[#00E5C0]"
										strokeWidth={1.5}
									/>
								</div>
								<h3 className="text-lg font-semibold mb-3 text-white">
									{t(`home.problem.${card.id}.title`)}
								</h3>
								<p className="text-sm leading-relaxed text-[#94A3B8]">
									{t(`home.problem.${card.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
