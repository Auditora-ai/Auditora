import { useId } from "react";
import { cn } from "../lib";

/**
 * Auditora.ai Logo — Blueprint "A" with Oxanium wordmark
 *
 * Variants:
 * - default: isotipo + wordmark horizontal (for navbars, headers)
 * - monogram: just the blueprint "A" isotipo (for favicons, compact spaces)
 * - dark: white text on dark bg (default)
 * - light: dark text on light bg
 */

function BlueprintIsotype({
	size = 40,
	className,
}: { size?: number; className?: string }) {
	const uid = useId();
	const blueId = `logo-blue-${uid}`;
	const glowId = `logo-glow-${uid}`;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 250 250"
			width={size}
			height={size}
			className={className}
		>
			<defs>
				<linearGradient id={blueId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#00B4FF" />
					<stop offset="100%" stopColor="#0077CC" />
				</linearGradient>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="4" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g transform="translate(-75, -55)">
				<g opacity="0.15" stroke="#00C4FF" strokeWidth="1" fill="none">
					<circle cx="200" cy="180" r="100" />
					<circle cx="200" cy="180" r="75" />
					<line x1="120" y1="100" x2="280" y2="260" />
					<line x1="280" y1="100" x2="120" y2="260" />
				</g>
				<g stroke="#00C4FF" strokeWidth="2" opacity="0.35" fill="none">
					<path d="M130,110 L130,100 L140,100" />
					<path d="M270,110 L270,100 L260,100" />
					<path d="M130,250 L130,260 L140,260" />
					<path d="M270,250 L270,260 L260,260" />
				</g>
				<g
					filter={`url(#${glowId})`}
					stroke={`url(#${blueId})`}
					strokeWidth="3"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M200,110 L155,250" />
					<path d="M200,110 L245,250" />
					<line x1="165" y1="200" x2="235" y2="200" />
				</g>
				<g filter={`url(#${glowId})`} transform="translate(200,108)">
					<line x1="0" y1="-15" x2="0" y2="15" stroke="#00B4FF" strokeWidth="2" />
					<line x1="-15" y1="0" x2="15" y2="0" stroke="#00B4FF" strokeWidth="2" />
				</g>
			</g>
		</svg>
	);
}

export function Logo({
	withLabel = true,
	monogram = false,
	variant = "dark",
	size,
	className,
}: {
	className?: string;
	withLabel?: boolean;
	monogram?: boolean;
	variant?: "dark" | "light";
	size?: "sm" | "md" | "lg";
}) {
	const isLight = variant === "light";

	// Monogram version — just the blueprint "A" isotipo
	if (monogram) {
		const isoSize = size === "sm" ? 24 : size === "lg" ? 48 : 32;
		return <BlueprintIsotype size={isoSize} className={className} />;
	}

	// Full horizontal logo: isotipo + wordmark
	const isoSize = size === "sm" ? 28 : size === "lg" ? 48 : 36;
	const textSize =
		size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";

	return (
		<span
			className={cn("flex items-center gap-2 leading-none", className)}
		>
			<BlueprintIsotype size={isoSize} />
			{withLabel && (
				<span
					className={cn(textSize, "tracking-tight")}
					style={{ fontFamily: "'Oxanium', sans-serif" }}
				>
					<span
						className={cn(
							"font-bold",
							isLight ? "text-[#0077CC]" : "text-[#00B4FF]",
						)}
					>
						A
					</span>
					<span
						className={cn(
							"font-bold",
							isLight ? "text-slate-800" : "text-[#F1F5F9]",
						)}
					>
						uditora
					</span>
					<span
						className={cn(
							"font-light",
							isLight ? "text-slate-400" : "text-[#64748B]",
						)}
					>
						.ai
					</span>
				</span>
			)}
		</span>
	);
}
