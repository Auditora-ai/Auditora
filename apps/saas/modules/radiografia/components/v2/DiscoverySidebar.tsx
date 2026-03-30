"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
	ArrowRightIcon,
	CheckCircle2Icon,
	XCircleIcon,
	ClockIcon,
	Loader2Icon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface ProcessItem {
	id: string;
	name: string;
	category: string | null;
	processStatus: string;
}

interface DiscoverySidebarProps {
	organizationId: string;
	refreshTrigger: number;
	selectedDeliverables: string[];
	onToggleDeliverable: (type: string) => void;
	onGenerateDeliverables: () => void;
	generating: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
	core: "text-primary",
	strategic: "text-purple-500",
	support: "text-success",
};

const CATEGORY_LABELS: Record<string, string> = {
	core: "Core",
	strategic: "Estratégico",
	support: "Soporte",
};

const DELIVERABLE_OPTIONS = [
	{ type: "value_chain", label: "Cadena de valor" },
	{ type: "landscape", label: "Mapa de procesos" },
	{ type: "horizontal_view", label: "Vista horizontal" },
] as const;

export function DiscoverySidebar({
	organizationId,
	refreshTrigger,
	selectedDeliverables,
	onToggleDeliverable,
	onGenerateDeliverables,
	generating,
}: DiscoverySidebarProps) {
	const tv = useTranslations("scan");
	const [processes, setProcesses] = useState<ProcessItem[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch processes when refreshTrigger changes (after accept/reject)
	useEffect(() => {
		async function fetchProcesses() {
			try {
				const res = await fetch(`/api/processes?organizationId=${organizationId}`);
				if (res.ok) {
					const data = await res.json();
					setProcesses(data.processes || []);
				}
			} catch {
				// Non-fatal
			} finally {
				setLoading(false);
			}
		}
		fetchProcesses();
	}, [organizationId, refreshTrigger]);

	// Count by category
	const coreCount = processes.filter((p) => p.category === "core").length;
	const strategicCount = processes.filter((p) => p.category === "strategic").length;
	const supportCount = processes.filter((p) => p.category === "support").length;
	const totalCount = processes.length;

	return (
		<>
			{/* Desktop sidebar */}
			<div className="hidden w-72 shrink-0 flex-col border-l border-border bg-card md:flex">
				{/* Processes discovered */}
				<div className="flex-1 overflow-y-auto p-5">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{tv("discovery.processesDiscovered")}
					</h3>

					{loading ? (
						<div className="flex items-center justify-center py-4">
							<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
						</div>
					) : processes.length === 0 ? (
						<p className="text-xs text-muted-foreground">{tv("discovery.noProcessesYet")}</p>
					) : (
						<div className="space-y-1.5">
							{processes.map((p) => (
								<div
									key={p.id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
								>
									<CheckCircle2Icon className="size-3.5 shrink-0 text-success" />
									<span className="flex-1 truncate font-medium text-foreground">
										{p.name}
									</span>
									<span className={`text-[10px] ${CATEGORY_COLORS[p.category || ""] || "text-muted-foreground"}`}>
										{CATEGORY_LABELS[p.category || ""] || "—"}
									</span>
								</div>
							))}
						</div>
					)}

					{/* Coverage bars */}
					{totalCount > 0 && (
						<div className="mt-5 space-y-2">
							<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{tv("discovery.coverage")}
							</h3>
							{[
								{ label: "Estratégico", count: strategicCount, target: 3, color: "bg-purple-500" },
								{ label: "Core", count: coreCount, target: 6, color: "bg-primary" },
								{ label: "Soporte", count: supportCount, target: 4, color: "bg-success" },
							].map((cat) => (
								<div key={cat.label} className="flex items-center gap-2">
									<span className="w-20 text-[10px] text-muted-foreground">{cat.label}</span>
									<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
										<div
											className={`h-full rounded-full ${cat.color} transition-all duration-500`}
											style={{ width: `${Math.min((cat.count / cat.target) * 100, 100)}%` }}
										/>
									</div>
									<span className="w-8 text-right text-[10px] text-muted-foreground">
										{cat.count}/{cat.target}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Deliverables selector + CTA */}
				<div className="border-t border-border p-5">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{tv("discovery.deliverables")}
					</h3>
					<div className="space-y-2">
						{DELIVERABLE_OPTIONS.map((opt) => (
							<label
								key={opt.type}
								className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
							>
								<input
									type="checkbox"
									checked={selectedDeliverables.includes(opt.type)}
									onChange={() => onToggleDeliverable(opt.type)}
									className="size-3.5 rounded border-border accent-primary"
								/>
								{opt.label}
							</label>
						))}
					</div>

					<Button
						onClick={onGenerateDeliverables}
						disabled={selectedDeliverables.length === 0 || totalCount < 2 || generating}
						className="mt-4 w-full gap-2"
					>
						{generating ? (
							<>
								<Loader2Icon className="size-4 animate-spin" />
								{tv("discovery.generating")}
							</>
						) : (
							<>
								{tv("discovery.generateDeliverables")}
								<ArrowRightIcon className="size-4" />
							</>
						)}
					</Button>

					{totalCount < 2 && totalCount > 0 && (
						<p className="mt-2 text-[10px] text-muted-foreground text-center">
							{tv("discovery.needMoreProcesses")}
						</p>
					)}
				</div>
			</div>

			{/* Mobile floating pill */}
			<div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 md:hidden">
				<button
					type="button"
					onClick={onGenerateDeliverables}
					disabled={selectedDeliverables.length === 0 || totalCount < 2 || generating}
					className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm disabled:opacity-50"
				>
					<span className="text-xs font-medium text-foreground">
						{totalCount} procesos
					</span>
					<span className="size-1 rounded-full bg-border" />
					<span className="text-xs text-primary font-medium">
						{tv("discovery.generateDeliverables")}
					</span>
					<ArrowRightIcon className="size-3.5 text-primary" />
				</button>
			</div>
		</>
	);
}
