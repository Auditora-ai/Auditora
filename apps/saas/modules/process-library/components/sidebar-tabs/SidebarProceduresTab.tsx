"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	PlusIcon,
	ClipboardListIcon,
	SparklesIcon,
	FileTextIcon,
	ChevronRightIcon,
	LoaderIcon,
} from "lucide-react";
import { cn } from "@repo/ui";

interface ProcedureSummary {
	id: string;
	title: string;
	status: string;
	version: number;
	responsible: string | null;
	nodeId: string | null;
	updatedAt: string;
}

interface SidebarProceduresTabProps {
	processId: string;
	processName: string;
	organizationSlug: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
	DRAFT: { label: "Borrador", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
	IN_REVIEW: { label: "En revisión", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
	APPROVED: { label: "Aprobado", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
	PUBLISHED: { label: "Publicado", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
	ARCHIVED: { label: "Archivado", className: "bg-slate-500/20 text-slate-500 border-slate-500/30" },
};

export function SidebarProceduresTab({ processId, processName, organizationSlug }: SidebarProceduresTabProps) {
	const [procedures, setProcedures] = useState<ProcedureSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);

	useEffect(() => {
		let cancelled = false;
		async function fetchProcedures() {
			try {
				const res = await fetch(`/api/processes/${processId}/procedures`);
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) setProcedures(data);
				}
			} catch {
				// silently fail
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchProcedures();
		return () => { cancelled = true; };
	}, [processId]);

	const handleGenerateAI = async () => {
		setGenerating(true);
		try {
			const res = await fetch(`/api/processes/${processId}/procedures/generate`, {
				method: "POST",
			});
			if (res.ok) {
				const newProc = await res.json();
				setProcedures((prev) => [newProc, ...prev]);
			}
		} catch {
			// silently fail
		} finally {
			setGenerating(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
				<LoaderIcon className="h-5 w-5 animate-spin" />
				<span className="text-xs">Cargando procedimientos…</span>
			</div>
		);
	}

	if (procedures.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 py-8 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
					<ClipboardListIcon className="h-6 w-6 text-slate-500" />
				</div>
				<div>
					<p className="text-sm font-medium text-slate-300">Sin procedimientos</p>
					<p className="mt-1 text-xs text-slate-500">
						Los SOPs documentan paso a paso cómo ejecutar este proceso.
					</p>
				</div>
				<div className="flex flex-col gap-2 w-full">
					<Button
						size="sm"
						onClick={handleGenerateAI}
						disabled={generating}
						className="w-full"
					>
						{generating ? (
							<LoaderIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<SparklesIcon className="mr-1.5 h-3.5 w-3.5" />
						)}
						{generating ? "Generando con IA…" : "Generar SOP con IA"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						asChild
						className="w-full border-slate-700"
					>
						<Link href={`/${organizationSlug}/processes/${processId}?tab=procedures&action=create`}>
							<PlusIcon className="mr-1.5 h-3.5 w-3.5" />
							Crear manualmente
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{/* Header with count + add */}
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-slate-400">
					{procedures.length} procedimiento{procedures.length !== 1 ? "s" : ""}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleGenerateAI}
					disabled={generating}
					className="h-7 text-xs text-slate-400 hover:text-slate-200"
				>
					{generating ? (
						<LoaderIcon className="mr-1 h-3 w-3 animate-spin" />
					) : (
						<SparklesIcon className="mr-1 h-3 w-3" />
					)}
					{generating ? "Generando…" : "Generar SOP"}
				</Button>
			</div>

			{/* Procedure cards */}
			{procedures.map((proc) => {
				const status = statusConfig[proc.status] ?? statusConfig.DRAFT;
				return (
					<Link
						key={proc.id}
						href={`/${organizationSlug}/processes/${processId}?tab=procedures&procedureId=${proc.id}`}
						className="group flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900"
					>
						<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-400 group-hover:text-slate-200">
							<FileTextIcon className="h-4 w-4" />
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="truncate text-sm font-medium text-slate-200 group-hover:text-slate-50">
									{proc.title}
								</span>
								<ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-slate-400" />
							</div>
							<div className="mt-1 flex items-center gap-2">
								<Badge className={cn("border text-[10px]", status.className)}>
									{status.label}
								</Badge>
								<span className="text-[10px] text-slate-500">v{proc.version}</span>
								{proc.responsible && (
									<span className="truncate text-[10px] text-slate-500">
										· {proc.responsible}
									</span>
								)}
							</div>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
