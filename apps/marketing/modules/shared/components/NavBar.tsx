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
			label: t("common.menu.howItWorks"),
			href: "/#how-it-works",
		},
		{
			label: t("common.menu.pricing"),
			href: "/#pricing",
		},
		{
			label: t("common.menu.faq"),
			href: "/#faq",
		},
		{
			label: t("common.menu.contact"),
			href: "/contact",
		},
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			ref={navRef}
			className={cn(
				"sticky top-0 z-50 w-full transition-shadow duration-200 bg-background/80",
				{ "border-b": !isTop },
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
							<Logo />
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							<LocaleLink
								key={menuItem.href}
								href={menuItem.href}
								className={cn(
									"block shrink-0 px-3 py-2 font-medium text-foreground/80 text-sm",
									isMenuItemActive(menuItem.href)
										? "font-bold text-foreground"
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
												"block shrink-0 px-3 py-2 font-medium text-base text-foreground/80",
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
										<NextLink
											href={config.saasUrl}
											className="block px-3 py-2 text-base"
											onClick={handleMobileMenuClose}
											prefetch
										>
											{t("common.menu.login")}
										</NextLink>
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
									<NextLink href={config.saasUrl} prefetch>
										{t("common.menu.login")}
									</NextLink>
								</Button>
								<Button
									className="hidden lg:flex"
									asChild
									variant="primary"
								>
									<NextLink href={config.saasUrl} prefetch>
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
