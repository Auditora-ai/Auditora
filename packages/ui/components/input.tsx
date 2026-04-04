import React from "react";
import { cn } from "../lib";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function Input({ className, type, ...props }: InputProps) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex h-9 w-full min-w-0 rounded-3xl bg-input/50 border border-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
