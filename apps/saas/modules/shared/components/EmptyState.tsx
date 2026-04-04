"use client";

import { cn } from "@repo/ui";
import type { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface EmptyStateAction {
	label: string;
	onClick?: () => void;
	href?: string;
	variant?: "primary" | "secondary" | "outline" | "ghost";
	icon?: React.ReactNode;
}

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	actions?: EmptyStateAction[];
	className?: string;
	compact?: boolean;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	actions,
	className,
	compact = false,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center text-center",
				compact ? "py-8 px-4" : "py-14 px-6",
				className,
			)}
		>
			{Icon && (
				<div
					className={cn(
						"mb-4 flex items-center justify-center rounded-full bg-muted/50",
						compact ? "h-10 w-10" : "h-14 w-14",
					)}
				>
					<Icon
						className={cn(
							"text-muted-foreground/60",
							compact ? "h-5 w-5" : "h-7 w-7",
						)}
					/>
				</div>
			)}
			<h3
				className={cn(
					"font-medium text-foreground",
					compact ? "text-sm" : "text-base",
				)}
			>
				{title}
			</h3>
			{description && (
				<p
					className={cn(
						"mt-1.5 max-w-sm text-muted-foreground",
						compact ? "text-xs" : "text-sm",
					)}
				>
					{description}
				</p>
			)}
			{actions && actions.length > 0 && (
				<div className="mt-5 flex flex-wrap gap-2">
					{actions.map((action) =>
						action.href ? (
							<Button
								key={action.label}
								variant={action.variant ?? "primary"}
								size={compact ? "sm" : "md"}
								className="min-h-[44px] active:scale-95"
								asChild
							>
								<a href={action.href}>
									{action.icon}
									{action.label}
								</a>
							</Button>
						) : (
							<Button
								key={action.label}
								variant={action.variant ?? "primary"}
								size={compact ? "sm" : "md"}
								className="min-h-[44px] active:scale-95"
								onClick={action.onClick}
							>
								{action.icon}
								{action.label}
							</Button>
						),
					)}
				</div>
			)}
		</div>
	);
}
