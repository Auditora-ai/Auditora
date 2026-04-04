"use client";

import { cn } from "@repo/ui";

export function PageHeader({
	title,
	subtitle,
	className,
	actions,
	children,
}: {
	title: string;
	subtitle?: string;
	className?: string;
	actions?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<div className={cn("mb-6 md:mb-8", className)}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground truncate">{title}</h2>
					{subtitle && (
						<p className="mt-0.5 text-xs md:text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
					)}
				</div>
				{actions && (
					<div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
						{actions}
					</div>
				)}
			</div>
			{children}
		</div>
	);
}
