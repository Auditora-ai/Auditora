"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

function DeepgramLogo() {
	return (
		<svg viewBox="0 0 120 24" className="h-6 w-auto" fill="currentColor">
			<rect x="0" y="4" width="16" height="16" rx="3" fill="currentColor" opacity="0.8" />
			<rect x="3" y="7" width="4" height="10" rx="1" fill="white" />
			<rect x="9" y="10" width="4" height="4" rx="1" fill="white" />
			<text x="22" y="18" className="text-[14px]" fontFamily="system-ui" fontWeight="600">Deepgram</text>
		</svg>
	);
}

function AnthropicLogo() {
	return (
		<svg viewBox="0 0 120 24" className="h-6 w-auto" fill="currentColor">
			<path d="M6 20L12 4L18 20H15L12 11L9 20H6Z" fill="currentColor" opacity="0.8" />
			<text x="24" y="18" className="text-[14px]" fontFamily="system-ui" fontWeight="600">Anthropic</text>
		</svg>
	);
}

function RecallLogo() {
	return (
		<svg viewBox="0 0 100 24" className="h-6 w-auto" fill="currentColor">
			<circle cx="10" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
			<circle cx="10" cy="12" r="3" fill="currentColor" opacity="0.8" />
			<text x="24" y="18" className="text-[14px]" fontFamily="system-ui" fontWeight="600">Recall.ai</text>
		</svg>
	);
}

function ZoomLogo() {
	return (
		<svg viewBox="0 0 580 140" className="h-7 w-auto opacity-50" aria-label="Zoom">
			{/* Zoom official logo - camera icon + wordmark */}
			<g fill="currentColor">
				{/* Camera icon */}
				<rect x="8" y="30" width="80" height="80" rx="20" fill="#2D8CFF" />
				<rect x="22" y="48" width="40" height="44" rx="8" fill="white" />
				<polygon points="66,58 88,46 88,94 66,82" fill="white" />
				{/* Wordmark */}
				<path d="M130,52 L130,100 L200,100 L200,84 L158,84 L200,52 L200,40 L130,40 L130,56 L172,56 Z" fill="currentColor" />
				<path d="M215,70 C215,50 230,38 252,38 C274,38 289,50 289,70 C289,90 274,102 252,102 C230,102 215,90 215,70 Z M265,70 C265,58 260,52 252,52 C244,52 239,58 239,70 C239,82 244,88 252,88 C260,88 265,82 265,70 Z" fill="currentColor" />
				<path d="M305,70 C305,50 320,38 342,38 C364,38 379,50 379,70 C379,90 364,102 342,102 C320,102 305,90 305,70 Z M355,70 C355,58 350,52 342,52 C334,52 329,58 329,70 C329,82 334,88 342,88 C350,88 355,82 355,70 Z" fill="currentColor" />
				<path d="M400,40 L400,100 L424,100 L424,72 L430,72 C436,72 438,76 438,82 L438,100 L462,100 L462,76 C462,66 456,62 450,60 C456,58 464,52 464,42 L464,40 C464,38 400,38 400,40 Z M424,56 L444,56 C444,56 440,56 440,50 L424,50 Z" fill="currentColor" />
				<path d="M395,40 L395,100 L419,100 L419,56 L445,56 L445,100 L469,100 L469,40 Z" fill="currentColor" />
			</g>
		</svg>
	);
}

function TeamsLogo() {
	return (
		<svg viewBox="0 0 160 40" className="h-7 w-auto opacity-50" aria-label="Microsoft Teams">
			<g>
				{/* Teams icon */}
				<rect x="4" y="4" width="32" height="32" rx="6" fill="#5B5FC7" />
				{/* T letter */}
				<rect x="12" y="11" width="16" height="3.5" rx="1" fill="white" />
				<rect x="18" y="11" width="4" height="18" rx="1" fill="white" />
				{/* Person silhouette */}
				<circle cx="30" cy="10" r="5" fill="#7B83EB" />
				<ellipse cx="30" cy="22" rx="7" ry="5" fill="#7B83EB" />
				{/* Wordmark */}
				<text x="44" y="27" className="text-[16px]" fontFamily="'Segoe UI', system-ui, sans-serif" fontWeight="600" fill="currentColor">Teams</text>
			</g>
		</svg>
	);
}

function MeetLogo() {
	return (
		<svg viewBox="0 0 160 40" className="h-7 w-auto opacity-50" aria-label="Google Meet">
			<g>
				{/* Meet camera icon */}
				<rect x="4" y="8" width="22" height="24" rx="4" fill="#00897B" />
				<polygon points="26,14 36,8 36,32 26,26" fill="#00897B" />
				{/* Green gradient accent */}
				<rect x="4" y="8" width="22" height="12" rx="4" fill="#00AC47" />
				<polygon points="26,14 36,8 36,20 26,20" fill="#00AC47" />
				{/* Wordmark */}
				<text x="44" y="27" className="text-[16px]" fontFamily="'Google Sans', 'Product Sans', system-ui, sans-serif" fontWeight="500" fill="currentColor">Meet</text>
			</g>
		</svg>
	);
}

export function IntegrationsSection() {
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

			// "Powered by" logos stagger from center with blur
			tl.from(".powered-logo", {
				scale: 0.7,
				opacity: 0,
				filter: "blur(4px)",
				stagger: { from: "center", each: 0.12 },
				duration: 0.6,
				ease: "power3.out",
			});

			// Divider line draws from center
			tl.from(
				".integrations-divider",
				{
					scaleX: 0,
					duration: 0.4,
					ease: "power2.inOut",
				},
				"-=0.2",
			);

			// "Works with" logos stagger from center
			tl.from(
				".works-with-logo",
				{
					scale: 0.7,
					opacity: 0,
					filter: "blur(4px)",
					stagger: { from: "center", each: 0.1 },
					duration: 0.5,
					ease: "power3.out",
				},
				"-=0.1",
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="py-16 lg:py-24 border-y border-border">
			<div className="container max-w-4xl">
				<div className="flex flex-col items-center gap-8">
					<div className="text-center">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
							{t("home.integrations.poweredBy")}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-foreground">
							<span className="powered-logo"><DeepgramLogo /></span>
							<span className="powered-logo"><AnthropicLogo /></span>
							<span className="powered-logo"><RecallLogo /></span>
						</div>
					</div>

					<div className="integrations-divider w-16 h-px bg-border origin-center" />

					<div className="text-center">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
							{t("home.integrations.worksWithTitle")}
						</p>
						<div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-muted-foreground">
							<span className="works-with-logo"><ZoomLogo /></span>
							<span className="works-with-logo"><TeamsLogo /></span>
							<span className="works-with-logo"><MeetLogo /></span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
