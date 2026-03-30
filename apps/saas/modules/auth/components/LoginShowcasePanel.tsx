"use client";

import { useGSAP } from "@gsap/react";
import { Logo } from "@repo/ui";
import gsap from "gsap";
import { BrainCircuitIcon, GitBranchIcon, ShieldAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { SplitWords } from "@shared/components/SplitWords";

interface LoginShowcasePanelProps {
	variant?: "login" | "signup";
}

export function LoginShowcasePanel({
	variant = "login",
}: LoginShowcasePanelProps) {
	const t = useTranslations();
	const panelRef = useRef<HTMLDivElement>(null);

	const title =
		variant === "signup"
			? t("auth.showcase.signup.title")
			: t("auth.showcase.login.title");

	const subtitle =
		variant === "signup"
			? t("auth.showcase.signup.subtitle")
			: t("auth.showcase.login.subtitle");

	const features = [
		{
			icon: BrainCircuitIcon,
			label: t("auth.showcase.feature.ai"),
			color: "text-[#00E5C0]",
		},
		{
			icon: GitBranchIcon,
			label: t("auth.showcase.feature.bpmn"),
			color: "text-[#00E5C0]",
		},
		{
			icon: ShieldAlertIcon,
			label: t("auth.showcase.feature.risk"),
			color: "text-[#EF4444]",
		},
	];

	useGSAP(
		() => {
			if (!panelRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) return;

			const logo = panelRef.current.querySelector(".showcase-logo");
			const badge = panelRef.current.querySelector(".showcase-badge");
			const taglineWords =
				panelRef.current.querySelectorAll(".tagline-word");
			const subtitleEl =
				panelRef.current.querySelector(".showcase-subtitle");
			const featurePills =
				panelRef.current.querySelectorAll(".showcase-feature");
			const metrics =
				panelRef.current.querySelectorAll(".showcase-metric");

			const tl = gsap.timeline({ delay: 0.2 });

			// Panel fade in
			tl.from(panelRef.current, {
				opacity: 0,
				duration: 0.3,
				ease: "power2.out",
			});

			// Logo clip-path wipe
			if (logo) {
				tl.from(
					logo,
					{
						clipPath: "inset(0 100% 0 0)",
						duration: 0.6,
						ease: "power2.inOut",
					},
					0.1,
				);
			}

			// Badge clip-path wipe
			if (badge) {
				tl.from(
					badge,
					{
						clipPath: "inset(0 100% 0 0)",
						duration: 0.5,
						ease: "power2.inOut",
					},
					0.3,
				);
			}

			// Headline word reveal
			if (taglineWords.length > 0) {
				tl.from(
					taglineWords,
					{
						y: "110%",
						duration: 1.0,
						stagger: 0.06,
						ease: "power4.out",
					},
					0.5,
				);
			}

			// Subtitle blur-fade
			if (subtitleEl) {
				tl.from(
					subtitleEl,
					{
						opacity: 0,
						y: 15,
						filter: "blur(4px)",
						duration: 0.6,
						ease: "power2.out",
					},
					0.8,
				);
			}

			// Feature pills stagger
			if (featurePills.length > 0) {
				tl.from(
					featurePills,
					{
						opacity: 0,
						y: 10,
						duration: 0.5,
						stagger: 0.1,
						ease: "power2.out",
					},
					1.0,
				);
			}

			// Social proof blur-fade stagger
			if (metrics.length > 0) {
				tl.from(
					metrics,
					{
						opacity: 0,
						y: 15,
						filter: "blur(4px)",
						duration: 0.6,
						stagger: 0.1,
						ease: "power2.out",
					},
					"-=0.4",
				);
			}
		},
		{ scope: panelRef },
	);

	return (
		<div
			ref={panelRef}
			className="relative flex h-full flex-col justify-between overflow-hidden p-8 lg:p-12"
			style={{ backgroundColor: "#0A1428" }}
		>
			{/* Subtle gradient overlays for depth */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at top right, rgba(0,229,192,0.06), transparent 60%)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at bottom left, rgba(239,68,68,0.04), transparent 60%)",
				}}
			/>

			{/* Content */}
			<div className="relative z-10 flex h-full flex-col justify-between">
				{/* Logo */}
				<div className="showcase-logo">
					<Logo
						withLabel
						className="text-[#F1F5F9] [&_svg]:text-[#00E5C0] [&_.text-muted-foreground]:text-[#94A3B8]"
					/>
				</div>

				{/* Value proposition */}
				<div className="flex flex-1 flex-col justify-center py-12">
					{/* Badge */}
					<div
						className="showcase-badge mb-6"
						style={{ clipPath: "inset(0 0% 0 0)" }}
					>
						<span className="inline-flex items-center rounded-full border border-[#00E5C0]/20 bg-[#00E5C0]/10 px-3 py-1 text-xs font-medium text-[#6EE7C4]">
							{t("auth.showcase.badge")}
						</span>
					</div>

					{/* Headline */}
					<h2
						className="font-display text-2xl leading-snug tracking-tight lg:text-3xl"
						style={{
							color: "#F1F5F9",
							fontFamily: "'Instrument Serif', serif",
						}}
					>
						<SplitWords innerClassName="tagline-word">
							{title}
						</SplitWords>
					</h2>

					{/* Subtitle */}
					<p
						className="showcase-subtitle mt-3 text-sm lg:text-base"
						style={{ color: "#94A3B8" }}
					>
						{subtitle}
					</p>

					{/* Feature pills */}
					<div className="mt-8 flex flex-wrap gap-3">
						{features.map((feature) => (
							<div
								key={feature.label}
								className="showcase-feature flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-2 text-sm"
								style={{ color: "#F1F5F9" }}
							>
								<feature.icon
									className={`size-4 ${feature.color}`}
								/>
								{feature.label}
							</div>
						))}
					</div>
				</div>

				{/* Social proof metrics */}
				<div className="flex items-center gap-8">
					<div className="showcase-metric">
						<p
							className="text-2xl font-bold"
							style={{ color: "#F1F5F9" }}
						>
							2,000+
						</p>
						<p className="text-sm" style={{ color: "#94A3B8" }}>
							{t("auth.showcase.metric.processes")}
						</p>
					</div>
					<div
						className="h-8 w-px"
						style={{ backgroundColor: "#1E293B" }}
					/>
					<div className="showcase-metric">
						<p
							className="text-2xl font-bold"
							style={{ color: "#F1F5F9" }}
						>
							500+
						</p>
						<p className="text-sm" style={{ color: "#94A3B8" }}>
							{t("auth.showcase.metric.organizations")}
						</p>
					</div>
					<div
						className="h-8 w-px"
						style={{ backgroundColor: "#1E293B" }}
					/>
					<div className="showcase-metric">
						<p
							className="text-2xl font-bold"
							style={{ color: "#F1F5F9" }}
						>
							98%
						</p>
						<p className="text-sm" style={{ color: "#94A3B8" }}>
							{t("auth.showcase.metric.accuracy")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
