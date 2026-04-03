"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	CheckCircle2,
	FlaskConical,
	FileText,
	Globe,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { WorkflowEndToEnd } from "./animations/WorkflowEndToEnd";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
	{ id: "scan", icon: Globe, num: "01", color: "#3B8FE8" },
	{ id: "discover", icon: Search, num: "02", color: "#38BDF8" },
	{ id: "analyze", icon: ShieldCheck, num: "03", color: "#A78BFA" },
	{ id: "document", icon: FileText, num: "04", color: "#FB923C" },
	{ id: "simulate", icon: FlaskConical, num: "05", color: "#F472B6" },
	{ id: "evaluate", icon: CheckCircle2, num: "06", color: "#EAB308" },
] as const;

export function WorkflowSection() {
	const t = useTranslations();
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current) return;
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top 75%",
					once: true,
				},
			});

			tl.from(".wf-header > *", {
				opacity: 0,
				y: 30,
				stagger: 0.1,
				duration: 0.7,
				ease: "power3.out",
			});

			// Animate each step
			tl.from(
				".wf-step",
				{
					opacity: 0,
					y: 30,
					stagger: 0.12,
					duration: 0.6,
					ease: "power3.out",
				},
				"-=0.3",
			);

			// Draw connecting lines
			tl.from(
				".wf-line",
				{
					scaleX: 0,
					transformOrigin: "left center",
					stagger: 0.12,
					duration: 0.5,
					ease: "power2.out",
				},
				"-=0.5",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-[#0A1428] to-[#111827]"
		>
			<div className="container max-w-6xl">
				<div className="wf-header mb-12 sm:mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#3B8FE8] mb-4 block">
						{t("home.workflow.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">
						{t("home.workflow.title")}
					</h2>
					<p className="mt-4 text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto">
						{t("home.workflow.subtitle")}
					</p>
				</div>

				{/* Animated workflow flow */}
				<div className="mb-12 max-w-3xl mx-auto px-4">
					<WorkflowEndToEnd />
				</div>

				{/* Desktop: horizontal flow */}
				<div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-0">
					{STEPS.map((step, i) => {
						const Icon = step.icon;
						const isLast = i === STEPS.length - 1;
						return (
							<div key={step.id} className="flex items-start" style={{ flex: isLast ? "0 0 auto" : "1 1 0" }}>
								<div className="wf-step flex flex-col items-center text-center w-full">
									<div
										className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300"
										style={{ boxShadow: `0 0 20px ${step.color}25` }}
									>
										<Icon className="size-6" style={{ color: step.color }} strokeWidth={1.5} />
									</div>
									<span
										className="mt-2 text-xs font-bold tracking-wider"
										style={{ color: step.color }}
									>
										{step.num}
									</span>
									<h3 className="mt-1 text-sm font-semibold text-white">
										{t(`home.workflow.${step.id}.title`)}
									</h3>
									<p className="mt-1 text-xs text-[#94A3B8] leading-relaxed max-w-[140px]">
										{t(`home.workflow.${step.id}.description`)}
									</p>
								</div>
								{!isLast && (
									<div className="wf-line flex-shrink-0 h-[2px] w-8 bg-gradient-to-r from-white/20 to-white/5 mt-7" />
								)}
							</div>
						);
					})}
				</div>

				{/* Mobile/Tablet: 2-column grid */}
				<div className="grid grid-cols-2 gap-6 sm:gap-8 lg:hidden max-w-lg mx-auto">
					{STEPS.map((step) => {
						const Icon = step.icon;
						return (
							<div key={step.id} className="wf-step flex flex-col items-center text-center">
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5"
									style={{ boxShadow: `0 0 15px ${step.color}20` }}
								>
									<Icon className="size-5" style={{ color: step.color }} strokeWidth={1.5} />
								</div>
								<span
									className="mt-2 text-xs font-bold tracking-wider"
									style={{ color: step.color }}
								>
									{step.num}
								</span>
								<h3 className="mt-1 text-sm font-semibold text-white">
									{t(`home.workflow.${step.id}.title`)}
								</h3>
								<p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
									{t(`home.workflow.${step.id}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
