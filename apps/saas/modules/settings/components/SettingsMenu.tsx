"use client";

import { cn } from "@repo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SettingsMenu({
	menuItems,
	className,
}: {
	menuItems: {
		title: string;
		avatar: ReactNode;
		items: {
			title: string;
			href: string;
			icon?: ReactNode;
		}[];
	}[];
	className?: string;
}) {
	const pathname = usePathname();

	const isActiveMenuItem = (href: string) => pathname.includes(href);

	// Flatten all items from all menu sections into a single array
	const allItems = menuItems.flatMap((item) => item.items);

	return (
		<div className={cn("relative border-b", className)}>
			<nav className="flex gap-0 overflow-x-auto no-scrollbar -mx-1 px-1">
				{allItems.map((item, index) => {
					const isActive = isActiveMenuItem(item.href);
					return (
						<Link
							key={index}
							href={item.href}
							className={cn(
								"relative border-b-2 px-3 md:px-4 py-2.5 text-xs md:text-sm transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center shrink-0",
								isActive
									? "border-primary font-semibold text-primary"
									: "border-transparent font-medium text-foreground/60",
							)}
						>
							{item.icon && (
								<span className="mr-1.5 md:hidden">{item.icon}</span>
							)}
							{item.title}
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
