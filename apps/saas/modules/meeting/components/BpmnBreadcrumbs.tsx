"use client";

import { ChevronRight, Home } from "lucide-react";

interface BpmnBreadcrumbsProps {
	stack: { id: string; label: string }[];
	currentLabel?: string;
	onNavigate: (level: number) => void;
}

/**
 * BpmnBreadcrumbs — Subprocess navigation breadcrumbs
 *
 * Shows: Proceso Principal > Subproceso Ventas > Cotización
 * Click any breadcrumb to navigate back to that level.
 * Only visible when drilled into a subprocess (stack.length > 0).
 */
export function BpmnBreadcrumbs({
	stack,
	currentLabel,
	onNavigate,
}: BpmnBreadcrumbsProps) {
	if (stack.length === 0) return null;

	return (
		<div className="flex items-center gap-1 border-b border-[#334155] bg-[#0F172A] px-3 py-1.5">
			{stack.map((item, index) => (
				<span key={item.id} className="flex items-center gap-1">
					{index === 0 && (
						<Home className="h-3 w-3 text-[#94A3B8]" />
					)}
					<button
						type="button"
						onClick={() => onNavigate(index)}
						className="text-xs text-[#94A3B8] transition-colors hover:text-[#F1F5F9]"
					>
						{item.label}
					</button>
					<ChevronRight className="h-3 w-3 text-[#64748B]" />
				</span>
			))}
			<span className="text-xs font-medium text-[#F1F5F9]">
				{currentLabel || "Subproceso"}
			</span>
		</div>
	);
}
