"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ProcessMapItem } from "../hooks/use-process-map";

interface ProcessCardProps {
	process: ProcessMapItem;
	organizationSlug: string;
}

const STATUS_CONFIG: Record<
	ProcessMapItem["processStatus"],
	{ label: string; className: string }
> = {
	DRAFT: {
		label: "Borrador",
		className: "bg-[var(--palette-slate-400,#94a3b8)]/10 text-[var(--palette-slate-400,#94a3b8)]",
	},
	CAPTURED: {
		label: "Capturado",
		className: "bg-[var(--palette-orientation,#D97706)]/10 text-[var(--palette-orientation,#D97706)]",
	},
	DOCUMENTED: {
		label: "Documentado",
		className: "bg-[var(--palette-action,#3B8FE8)]/10 text-[var(--palette-action,#3B8FE8)]",
	},
	EVALUATED: {
		label: "Evaluado",
		className: "", // Determined dynamically based on alignment
	},
};

function getEvaluatedBadgeClass(alignmentPct?: number): string {
	if (alignmentPct === undefined || alignmentPct >= 60) {
		return "bg-[var(--palette-success,#16A34A)]/10 text-[var(--palette-success,#16A34A)]";
	}
	return "bg-[var(--palette-destructive,#DC2626)]/10 text-[var(--palette-destructive,#DC2626)]";
}

function getProgressBarColor(alignmentPct: number): string {
	if (alignmentPct >= 75) return "bg-[var(--palette-success,#16A34A)]";
	if (alignmentPct >= 50) return "bg-[var(--palette-orientation,#D97706)]";
	return "bg-[var(--palette-destructive,#DC2626)]";
}

export function ProcessCard({ process, organizationSlug }: ProcessCardProps) {
	const status = STATUS_CONFIG[process.processStatus];
	const isEvaluated = process.processStatus === "EVALUATED";
	const isDocumented = process.processStatus === "DOCUMENTED";
	const isCaptured = process.processStatus === "CAPTURED";

	const badgeClass = isEvaluated
		? getEvaluatedBadgeClass(process.alignmentPct)
		: status.className;

	return (
		<Link
			href={`/${organizationSlug}/process/${process.id}`}
			className="block active:scale-[0.98] transition-transform duration-100"
		>
			<div
				className={cn(
					"relative flex items-center gap-3 rounded-xl bg-white p-4",
					"shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.03)]",
					"ring-1 ring-black/[0.04]",
					"min-h-[60px]",
				)}
			>
				{/* Main content */}
				<div className="flex-1 min-w-0">
					{/* Top row: name + badge */}
					<div className="flex items-center gap-2 mb-1">
						<span className="font-medium text-[15px] text-foreground truncate leading-tight">
							{process.name}
						</span>
					</div>

					{/* Status badge row */}
					<div className="flex items-center gap-2 flex-wrap">
						<Badge
							variant="secondary"
							className={cn(
								"h-[22px] rounded-full px-2.5 text-[11px] font-semibold border-0",
								badgeClass,
							)}
						>
							{status.label}
						</Badge>

						{/* Evaluated: show alignment + risk count */}
						{isEvaluated && process.alignmentPct !== undefined && (
							<>
								<div className="flex items-center gap-1.5 flex-1 min-w-[80px] max-w-[140px]">
									<div className="relative flex-1 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
										<div
											className={cn(
												"absolute inset-y-0 left-0 rounded-full transition-all duration-500",
												getProgressBarColor(process.alignmentPct),
											)}
											style={{ width: `${process.alignmentPct}%` }}
										/>
									</div>
									<span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
										{process.alignmentPct}%
									</span>
								</div>
								{process.riskCount !== undefined && process.riskCount > 0 && (
									<Badge
										variant="secondary"
										className="h-[22px] rounded-full px-2 text-[11px] font-semibold border-0 bg-[var(--palette-destructive,#DC2626)]/10 text-[var(--palette-destructive,#DC2626)]"
									>
										{process.riskCount} {process.riskCount === 1 ? "riesgo" : "riesgos"}
									</Badge>
								)}
							</>
						)}

						{/* Documented: show 'Sin evaluar' */}
						{isDocumented && (
							<span className="text-[11px] text-muted-foreground font-medium">
								Sin evaluar
							</span>
						)}

						{/* Captured: show 'Pendiente documentar' */}
						{isCaptured && (
							<span className="text-[11px] text-muted-foreground font-medium">
								Pendiente documentar
							</span>
						)}
					</div>
				</div>

				{/* Chevron */}
				<ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
			</div>
		</Link>
	);
}
