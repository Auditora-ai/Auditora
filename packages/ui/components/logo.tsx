import { cn } from "../lib";

export function Logo({
	withLabel = true,
	monogram = false,
	className,
}: {
	className?: string;
	withLabel?: boolean;
	monogram?: boolean;
}) {
	// Monogram version — just the "A" for favicon, mobile, compact spaces
	if (monogram) {
		return (
			<span
				className={cn(
					"flex items-center justify-center font-display text-2xl font-black tracking-tighter text-[#00E5C0]",
					className,
				)}
			>
				A
			</span>
		);
	}

	return (
		<span
			className={cn(
				"flex items-center leading-none",
				className,
			)}
		>
			{/* Split weight wordmark: "Audit" heavy + "ora" light + ".ai" teal */}
			<span className="text-xl tracking-tight">
				<span className="font-black text-foreground">Audit</span>
				<span className="font-light text-foreground/70">ora</span>
				<span className="font-light text-[#00E5C0]">.ai</span>
			</span>
		</span>
	);
}
