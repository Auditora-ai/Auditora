"use client";

import { useMemo } from "react";
import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CategoryGroup } from "./CategoryGroup";
import type { ProcessMapItem, ProcessCategory } from "../hooks/use-process-map";

interface ProcessMapProps {
	processes: ProcessMapItem[];
	orgName: string;
	industry: string | null;
	totalCount: number;
	documentedCount: number;
	evaluatedCount: number;
	organizationSlug: string;
}

interface CategoryConfig {
	key: ProcessCategory;
	title: string;
	icon: string;
	defaultOpen: boolean;
}

const CATEGORIES: CategoryConfig[] = [
	{ key: "strategic", title: "ESTRATÉGICOS", icon: "🎯", defaultOpen: false },
	{ key: "core", title: "OPERATIVOS", icon: "⚙️", defaultOpen: true },
	{ key: "support", title: "SOPORTE", icon: "🛠", defaultOpen: false },
];

export function ProcessMap({
	processes,
	orgName,
	industry,
	totalCount,
	documentedCount,
	evaluatedCount,
	organizationSlug,
}: ProcessMapProps) {
	const grouped = useMemo(() => {
		const map: Record<ProcessCategory, ProcessMapItem[]> = {
			strategic: [],
			core: [],
			support: [],
		};
		for (const p of processes) {
			const cat = p.category ?? "core";
			if (map[cat]) {
				map[cat].push(p);
			}
		}
		return map;
	}, [processes]);

	return (
		<div className="relative min-h-screen bg-[#F8FAFC] font-sans">
			{/* Header */}
			<div className="px-4 pt-6 pb-2">
				{/* Org name + industry badge */}
				<div className="flex items-center gap-2.5 mb-1.5">
					<h1 className="text-xl font-bold text-foreground tracking-tight">
						{orgName}
					</h1>
				{industry && (
					<Badge
						variant="secondary"
						className="h-[22px] rounded-full px-2.5 text-[11px] font-semibold bg-[var(--palette-action,#3B8FE8)]/8 text-[var(--palette-action,#3B8FE8)] border-0"
					>
						{industry}
					</Badge>
				)}
				</div>

				{/* Summary line */}
				<p className="text-[13px] text-muted-foreground leading-relaxed">
					<span className="font-semibold text-foreground">{totalCount}</span>
					{" "}procesos
					<span className="mx-1.5 text-muted-foreground/40">·</span>
					<span className="font-semibold text-foreground">{documentedCount}</span>
					{" "}documentados
					<span className="mx-1.5 text-muted-foreground/40">·</span>
					<span className="font-semibold text-foreground">{evaluatedCount}</span>
					{" "}evaluados
				</p>
			</div>

			{/* Category groups or empty state */}
			<div className="px-4 pt-3 pb-24">
				{totalCount === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
							<Plus className="size-7 text-primary" />
						</div>
						<h2 className="text-lg font-semibold text-foreground mb-2">
							Empieza con el Discovery
						</h2>
						<p className="text-sm text-muted-foreground max-w-sm mb-6">
							La IA te ayudará a mapear la cadena de valor de tu empresa y generar tu arquitectura de procesos.
						</p>
						<Link href={`/${organizationSlug}/discovery`}>
							<Button className="gap-2">
								Iniciar Discovery
							</Button>
						</Link>
					</div>
				) : (
					CATEGORIES.map((cat) => {
						const items = grouped[cat.key];
						if (!items || items.length === 0) return null;
						return (
							<CategoryGroup
								key={cat.key}
								title={cat.title}
								icon={cat.icon}
								processes={items}
								defaultOpen={cat.defaultOpen}
								organizationSlug={organizationSlug}
							/>
						);
					})
				)}
			</div>

			{/* FAB - Add process (bottom-20 on mobile to clear nav bar) */}
			<div className="fixed bottom-20 md:bottom-6 right-4 z-50">
				<Link href={`/${organizationSlug}/capture/new`}>
					<Button
						variant="primary"
						size="icon-lg"
						className={cn(
							"size-14 rounded-full",
							"bg-[var(--palette-action,#3B8FE8)] hover:bg-[var(--palette-action,#3B8FE8)]/90",
							"text-white shadow-lg shadow-[var(--palette-action,#3B8FE8)]/25",
							"active:scale-95 transition-all duration-150",
						)}
					>
						<Plus className="size-6" />
					</Button>
				</Link>
			</div>
		</div>
	);
}
