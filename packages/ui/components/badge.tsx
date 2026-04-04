import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type React from "react";
import { cn } from "../lib";

const badgeVariants = cva(
	"group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary:
					"bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive:
					"bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
				outline:
					"border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost:
					"hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			/* Legacy status variants preserved for backward compatibility */
			status: {
				success: "bg-emerald-500/10 text-emerald-500 border-transparent",
				info: "bg-primary/10 text-primary border-transparent",
				warning: "bg-amber-500/10 text-amber-500 border-transparent",
				error: "bg-rose-500/10 text-rose-500 border-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

/* Keep legacy export name for backward compatibility */
export const badge = badgeVariants;

export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean };

export const Badge = ({
	children,
	className,
	variant = "default",
	status,
	asChild = false,
	...props
}: BadgeProps) => {
	const Comp = asChild ? Slot.Root : "span";
	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			className={cn(badgeVariants({ variant, status }), className)}
			{...props}
		>
			{children}
		</Comp>
	);
};

Badge.displayName = "Badge";

export { badgeVariants };
