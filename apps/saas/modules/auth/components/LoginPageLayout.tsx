"use client";

import { useGSAP } from "@gsap/react";
import { Logo } from "@repo/ui";
import gsap from "gsap";
import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
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
	const t = useTranslations();
	const formRef = useRef<HTMLDivElement>(null);

	const mobileTitle =
		variant === "signup"
			? t("auth.showcase.signup.title")
			: t("auth.showcase.login.title");

	const mobileSubtitle =
		variant === "signup"
			? t("auth.showcase.signup.subtitle")
			: t("auth.showcase.login.subtitle");

	useGSAP(
		() => {
			if (!formRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			if (prefersReducedMotion) return;

			const title = formRef.current.querySelector(".auth-title");
			const subtitle = formRef.current.querySelector(".auth-subtitle");
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
		<div className="flex min-h-screen flex-col lg:flex-row">
			{/* Left: Showcase panel (hidden on mobile) */}
			<aside className="hidden w-[55%] lg:block xl:w-[60%]">
				<div className="sticky top-0 h-screen">
					<LoginShowcasePanel variant={variant} />
				</div>
			</aside>

			{/* Mobile brand header (visible only on mobile) */}
			<div className="relative overflow-hidden bg-card lg:hidden">
				<div className="relative z-10 px-6 pt-8 pb-6 text-center">
					<Logo
						withLabel
						className="justify-center text-foreground"
					/>
				<h2
					className="mt-4 text-xl font-semibold tracking-tight text-foreground"
				>
						{mobileTitle}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{mobileSubtitle}
					</p>
				</div>
			</div>

			{/* Right: Form panel */}
			<main
				ref={formRef}
				className="flex min-h-0 flex-1 flex-col bg-background lg:min-h-screen"
			>
				{/* Header with controls */}
				<header className="flex items-center justify-end p-6">
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
