"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageSquareQuoteIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { FmeaTableMock } from "./FmeaTableMock";

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
					duration: 0.8,
					ease: "power3.out",
				},
				"-=0.3",
			);

			tl.from(
				".dd-right",
				{
					opacity: 0,
					x: 40,
					duration: 0.8,
					ease: "power3.out",
				},
				"-=0.5",
			);

			// Sequential question bubbles
			tl.from(
				".dd-question",
				{
					opacity: 0,
					y: 20,
					scale: 0.95,
					stagger: 0.3,
					duration: 0.5,
					ease: "power3.out",
				},
				"-=0.3",
			);

			// FMEA table fade
			tl.from(
				".dd-fmea",
				{
					opacity: 0,
					y: 20,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.2",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-16 sm:py-20 lg:py-28 bg-white">
			<div className="container max-w-6xl">
				<div className="dd-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.deepDive.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-[#0A1428]">
						{t("home.deepDive.title")}
					</h2>
					<p className="mt-4 text-sm sm:text-base lg:text-lg text-[#64748B] text-balance">
						{t("home.deepDive.subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
					{/* Left column — Methodology + Questions */}
					<div className="dd-left">
						<h3 className="text-lg sm:text-xl font-semibold text-[#0A1428] mb-4">
							{t("home.deepDive.methodTitle")}
						</h3>
						<p className="text-[#64748B] text-sm leading-relaxed mb-6">
							{t("home.deepDive.methodDescription")}
						</p>

						<div className="space-y-3">
							{(["question1", "question2", "question3"] as const).map((q) => (
								<div
									key={q}
									className="dd-question flex gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:p-4"
									style={{ borderLeftWidth: "3px", borderLeftColor: "#3B8FE8" }}
								>
									<MessageSquareQuoteIcon
										className="size-5 text-[#3B8FE8] shrink-0 mt-0.5"
										strokeWidth={1.5}
									/>
									<p className="text-sm text-[#0A1428]/80 italic leading-relaxed">
										{t(`home.deepDive.${q}`)}
									</p>
								</div>
							))}
						</div>

						<p className="mt-4 text-sm text-[#64748B] font-medium">
							{t("home.deepDive.methodNote")}
						</p>
					</div>

					{/* Right column — Comparison table + FMEA */}
					<div className="dd-right space-y-6">
						<div>
							<h3 className="text-lg sm:text-xl font-semibold text-[#0A1428] mb-4 sm:mb-6">
								{t("home.deepDive.outputTitle")}
							</h3>

							<div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
								{/* Table header */}
								<div className="grid grid-cols-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
									<div className="p-3 sm:p-4 bg-[#F8FAFC] text-[#64748B]">
										{t("home.deepDive.instant.label")}
									</div>
									<div className="p-3 sm:p-4 bg-[#3B8FE8] text-[#0A1428]">
										{t("home.deepDive.guided.label")}
									</div>
								</div>

								{COMPARISON_ROWS.map((row, i) => (
									<div
										key={row}
										className="grid grid-cols-2 text-xs sm:text-sm border-t border-[#E2E8F0]"
									>
										<div className="p-3 sm:p-4 text-[#64748B] bg-white">
											{t(`home.deepDive.instant.${row}`)}
										</div>
										<div className="p-3 sm:p-4 text-[#0A1428] font-medium bg-white">
											{t(`home.deepDive.guided.${row}`)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* FMEA table example */}
						<div className="dd-fmea">
							<p className="text-xs uppercase tracking-widest text-[#3B8FE8] font-medium mb-3">
								Ejemplo de Matriz FMEA
							</p>
							<FmeaTableMock />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
