"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { Footer } from "@shared/components/Footer";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { LoginShowcasePanel } from "./LoginShowcasePanel";

interface LoginPageLayoutProps {
	variant?: "login" | "signup";
}

export function LoginPageLayout({
	children,
	variant = "login",
}: PropsWithChildren<LoginPageLayoutProps>) {
	const formRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!formRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) return;

			const title = formRef.current.querySelector(".auth-title");
			const subtitle = formRef.current.querySelector(".auth-subtitle");
			const formFields =
				formRef.current.querySelectorAll(".auth-form-field");
			const formContent =
				formRef.current.querySelector(".auth-form-content");

			const tl = gsap.timeline({ delay: 0.2 });

			// Right panel slide in
			tl.from(formRef.current, {
				x: 40,
				opacity: 0,
				duration: 0.6,
				ease: "power4.out",
			});

			// Title
			if (title) {
				tl.from(
					title,
					{
						y: 20,
						opacity: 0,
						duration: 0.5,
						ease: "power3.out",
					},
					0.4,
				);
			}

			// Subtitle blur-fade
			if (subtitle) {
				tl.from(
					subtitle,
					{
						y: 10,
						opacity: 0,
						filter: "blur(4px)",
						duration: 0.4,
						ease: "power2.out",
					},
					0.5,
				);
			}

			// Form content (fields, buttons, etc.)
			if (formContent) {
				tl.from(
					formContent,
					{
						y: 15,
						opacity: 0,
						duration: 0.5,
						ease: "power3.out",
					},
					0.6,
				);
			}
		},
		{ scope: formRef },
	);

	return (
		<div className="flex min-h-screen">
			{/* Left: Dark chrome showcase panel (hidden on mobile) */}
			<aside className="hidden w-[55%] lg:block xl:w-[60%]">
				<div className="sticky top-0 h-screen">
					<LoginShowcasePanel variant={variant} />
				</div>
			</aside>

			{/* Right: Warm canvas form panel */}
			<main
				ref={formRef}
				className="flex min-h-screen flex-1 flex-col bg-background"
			>
				{/* Header with controls */}
				<header className="flex items-center justify-between p-6 lg:justify-end">
					{/* Logo visible only on mobile (showcase hidden) */}
					<a href="/" className="block lg:hidden">
						<span className="flex items-center font-semibold text-foreground leading-none">
							<svg
								className="size-8 text-primary"
								viewBox="0 0 32 32"
								fill="none"
							>
								<title>Auditora.ai</title>
								<circle
									cx="8"
									cy="16"
									r="3"
									fill="currentColor"
								/>
								<circle
									cx="24"
									cy="8"
									r="3"
									fill="currentColor"
								/>
								<circle
									cx="24"
									cy="24"
									r="3"
									fill="currentColor"
								/>
								<path
									d="M11 16L21 8"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<path
									d="M11 16L21 24"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
								/>
								<rect
									x="15"
									y="14"
									width="4"
									height="4"
									rx="1"
									fill="currentColor"
									opacity="0.4"
									transform="rotate(45 17 16)"
								/>
							</svg>
							<span className="ml-2 text-xl tracking-tight">
								<span className="font-bold">Auditora</span>
								<span className="font-light text-muted-foreground">
									.ai
								</span>
							</span>
						</span>
					</a>

					<div className="flex items-center gap-2">
						<LocaleSwitch />
						<ColorModeToggle />
					</div>
				</header>

				{/* Form content (vertically centered) */}
				<div className="flex flex-1 items-center justify-center px-6 lg:px-12">
					<div className="w-full max-w-md">{children}</div>
				</div>

				{/* Footer */}
				<Footer />
			</main>
		</div>
	);
}
