"use client";

import { cn } from "@repo/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { useTranslations } from "next-intl";

interface RiskMaturityRingProps {
	score: number;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function RiskMaturityRing({
	score,
	size = "md",
	className,
}: RiskMaturityRingProps) {
	const t = useTranslations("maturityRing");
	const isSmall = size === "sm";
	const isLarge = size === "lg";
	const radius = isSmall ? 16 : isLarge ? 52 : 28;
	const strokeWidth = isSmall ? 3 : isLarge ? 6 : 4;
	const svgSize = (radius + strokeWidth) * 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.min(Math.max(score, 0), 100);
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	// Color based on score
	const ringColor =
		score >= 70
			? "var(--success)" // green — good maturity
			: score >= 40
				? "var(--palette-orientation)" // amber — needs work
				: "var(--destructive)"; // red — critical

	const scoreColorClass =
		score >= 70
			? "text-success"
			: score >= 40
				? "text-orientation"
				: "text-destructive";

	const isEmpty = score === 0;

	return (
		<TooltipProvider>
		<Tooltip>
		<TooltipTrigger asChild>
		<div className={cn(
			isLarge ? "flex cursor-help flex-col items-center gap-2" : "flex cursor-help items-center gap-3",
			className,
		)}>
			<div className="relative">
				<svg
					width={svgSize}
					height={svgSize}
					viewBox={`0 0 ${svgSize} ${svgSize}`}
					className="shrink-0 -rotate-90"
				>
					{/* Background ring */}
					<circle
						cx={radius + strokeWidth}
						cy={radius + strokeWidth}
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeWidth={strokeWidth}
						className="text-muted-foreground/20"
					/>
					{/* Progress ring */}
					{!isEmpty && (
						<circle
							cx={radius + strokeWidth}
							cy={radius + strokeWidth}
							r={radius}
							fill="none"
							stroke={ringColor}
							strokeWidth={strokeWidth}
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							className="transition-all duration-1000 ease-out"
						/>
					)}
				</svg>
				{/* Score centered inside ring for lg */}
				{isLarge && (
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						{isEmpty ? (
							<span className="text-lg text-muted-foreground">—</span>
						) : (
						<>
							<span
								className={cn("text-4xl font-bold tabular-nums", scoreColorClass)}
							>
								{score}
							</span>
								<span className="text-xs text-muted-foreground">/100</span>
							</>
						)}
					</div>
				)}
			</div>
			{/* Label for lg size below ring */}
			{isLarge && (
				<span className="text-sm text-muted-foreground">
					{isEmpty ? t("noData") : t("label")}
				</span>
			)}
			{/* Side label for md */}
			{!isSmall && !isLarge && (
				<div className="flex flex-col">
					{isEmpty ? (
						<>
							<span className="text-xs text-muted-foreground">—</span>
							<span className="text-[11px] text-muted-foreground">
								{t("noData")}
							</span>
						</>
					) : (
						<>
							<span
								className={cn("text-lg font-semibold tabular-nums", scoreColorClass)}
							>
								{score}
							</span>
							<span className="text-[11px] text-muted-foreground">
								{t("label")}
							</span>
						</>
					)}
				</div>
			)}
			{isSmall && !isEmpty && (
				<span
					className={cn("text-xs font-semibold tabular-nums", scoreColorClass)}
				>
					{score}
				</span>
			)}
		</div>
		</TooltipTrigger>
		<TooltipContent side="bottom" className="max-w-xs text-xs">
			{t("tooltip")}
		</TooltipContent>
		</Tooltip>
		</TooltipProvider>
	);
}
