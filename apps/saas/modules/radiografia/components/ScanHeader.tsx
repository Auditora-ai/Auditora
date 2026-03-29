"use client";

import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";

export function ScanHeader() {
	return (
		<header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
			<div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
				<span
					className="text-lg tracking-tight"
					style={{ fontFamily: "var(--font-display), 'Instrument Serif', Georgia, serif" }}
				>
					<span className="text-foreground">ai</span>
					<span className="text-primary">process</span>
					<span className="text-muted-foreground">.me</span>
				</span>

				<div className="flex items-center gap-2">
					<LocaleSwitch />
					<ColorModeToggle />
				</div>
			</div>
		</header>
	);
}
