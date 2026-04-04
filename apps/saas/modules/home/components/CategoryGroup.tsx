"use client";

import { useState } from "react";
import { cn } from "@repo/ui";
import { ChevronDown } from "lucide-react";
import { ProcessCard } from "./ProcessCard";
import type { ProcessMapItem } from "../hooks/use-process-map";

interface CategoryGroupProps {
	title: string;
	icon: string;
	processes: ProcessMapItem[];
	defaultOpen?: boolean;
	organizationSlug: string;
}

const CATEGORY_COLORS: Record<string, string> = {
	ESTRATÉGICOS: "text-[var(--palette-action,#3B8FE8)]",
	OPERATIVOS: "text-[var(--palette-orientation,#D97706)]",
	SOPORTE: "text-[var(--palette-slate-400,#94a3b8)]",
};

export function CategoryGroup({
	title,
	icon,
	processes,
	defaultOpen = false,
	organizationSlug,
}: CategoryGroupProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="mb-2">
			{/* Category header - large touch target */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex w-full items-center justify-between py-3 px-1",
					"active:opacity-70 transition-opacity",
				)}
			>
				<div className="flex items-center gap-2">
					<span className="text-base">{icon}</span>
					<span
						className={cn(
							"text-[13px] font-bold tracking-wide uppercase",
							CATEGORY_COLORS[title] ?? "text-muted-foreground",
						)}
					>
						{title}
					</span>
					<span className="text-[12px] text-muted-foreground font-medium">
						({processes.length})
					</span>
				</div>
				<ChevronDown
					className={cn(
						"size-4 text-muted-foreground transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{/* Process cards */}
			<div
				className={cn(
					"grid transition-all duration-200 ease-out",
					isOpen
						? "grid-rows-[1fr] opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<div className="flex flex-col gap-2 pb-2">
						{processes
							.sort((a, b) => a.priority - b.priority)
							.map((process) => (
								<ProcessCard
									key={process.id}
									process={process}
									organizationSlug={organizationSlug}
								/>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
