"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpenCheckIcon, WorkflowIcon, ShieldAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const differentiators = [
	{ id: "diff1", icon: BookOpenCheckIcon },
	{ id: "diff2", icon: WorkflowIcon },
	{ id: "diff3", icon: ShieldAlertIcon },
] as const;

export function SolutionSection() {
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

			tl.fromTo(
				".solution-header > *",
				{ autoAlpha: 0, y: 30 },
				{ autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" },
			);

			tl.fromTo(
				".solution-card",
				{ autoAlpha: 0, x: -40 },
				{ autoAlpha: 1, x: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" },
				"-=0.3",
			);

			tl.fromTo(
				".solution-mockup",
				{ autoAlpha: 0, x: 40 },
				{ autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
				"-=0.6",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} id="solution" className="py-16 sm:py-20 lg:py-28 bg-white">
			<div className="container max-w-6xl">
				<div className="solution-header mb-10 sm:mb-16 max-w-3xl mx-auto text-center">
					<small className="font-medium text-xs uppercase tracking-widest text-[#00E5C0] mb-4 block">
						{t("home.solution.badge")}
					</small>
					<h2 className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-[#0A1428]">
						{t("home.solution.title")}
					</h2>
					<p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-[#64748B] text-balance leading-relaxed">
						{t("home.solution.description")}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
					{/* Left: Differentiators */}
					<div className="grid grid-cols-1 gap-4 sm:gap-5">
						{differentiators.map((diff) => {
							const Icon = diff.icon;
							return (
								<div
									key={diff.id}
									className="solution-card flex gap-4 sm:gap-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-6 lg:p-7 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
									style={{ borderLeftWidth: "3px", borderLeftColor: "#00E5C0" }}
								>
									<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00E5C0]/10 text-[#00E5C0] shrink-0 mt-0.5">
										<Icon className="size-5" strokeWidth={1.5} />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-[#0A1428] mb-2">
											{t(`home.solution.${diff.id}.title`)}
										</h3>
										<p className="text-[#64748B] text-sm leading-relaxed">
											{t(`home.solution.${diff.id}.description`)}
										</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* Right: Product mockup */}
					<div className="solution-mockup">
						<div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden shadow-xl">
							{/* Mockup header */}
							<div className="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-white">
								<div className="flex gap-1.5">
									<div className="size-3 rounded-full bg-[#E2E8F0]" />
									<div className="size-3 rounded-full bg-[#E2E8F0]" />
									<div className="size-3 rounded-full bg-[#E2E8F0]" />
								</div>
								<div className="flex-1 mx-8">
									<div className="h-5 rounded-full bg-[#E2E8F0] max-w-[180px] mx-auto" />
								</div>
							</div>
							{/* BPMN + SIPOC preview */}
							<div className="p-6 space-y-4">
								{/* SIPOC table mockup */}
								<div className="grid grid-cols-5 gap-1 text-[10px] font-medium">
									{["S", "I", "P", "O", "C"].map((label) => (
										<div key={label} className="bg-[#00E5C0]/10 text-[#00E5C0] rounded px-2 py-1.5 text-center font-semibold">
											{label}
										</div>
									))}
									{Array.from({ length: 10 }).map((_, i) => (
										<div key={i} className="bg-[#E2E8F0]/60 rounded px-2 py-1.5">
											<div className="h-2 rounded bg-[#CBD5E1]/60 w-full" />
										</div>
									))}
								</div>
								{/* Mini BPMN */}
								<svg viewBox="0 0 400 80" className="w-full opacity-70" fill="none">
									<circle cx="30" cy="40" r="12" stroke="#00E5C0" strokeWidth="2" fill="#00E5C0" fillOpacity="0.1" />
									<line x1="42" y1="40" x2="80" y2="40" stroke="#00E5C0" strokeWidth="1.5" />
									<rect x="80" y="22" width="70" height="36" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="#00E5C0" fillOpacity="0.06" />
									<line x1="150" y1="40" x2="185" y2="40" stroke="#00E5C0" strokeWidth="1.5" />
									<rect x="178" y="33" width="14" height="14" rx="2" transform="rotate(45 185 40)" stroke="#00E5C0" strokeWidth="1.5" fill="#00E5C0" fillOpacity="0.06" />
									<line x1="199" y1="40" x2="235" y2="40" stroke="#00E5C0" strokeWidth="1.5" />
									<rect x="235" y="22" width="70" height="36" rx="6" stroke="#00E5C0" strokeWidth="1.5" fill="#00E5C0" fillOpacity="0.06" />
									<line x1="305" y1="40" x2="340" y2="40" stroke="#00E5C0" strokeWidth="1.5" />
									<circle cx="355" cy="40" r="12" stroke="#00E5C0" strokeWidth="3" fill="#00E5C0" fillOpacity="0.1" />
								</svg>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
