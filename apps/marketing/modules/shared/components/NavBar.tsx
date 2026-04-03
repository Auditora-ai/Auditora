"use client";

import { config } from "@config";
import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { cn, Logo } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { useGSAP } from "@gsap/react";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MenuIcon } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

gsap.registerPlugin(ScrollTrigger);

export function NavBar() {
	const t = useTranslations();
	const localePathname = useLocalePathname();
	const navRef = useRef<HTMLElement>(null);

	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isTop, setIsTop] = useState(true);
	const [isLanding, setIsLanding] = useState(false);

	// GSAP scroll morphing: backdrop blur + bg opacity over first 100px
	useGSAP(() => {
		if (!navRef.current) return;

		ScrollTrigger.create({
			start: 0,
			end: 100,
			onUpdate: (self) => {
				if (!navRef.current) return;
				const p = self.progress;
				const blur = `blur(${p * 12}px)`;
				navRef.current.style.backdropFilter = blur;
				navRef.current.style.setProperty("-webkit-backdrop-filter", blur);
			},
		});
	});

	const handleMobileMenuClose = () => {
		setMobileMenuOpen(false);
	};

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		setIsLanding(!!document.querySelector("[data-landing]"));
	}, []);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		handleMobileMenuClose();
	}, [localePathname]);

	const menuItems: {
		label: string;
		href: string;
	}[] = [
		{
			label: t("common.menu.solution"),
			href: "/processes",
		},
		{
			label: t("common.menu.methodology"),
			href: "/about",
		},
		{
			label: t("common.menu.cases"),
			href: "/evaluations",
		},
		{
			label: t("common.menu.pricing"),
			href: "/#pricing",
		},
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			ref={navRef}
			className={cn(
				"sticky top-0 z-50 w-full transition-all duration-200",
				isLanding && isTop
					? "bg-transparent"
					: isLanding
						? "bg-[#0A1428]/95 backdrop-blur-md border-b border-white/10"
						: "bg-background/80",
				{ "border-b": !isTop && !isLanding },
			)}
			data-test="navigation"
		>
			<div className="container">
				<div
					className={cn(
						"flex items-center justify-stretch gap-6 transition-[padding] duration-200",
						!isTop ? "py-4" : "py-6",
					)}
				>
					<div className="flex flex-1 justify-start">
						<LocaleLink
							href="/"
							className="block hover:no-underline active:no-underline"
						>
							<Logo className={isLanding ? "text-white [&_span]:text-white/60" : ""} />
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							<LocaleLink
								key={menuItem.href}
								href={menuItem.href}
								className={cn(
									"block shrink-0 px-3 py-2 font-medium text-sm",
									isLanding
										? "text-white/80 hover:text-white"
										: "text-foreground/80",
									isMenuItemActive(menuItem.href)
										? isLanding
											? "font-bold text-white"
											: "font-bold text-foreground"
										: "",
								)}
								prefetch
							>
								{menuItem.label}
							</LocaleLink>
						))}
					</div>

					<div className="flex flex-1 items-center justify-end gap-3">
						<ColorModeToggle />
						<Suspense>
							<LocaleSwitch />
						</Suspense>

						<Sheet
							open={mobileMenuOpen}
							onOpenChange={(open) => setMobileMenuOpen(open)}
						>
							<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="secondary"
									aria-label={t("common.aria.menu")}
								>
									<MenuIcon className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent className="w-[280px]" side="right">
								<SheetTitle />
								<div className="flex flex-col items-start justify-center">
									{menuItems.map((menuItem) => (
										<LocaleLink
											key={menuItem.href}
											href={menuItem.href}
											onClick={handleMobileMenuClose}
											className={cn(
												"block shrink-0 px-3 py-3 font-medium text-base text-foreground/80",
												isMenuItemActive(menuItem.href)
													? "font-bold text-foreground"
													: "",
											)}
											prefetch
										>
											{menuItem.label}
										</LocaleLink>
									))}

								{config.saasUrl && (
									<>
							<NextLink
									href={`${config.saasUrl}/login`}
									className="block px-3 py-3 text-base"
									onClick={handleMobileMenuClose}
									prefetch
								>
									{t("common.menu.login")}
								</NextLink>
								<NextLink
									href={`${config.saasUrl}/signup`}
									className="mx-3 mt-3 flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
									onClick={handleMobileMenuClose}
									prefetch
								>
									{t("common.menu.trial")}
								</NextLink>
									</>
								)}
							</div>
							</SheetContent>
						</Sheet>

						{config.saasUrl && (
							<>
								<Button
									className="hidden lg:flex"
									asChild
									variant="ghost"
								>
							<NextLink href={`${config.saasUrl}/login`} prefetch>
								{t("common.menu.login")}
							</NextLink>
						</Button>
						<Button
							className="hidden lg:flex"
							asChild
							variant="primary"
						>
							<NextLink href={`${config.saasUrl}/signup`} prefetch>
								{t("common.menu.trial")}
							</NextLink>
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
