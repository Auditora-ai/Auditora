import { cn } from "../lib";

export function Logo({
	withLabel = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<svg className="size-8 text-primary" viewBox="0 0 32 32" fill="none">
				<title>Auditora.ai</title>
				<path d="M2 16Q9 6 16 6t14 10Q23 26 16 26T2 16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
				<circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
				<circle cx="16" cy="16" r="2.5" fill="currentColor" />
			</svg>
			{withLabel && (
				<span className="ml-2 hidden text-xl md:block tracking-tight">
					<span className="font-bold">Auditora</span>
					<span className="font-light text-muted-foreground">.ai</span>
				</span>
			)}
		</span>
	);
}
