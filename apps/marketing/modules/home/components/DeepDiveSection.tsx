"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageSquareQuoteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const COMPARISON_ROWS = ["processes", "risks", "analysis", "diagram"] as const;

export function DeepDiveSection() {
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

			tl.from(".dd-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			tl.from(
				".dd-left",
				{
					opacity: 0,
					x: -40,
					duration: 0.7,
					ease: "power3.out",
				},
				"-=0.3",
			);

			tl.from(
				".dd-right",
				{
					opacity: 0,
					x: 40,
					duration: 0.7,
					ease: "power3.out",
				},
				"-=0.5",
			);

			tl.from(
				".dd-question",
				{
					opacity: 0,
					y: 20,
					stagger: 0.1,
					duration: 0.5,
					ease: "power3.out",
				},
				"-=0.3",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-12 sm:py-16 lg:py-28">
			<div className="container max-w-5xl">
				<div className="dd-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-wider text-primary mb-4 block">
						{t("home.deepDive.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-foreground">
						{t("home.deepDive.title")}
					</h2>
					<p className="mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground text-balance">
						{t("home.deepDive.subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
					{/* Left column — Methodology */}
					<div className="dd-left">
						<h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
							{t("home.deepDive.methodTitle")}
						</h3>
						<p className="text-muted-foreground text-sm leading-relaxed mb-6">
							{t("home.deepDive.methodDescription")}
						</p>

						<div className="space-y-3">
							{(["question1", "question2", "question3"] as const).map((q) => (
								<div
									key={q}
									className="dd-question flex gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
								>
									<MessageSquareQuoteIcon
										className="size-5 text-primary shrink-0 mt-0.5"
										strokeWidth={1.5}
									/>
									<p className="text-sm text-foreground/80 italic leading-relaxed">
										{t(`home.deepDive.${q}`)}
									</p>
								</div>
							))}
						</div>

						<p className="mt-4 text-sm text-muted-foreground font-medium">
							{t("home.deepDive.methodNote")}
						</p>
					</div>

					{/* Right column — Output comparison */}
					<div className="dd-right">
						<h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
							{t("home.deepDive.outputTitle")}
						</h3>

						<div className="overflow-x-auto rounded-2xl border border-border">
							{/* Table header */}
							<div className="grid grid-cols-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
								<div className="p-3 sm:p-4 bg-muted/30 text-muted-foreground">
									{t("home.deepDive.instant.label")}
								</div>
								<div
									className="p-3 sm:p-4 text-white"
									style={{ backgroundColor: "#D97706" }}
								>
									{t("home.deepDive.guided.label")}
								</div>
							</div>

							{/* Table rows */}
							{COMPARISON_ROWS.map((row, i) => (
								<div
									key={row}
									className="grid grid-cols-2 text-xs sm:text-sm border-t border-border"
								>
									<div className="p-3 sm:p-4 text-muted-foreground bg-card">
										{t(`home.deepDive.instant.${row}`)}
									</div>
									<div className="p-3 sm:p-4 text-foreground font-medium bg-card">
										{t(`home.deepDive.guided.${row}`)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
