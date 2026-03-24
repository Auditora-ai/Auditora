"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, ZapIcon, PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import type { DiagramNode } from "../types";
import { detectPatterns, type ProcessPattern } from "../lib/patterns";
import { useLiveSessionContext } from "../context/LiveSessionContext";

export function PatternLibrary() {
	const { nodes, sessionId } = useLiveSessionContext();
	const [open, setOpen] = useState(true);
	const [applying, setApplying] = useState<string | null>(null);

	const patterns = useMemo(() => detectPatterns(nodes), [nodes]);

	if (patterns.length === 0) return null;

	const handleApply = async (pattern: ProcessPattern) => {
		setApplying(pattern.id);
		try {
			const newNodes = pattern.templateNodes.map((t) => ({
				type: t.type,
				label: t.label,
				lane: t.lane || null,
				connections: t.connections || [],
			}));

			const res = await fetch(`/api/sessions/${sessionId}/nodes/bulk`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nodes: newNodes }),
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			const data = await res.json();
			toast.success(`Patron "${pattern.name}" aplicado (${data.created} nodos)`);
		} catch (err) {
			console.error("[PatternLibrary] Apply failed:", err);
			toast.error("Error al aplicar patron");
		} finally {
			setApplying(null);
		}
	};

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] transition-colors hover:text-[#94A3B8]"
			>
				{open ? (
					<ChevronDownIcon className="h-3 w-3" />
				) : (
					<ChevronRightIcon className="h-3 w-3" />
				)}
				<ZapIcon className="h-3 w-3 text-[#EAB308]" />
				Patrones ({patterns.length})
			</button>

			{open && (
				<div className="space-y-1 px-2 pb-2">
					{patterns.map((pattern) => (
						<div
							key={pattern.id}
							className="group rounded-lg bg-[#1E293B]/50 p-2 transition-colors hover:bg-[#1E293B]"
						>
							<div className="flex items-start justify-between gap-1">
								<div>
									<p className="text-[11px] font-medium text-[#E2E8F0]">
										{pattern.name}
									</p>
									<p className="mt-0.5 text-[9px] leading-tight text-[#64748B]">
										{pattern.description}
									</p>
									<p className="mt-1 text-[9px] text-[#64748B]">
										{pattern.templateNodes.length} elementos
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleApply(pattern)}
									disabled={applying === pattern.id}
									className="flex-shrink-0 rounded-md bg-[#2563EB]/10 p-1 text-[#3B82F6] opacity-0 transition-all hover:bg-[#2563EB]/20 group-hover:opacity-100 disabled:opacity-50"
								>
									{applying === pattern.id ? (
										<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
									) : (
										<PlusIcon className="h-3.5 w-3.5" />
									)}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
