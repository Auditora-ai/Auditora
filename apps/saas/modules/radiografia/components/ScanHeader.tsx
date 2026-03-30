"use client";

import { Logo } from "@repo/ui";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";

interface ScanHeaderProps {
	variant?: "default" | "dark";
}

export function ScanHeader({ variant = "default" }: ScanHeaderProps) {
	const isDark = variant === "dark";

	return (
		<header
			className={`fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-sm ${
				isDark
					? "border-white/10 bg-[#0A1428]/80"
					: "border-border bg-background/80"
			}`}
		>
			<div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
				<Logo
					withLabel
					className={
						isDark
							? "text-[#F1F5F9] [&_svg]:text-[#00E5C0] [&_.text-muted-foreground]:text-[#94A3B8]"
							: undefined
					}
				/>

				<div className="flex items-center gap-2">
					<LocaleSwitch />
					<ColorModeToggle />
				</div>
			</div>
		</header>
	);
}
