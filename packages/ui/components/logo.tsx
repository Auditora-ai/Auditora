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
				<title>aiprocess.me</title>
				<circle cx="8" cy="16" r="3" fill="currentColor" />
				<circle cx="24" cy="8" r="3" fill="currentColor" />
				<circle cx="24" cy="24" r="3" fill="currentColor" />
				<path d="M11 16L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<path d="M11 16L21 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
				<rect x="15" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" transform="rotate(45 17 16)" />
			</svg>
			{withLabel && (
				<span className="ml-2 hidden text-lg md:block" style={{ fontFamily: "var(--font-display), serif" }}>
					aiprocess.me
				</span>
			)}
		</span>
	);
}
