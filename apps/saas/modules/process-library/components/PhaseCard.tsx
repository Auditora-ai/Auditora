"use client";

import { Card } from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";

export interface PhaseConfig {
	key: string;
	label: string;
	icon: React.ElementType;
	completeness: number;
	preview: string;
	cta: { label: string; onClick: () => void } | null;
	isCurrentPhase: boolean;
}

interface PhaseCardProps {
	phase: PhaseConfig;
	isExpanded: boolean;
	onClick: () => void;
}

export function PhaseCard({ phase, isExpanded, onClick }: PhaseCardProps) {
	const Icon = phase.icon;
	const pct = Math.round(Math.max(0, Math.min(100, phase.completeness)));

	// Semantic color for progress bar
	const barColor =
		pct >= 100
			? "bg-emerald-500"
			: pct >= 40
				? "bg-amber-500"
				: pct > 0
					? "bg-red-500"
					: "bg-muted";

	return (
		<Card
			className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
				isExpanded
					? "ring-2 ring-primary shadow-md"
					: phase.isCurrentPhase
						? "ring-1 ring-primary/30 shadow-sm"
						: ""
			}`}
			onClick={onClick}
		>
			<div className="p-4 space-y-3">
				{/* Header: icon + label + percentage */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-lg ${
								phase.isCurrentPhase || isExpanded
									? "bg-primary/10 text-primary"
									: "bg-muted text-muted-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
						</div>
						<span className="text-sm font-semibold">{phase.label}</span>
					</div>
					<span
						className={`text-xs font-medium tabular-nums ${
								pct >= 100
									? "text-emerald-600 dark:text-emerald-400"
									: pct > 0
										? "text-foreground"
										: "text-muted-foreground"
							}`}
					>
						{pct}%
					</span>
				</div>

				{/* Progress bar */}
				<div className="h-1.5 w-full rounded-full bg-muted">
					<div
						className={`h-1.5 rounded-full transition-all duration-500 ease-out ${barColor}`}
						style={{ width: `${pct}%` }}
					/>
				</div>

				{/* Preview text */}
				<p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
					{phase.preview}
				</p>

				{/* CTA button */}
				{phase.cta && (
					<Button
						variant={phase.isCurrentPhase ? "primary" : "outline"}
						size="sm"
						className="w-full text-xs"
						onClick={(e) => {
							e.stopPropagation();
							phase.cta!.onClick();
						}}
					>
						{phase.cta.label}
					</Button>
				)}
			</div>
		</Card>
	);
}
