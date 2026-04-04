import React from "react";
import { cn } from "../lib";

function Textarea({
	className,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-16 w-full rounded-3xl bg-input/50 border border-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
