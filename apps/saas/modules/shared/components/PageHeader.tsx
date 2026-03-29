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
		<div className={cn("mb-8", className)}>
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-display text-2xl lg:text-3xl text-foreground">{title}</h2>
					{subtitle && (
						<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
					)}
				</div>
				{actions && <div className="flex gap-2">{actions}</div>}
			</div>
			{children}
		</div>
	);
}
