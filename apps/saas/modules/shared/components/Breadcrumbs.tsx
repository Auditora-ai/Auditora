"use client";

import { cn } from "@repo/ui";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	return (
		<nav
			aria-label="Breadcrumb"
			className={cn("flex items-center gap-1.5 text-sm", className)}
		>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<span key={item.label} className="flex items-center gap-1.5">
						{index > 0 && (
							<ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
						)}
						{isLast || !item.href ? (
							<span className="text-foreground font-medium truncate max-w-[200px]">
								{item.label}
							</span>
						) : (
							<Link
								href={item.href}
								className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
							>
								{item.label}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
