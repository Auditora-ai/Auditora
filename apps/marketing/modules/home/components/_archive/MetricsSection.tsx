"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface Metric {
	id: string;
	value: number;
	suffix: string;
	prefix?: string;
}

const METRICS: Metric[] = [
	{ id: "metric1", value: 10, suffix: "x", prefix: "" },
	{ id: "metric2", value: 85, suffix: "%", prefix: "" },
	{ id: "metric3", value: 50, suffix: "+", prefix: "" },
	{ id: "metric4", value: 3, suffix: "", prefix: "" },
];

export function MetricsSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);
	const countersRef = useRef<(HTMLSpanElement | null)[]>([]);

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

			// Header reveal
			tl.from(".metrics-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			// Cards stagger in
			tl.from(
				".metric-card",
				{
					opacity: 0,
					y: 30,
					stagger: 0.15,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);

			// Animate each counter
			METRICS.forEach((metric, i) => {
				const counterEl = countersRef.current[i];
				if (!counterEl) return;

				const counter = { val: 0 };
				tl.to(
					counter,
					{
						val: metric.value,
						duration: 2,
						ease: "power2.out",
						onUpdate: () => {
							const rounded = Math.round(counter.val);
							counterEl.textContent = `${metric.prefix ?? ""}${rounded}`;
						},
					},
					"-=0.3",
				);
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-16 sm:py-20 lg:py-28 bg-white">
			<div className="container max-w-5xl">
				<div className="metrics-header mb-10 sm:mb-14 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.metrics.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-[#0A1428]">
						{t("home.metrics.title")}
					</h2>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
					{METRICS.map((metric, i) => (
						<div
							key={metric.id}
							className="metric-card rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-6 flex flex-col items-center text-center border-t-[3px] border-t-[#3B8FE8]"
						>
							<div className="flex items-baseline gap-0.5 mb-2">
								<span
									ref={(el) => {
										countersRef.current[i] = el;
									}}
									className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A1428]"
								>
									{metric.prefix ?? ""}0
								</span>
								<span className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3B8FE8]">
									{metric.suffix}
								</span>
							</div>
							<p className="text-sm text-[#64748B] leading-relaxed">
								{t(`home.metrics.${metric.id}.label`)}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
