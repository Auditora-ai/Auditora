"use client";

import { useGSAP } from "@gsap/react";
import { Logo } from "@repo/ui";
import gsap from "gsap";
import { BrainCircuitIcon, CheckIcon, NetworkIcon, ShieldAlertIcon, WorkflowIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const STEP_ICONS = [BrainCircuitIcon, WorkflowIcon, ShieldAlertIcon, NetworkIcon];

export function RevealLoader() {
	const t = useTranslations("scan");
	const containerRef = useRef<HTMLDivElement>(null);

	const steps = [
		t("revealCorrelating"),
		t("revealMapping"),
		t("revealAnalyzing"),
		t("revealGenerating"),
	];

	useGSAP(
		() => {
			if (!containerRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) {
				gsap.set(".reveal-logo, .reveal-step, .reveal-progress-fill", {
					opacity: 1,
					clipPath: "inset(0 0% 0 0)",
				});
				return;
			}

			const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

			// 1. Logo clip-path wipe
			tl.from(".reveal-logo", {
				clipPath: "inset(0 100% 0 0)",
				duration: 0.6,
				ease: "power2.inOut",
			});

			// 2. Label fade in
			tl.from(
				".reveal-label",
				{
					opacity: 0,
					y: 10,
					filter: "blur(4px)",
					duration: 0.5,
				},
				0.4,
			);

			// 3. Steps stagger in
			tl.from(
				".reveal-step",
				{
					opacity: 0,
					x: -15,
					duration: 0.4,
					stagger: 0.15,
				},
				0.8,
			);

			// 4. Activate steps sequentially with pulse
			steps.forEach((_, i) => {
				const stepDelay = 1.2 + i * 2.5;

				tl.to(
					`.reveal-step-${i} .reveal-step-icon`,
					{ color: "#00E5C0", duration: 0.3 },
					stepDelay,
				);
				tl.to(
					`.reveal-step-${i} .reveal-step-text`,
					{ color: "#F1F5F9", duration: 0.3 },
					stepDelay,
				);
				tl.to(
					`.reveal-step-${i} .reveal-step-dot`,
					{ scale: 1.4, opacity: 1, duration: 0.3, ease: "back.out(2)" },
					stepDelay,
				);

				if (i > 0) {
					tl.to(
						`.reveal-step-${i - 1} .reveal-step-icon`,
						{ color: "#94A3B8", duration: 0.2 },
						stepDelay,
					);
					tl.to(
						`.reveal-step-${i - 1} .reveal-step-text`,
						{ color: "#64748B", duration: 0.2 },
						stepDelay,
					);
					tl.to(
						`.reveal-step-${i - 1} .reveal-step-dot`,
						{ scale: 1, duration: 0.2 },
						stepDelay,
					);
					tl.to(
						`.reveal-step-${i - 1} .reveal-step-check`,
						{ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
						stepDelay + 0.1,
					);
				}
			});

			// 5. Bottom progress bar
			tl.fromTo(
				".reveal-progress-fill",
				{ width: "0%" },
				{ width: "90%", duration: 10, ease: "power1.inOut" },
				0.5,
			);
		},
		{ scope: containerRef },
	);

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-40 flex flex-col items-center justify-center"
			style={{ backgroundColor: "#0A1428" }}
		>
			{/* Gradient overlays */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at top right, rgba(0,229,192,0.08), transparent 60%)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at bottom left, rgba(217,119,6,0.04), transparent 60%)",
				}}
			/>

			{/* Subtle BPMN grid */}
			<div className="pointer-events-none absolute inset-0 opacity-[0.03]">
				<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern id="reveal-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
							<rect x="20" y="10" width="20" height="14" rx="2" stroke="#F1F5F9" strokeWidth="1" fill="none" />
							<circle cx="30" cy="42" r="7" stroke="#F1F5F9" strokeWidth="1" fill="none" />
							<line x1="30" y1="24" x2="30" y2="35" stroke="#F1F5F9" strokeWidth="0.5" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#reveal-grid)" />
				</svg>
			</div>

			{/* Content */}
			<div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
				{/* Logo */}
				<div className="reveal-logo mb-12" style={{ clipPath: "inset(0 0% 0 0)" }}>
					<Logo
						withLabel
						className="text-[#F1F5F9] [&_svg]:text-[#00E5C0] [&_.text-muted-foreground]:text-[#94A3B8]"
					/>
				</div>

				{/* Label */}
				<p
					className="reveal-label mb-8 text-sm tracking-wide uppercase"
					style={{ color: "#64748B" }}
				>
					{t("revealTitle")}
				</p>

				{/* Steps */}
				<div className="flex w-full flex-col gap-4">
					{steps.map((step, i) => {
						const Icon = STEP_ICONS[i];
						return (
							<div
								key={i}
								className={`reveal-step reveal-step-${i} flex items-center gap-3`}
							>
								<div className="relative flex size-8 items-center justify-center">
									<div className="reveal-step-dot absolute size-2 rounded-full bg-[#00E5C0] opacity-30" />
									<div className="reveal-step-check absolute scale-0 opacity-0">
										<CheckIcon className="size-4 text-[#00E5C0]" />
									</div>
								</div>
								<Icon
									className="reveal-step-icon size-4"
									style={{ color: "#334155" }}
								/>
								<span
									className="reveal-step-text text-sm"
									style={{ color: "#475569" }}
								>
									{step}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Progress bar */}
			<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
				<div
					className="reveal-progress-fill h-full rounded-r-full"
					style={{
						width: "0%",
						background: "linear-gradient(90deg, #00E5C0, rgba(0,229,192,0.8))",
					}}
				/>
			</div>
		</div>
	);
}
