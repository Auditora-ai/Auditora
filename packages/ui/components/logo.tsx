import { useId } from "react";
import { cn } from "../lib";

/**
 * Auditora.ai Logo — Blueprint "A" with Oxanium wordmark
 *
 * Two isotipo versions:
 * - NavIsotype: clean, minimal A for small sizes (navbar). No blueprint clutter.
 * - HeroIsotype: full blueprint detail with grid, corners, glow for large sizes.
 *
 * Variants:
 * - dark: for dark backgrounds (logo in white/blue)
 * - light: for light backgrounds (logo in dark/blue)
 */

/** Clean minimal A — for navbar / compact use. No grid noise. */
function NavIsotype({
	size = 32,
	variant = "dark",
	className,
}: { size?: number; variant?: "dark" | "light"; className?: string }) {
	const uid = useId();
	const gradId = `nav-grad-${uid}`;
	const glowId = `nav-glow-${uid}`;
	const isLight = variant === "light";

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			width={size}
			height={size}
			className={className}
		>
			<defs>
				<linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#00B4FF" />
					<stop offset="100%" stopColor="#0077CC" />
				</linearGradient>
				<filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="2" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			{/* The A letterform — bold, clean strokes */}
			<g
				filter={`url(#${glowId})`}
				stroke={`url(#${gradId})`}
				strokeWidth={isLight ? "5" : "4.5"}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				{/* Left leg */}
				<path d="M50,12 L20,88" />
				{/* Right leg */}
				<path d="M50,12 L80,88" />
				{/* Crossbar */}
				<line x1="30" y1="62" x2="70" y2="62" />
			</g>
			{/* Sparkle/crosshair at apex */}
			<g filter={`url(#${glowId})`} transform="translate(50,10)">
				<line x1="0" y1="-8" x2="0" y2="8" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" />
				<line x1="-8" y1="0" x2="8" y2="0" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" />
			</g>
		</svg>
	);
}

/** Full blueprint A — for hero / large display. Grid, corners, glow detail. */
export function HeroIsotype({
	size = 200,
	className,
}: { size?: number; className?: string }) {
	const uid = useId();
	const blueId = `hero-blue-${uid}`;
	const glowId = `hero-glow-${uid}`;

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
					<feGaussianBlur stdDeviation="6" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			{/* Blueprint grid */}
			<g opacity="0.1" stroke="#00C4FF" strokeWidth="0.5" fill="none">
				<circle cx="125" cy="125" r="110" />
				<circle cx="125" cy="125" r="80" />
				<line x1="45" y1="45" x2="205" y2="205" />
				<line x1="205" y1="45" x2="45" y2="205" />
				<line x1="125" y1="15" x2="125" y2="235" />
				<line x1="15" y1="125" x2="235" y2="125" />
			</g>
			{/* Corner marks */}
			<g stroke="#00C4FF" strokeWidth="1.5" opacity="0.25" fill="none">
				<path d="M30,50 L30,35 L45,35" />
				<path d="M220,50 L220,35 L205,35" />
				<path d="M30,200 L30,215 L45,215" />
				<path d="M220,200 L220,215 L205,215" />
			</g>
			{/* The A — with glow */}
			<g
				filter={`url(#${glowId})`}
				stroke={`url(#${blueId})`}
				strokeWidth="4"
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M125,45 L75,205" />
				<path d="M125,45 L175,205" />
				<line x1="90" y1="150" x2="160" y2="150" />
			</g>
			{/* Sparkle at apex */}
			<g filter={`url(#${glowId})`} transform="translate(125,42)">
				<line x1="0" y1="-18" x2="0" y2="18" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" />
				<line x1="-18" y1="0" x2="18" y2="0" stroke="#00B4FF" strokeWidth="2.5" strokeLinecap="round" />
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

	// Monogram version — just the clean A
	if (monogram) {
		const isoSize = size === "sm" ? 28 : size === "lg" ? 56 : 36;
		return <NavIsotype size={isoSize} variant={variant} className={className} />;
	}

	// Full horizontal logo: isotipo + wordmark
	const isoSize = size === "sm" ? 28 : size === "lg" ? 44 : 32;
	const textSize =
		size === "sm"
			? "text-[17px]"
			: size === "lg"
				? "text-[28px]"
				: "text-[20px]";

	return (
		<span
			className={cn("flex items-center gap-2 leading-none select-none", className)}
		>
			<NavIsotype size={isoSize} variant={variant} className="shrink-0" />
			{withLabel && (
				<span
					className={cn(textSize, "tracking-tight")}
					style={{ fontFamily: "var(--font-brand, 'Oxanium'), sans-serif" }}
				>
					<span
						className={cn(
							"font-bold",
							isLight ? "text-slate-900" : "text-white",
						)}
					>
						Auditora
					</span>
					<span
						className={cn(
							"font-bold",
							isLight ? "text-[#0066BB]" : "text-[#00B4FF]",
						)}
					>
						.ai
					</span>
				</span>
			)}
		</span>
	);
}
