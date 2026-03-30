"use client";

import { useGSAP } from "@gsap/react";
import { Logo } from "@repo/ui";
import gsap from "gsap";
import { CheckIcon, GlobeIcon, FileTextIcon, BrainCircuitIcon, BarChart3Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

interface TheatricalCrawlingLoaderProps {
	url?: string;
}

function extractHostname(url: string): string {
	try {
		const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
		return parsed.hostname;
	} catch {
		return url;
	}
}

const STEP_ICONS = [GlobeIcon, FileTextIcon, BrainCircuitIcon, BarChart3Icon];

export function TheatricalCrawlingLoader({ url }: TheatricalCrawlingLoaderProps) {
	const t = useTranslations("scan");
	const containerRef = useRef<HTMLDivElement>(null);
	const hostname = url ? extractHostname(url) : "";

	const steps = [
		t("loaderConnecting"),
		t("loaderReading"),
		t("loaderExtracting"),
		t("loaderPreparing"),
	];

	useGSAP(
		() => {
			if (!containerRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) {
				// Show everything immediately for reduced motion
				gsap.set(".loader-logo, .loader-url-pill, .loader-step, .loader-progress-fill", {
					opacity: 1,
					clipPath: "inset(0 0% 0 0)",
				});
				return;
			}

			const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

			// 1. Logo clip-path wipe
			tl.from(".loader-logo", {
				clipPath: "inset(0 100% 0 0)",
				duration: 0.6,
				ease: "power2.inOut",
			});

			// 2. "Analyzing" label fade in
			tl.from(
				".loader-analyzing-label",
				{
					opacity: 0,
					y: 10,
					filter: "blur(4px)",
					duration: 0.5,
				},
				0.4,
			);

			// 3. URL pill entrance
			if (url) {
				tl.from(
					".loader-url-pill",
					{
						opacity: 0,
						y: 20,
						scale: 0.95,
						duration: 0.6,
						ease: "back.out(1.4)",
					},
					0.6,
				);

				// Typewriter effect on hostname characters
				tl.from(
					".loader-url-char",
					{
						opacity: 0,
						duration: 0.03,
						stagger: 0.04,
					},
					0.9,
				);
			}

			// 4. Steps stagger in
			tl.from(
				".loader-step",
				{
					opacity: 0,
					x: -15,
					duration: 0.4,
					stagger: 0.15,
				},
				url ? 1.4 : 0.8,
			);

			// 5. Activate steps sequentially with pulse
			steps.forEach((_, i) => {
				const stepDelay = (url ? 1.8 : 1.2) + i * 2.5;

				// Activate current step
				tl.to(
					`.loader-step-${i} .loader-step-icon`,
					{
						color: "#00E5C0",
						duration: 0.3,
					},
					stepDelay,
				);
				tl.to(
					`.loader-step-${i} .loader-step-text`,
					{
						color: "#F1F5F9",
						duration: 0.3,
					},
					stepDelay,
				);
				tl.to(
					`.loader-step-${i} .loader-step-dot`,
					{
						scale: 1.4,
						opacity: 1,
						duration: 0.3,
						ease: "back.out(2)",
					},
					stepDelay,
				);

				// Mark previous step as completed
				if (i > 0) {
					tl.to(
						`.loader-step-${i - 1} .loader-step-icon`,
						{
							color: "#94A3B8",
							duration: 0.2,
						},
						stepDelay,
					);
					tl.to(
						`.loader-step-${i - 1} .loader-step-text`,
						{
							color: "#64748B",
							duration: 0.2,
						},
						stepDelay,
					);
					tl.to(
						`.loader-step-${i - 1} .loader-step-dot`,
						{
							scale: 1,
							duration: 0.2,
						},
						stepDelay,
					);
					// Show checkmark
					tl.to(
						`.loader-step-${i - 1} .loader-step-check`,
						{
							opacity: 1,
							scale: 1,
							duration: 0.3,
							ease: "back.out(2)",
						},
						stepDelay + 0.1,
					);
				}
			});

			// 6. Bottom progress bar
			tl.fromTo(
				".loader-progress-fill",
				{ width: "0%" },
				{
					width: "85%",
					duration: 8,
					ease: "power1.inOut",
				},
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
			{/* Gradient overlays for depth */}
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

			{/* Subtle BPMN grid pattern */}
			<div className="pointer-events-none absolute inset-0 opacity-[0.03]">
				<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern id="bpmn-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
							<rect x="20" y="10" width="20" height="14" rx="2" stroke="#F1F5F9" strokeWidth="1" fill="none" />
							<circle cx="30" cy="42" r="7" stroke="#F1F5F9" strokeWidth="1" fill="none" />
							<line x1="30" y1="24" x2="30" y2="35" stroke="#F1F5F9" strokeWidth="0.5" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#bpmn-grid)" />
				</svg>
			</div>

			{/* Content */}
			<div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
				{/* Logo */}
				<div className="loader-logo mb-12" style={{ clipPath: "inset(0 0% 0 0)" }}>
					<Logo
						withLabel
						className="text-[#F1F5F9] [&_svg]:text-[#00E5C0] [&_.text-muted-foreground]:text-[#94A3B8]"
					/>
				</div>

				{/* "Analyzing" label */}
				{url && (
					<p
						className="loader-analyzing-label mb-3 text-sm tracking-wide uppercase"
						style={{ color: "#64748B" }}
					>
						{t("loaderAnalyzing")}
					</p>
				)}

				{/* URL pill */}
				{url && (
					<div className="loader-url-pill mb-12 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
						<GlobeIcon className="size-4 shrink-0 text-[#00E5C0]" />
						<span
							className="text-base font-medium tracking-tight"
							style={{
								color: "#F1F5F9",
								fontFamily: "'Instrument Serif', serif",
							}}
						>
							{hostname.split("").map((char, i) => (
								<span key={i} className="loader-url-char inline-block">
									{char}
								</span>
							))}
						</span>
					</div>
				)}

				{/* Progress steps */}
				<div className="flex w-full flex-col gap-4">
					{steps.map((step, i) => {
						const Icon = STEP_ICONS[i];
						return (
							<div
								key={i}
								className={`loader-step loader-step-${i} flex items-center gap-3`}
							>
								{/* Pulse dot + check overlay */}
								<div className="relative flex size-8 items-center justify-center">
									<div
										className="loader-step-dot absolute size-2 rounded-full bg-[#00E5C0] opacity-30"
									/>
									<div
										className="loader-step-check absolute opacity-0 scale-0"
									>
										<CheckIcon className="size-4 text-[#00E5C0]" />
									</div>
								</div>

								{/* Icon */}
								<Icon
									className="loader-step-icon size-4"
									style={{ color: "#334155" }}
								/>

								{/* Label */}
								<span
									className="loader-step-text text-sm"
									style={{ color: "#475569" }}
								>
									{step}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Bottom progress bar */}
			<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
				<div
					className="loader-progress-fill h-full rounded-r-full"
					style={{
						width: "0%",
						background: "linear-gradient(90deg, #00E5C0, rgba(0,229,192,0.8))",
					}}
				/>
			</div>
		</div>
	);
}
