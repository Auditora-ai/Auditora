"use client";

import { useState } from "react";
import { EmptyState } from "@shared/components/EmptyState";
import { ClipboardListIcon, PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { cn } from "@repo/ui";
import Link from "next/link";
import { CreateProcedureDialog } from "./CreateProcedureDialog";

type ProcedureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface ProcedureItem {
	id: string;
	title: string;
	status: ProcedureStatus;
	version: number;
	responsible: string | null;
	frequency: string | null;
	nodeId: string | null;
	linkedRiskIds: string[];
	updatedAt: Date;
	processDefinition: { name: string; level: string };
}

interface ProcessOption {
	id: string;
	name: string;
}

interface ProcedureListProps {
	procedures: ProcedureItem[];
	processes: ProcessOption[];
	organizationSlug: string;
}

const statusConfig: Record<ProcedureStatus, { label: string; color: string }> = {
	DRAFT: { label: "Borrador", color: "bg-slate-500/20 text-slate-400" },
	IN_REVIEW: { label: "En revisión", color: "bg-amber-500/20 text-amber-400" },
	APPROVED: { label: "Aprobado", color: "bg-blue-500/20 text-blue-400" },
	PUBLISHED: { label: "Publicado", color: "bg-emerald-500/20 text-emerald-400" },
	ARCHIVED: { label: "Archivado", color: "bg-slate-500/20 text-slate-500" },
};

const statusOptions: { value: string; label: string }[] = [
	{ value: "", label: "Todos los estados" },
	{ value: "DRAFT", label: "Borrador" },
	{ value: "IN_REVIEW", label: "En revisión" },
	{ value: "APPROVED", label: "Aprobado" },
	{ value: "PUBLISHED", label: "Publicado" },
];

export function ProcedureList({ procedures, processes, organizationSlug }: ProcedureListProps) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [processFilter, setProcessFilter] = useState("");
	const [showCreate, setShowCreate] = useState(false);

	const filtered = procedures.filter((proc) => {
		if (search && !proc.title.toLowerCase().includes(search.toLowerCase())) return false;
		if (statusFilter && proc.status !== statusFilter) return false;
		if (processFilter && proc.processDefinition.name !== processFilter) return false;
		return true;
	});

	return (
		<>
			{/* Toolbar */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{/* Search */}
				<div className="relative flex-1 max-w-sm">
					<SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar procedimiento..."
						className="w-full rounded-lg border border-border/50 bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div className="flex items-center gap-2">
					{/* Status filter */}
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
					>
						{statusOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>{opt.label}</option>
						))}
					</select>

					{/* Process filter */}
					{processes.length > 1 && (
						<select
							value={processFilter}
							onChange={(e) => setProcessFilter(e.target.value)}
							className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
						>
							<option value="">Todos los procesos</option>
							{processes.map((p) => (
								<option key={p.id} value={p.name}>{p.name}</option>
							))}
						</select>
					)}

					{/* Create button */}
					<button
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						<PlusIcon className="h-4 w-4" />
						Crear Procedimiento
					</button>
				</div>
			</div>

			{/* Results */}
			{filtered.length === 0 ? (
				procedures.length === 0 ? (
					<EmptyState
						icon={ClipboardListIcon}
						title="Sin procedimientos documentados"
						description="Los procedimientos se generan automáticamente al documentar procesos en las sesiones de trabajo. También puedes crearlos manualmente."
						actions={[
							{
								label: "Crear Procedimiento",
								onClick: () => setShowCreate(true),
								variant: "primary",
								icon: <PlusIcon className="h-4 w-4 mr-1" />,
							},
							{
								label: "Ir a Procesos",
								href: `/${organizationSlug}/processes`,
								variant: "secondary",
							},
						]}
					/>
				) : (
					<div className="py-12 text-center text-sm text-muted-foreground">
						Sin resultados para los filtros aplicados.
					</div>
				)
			) : (
				<div className="grid gap-3">
					{filtered.map((proc) => {
						const status = statusConfig[proc.status];
						return (
							<Link
								key={proc.id}
								href={`/${organizationSlug}/processes`}
								className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-accent/30 hover:shadow-sm"
							>
								<div className="flex items-start gap-3 min-w-0">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
										<ClipboardListIcon className="h-4 w-4 text-primary" />
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium text-foreground truncate">
												{proc.title}
											</span>
											<span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", status.color)}>
												{status.label}
											</span>
										</div>
										<div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
											<span>{proc.processDefinition.name}</span>
											{proc.responsible && (
												<>
													<span>·</span>
													<span>{proc.responsible}</span>
												</>
											)}
											{proc.linkedRiskIds.length > 0 && (
												<>
													<span>·</span>
													<span>{proc.linkedRiskIds.length} riesgo{proc.linkedRiskIds.length !== 1 ? "s" : ""}</span>
												</>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<span className="hidden sm:inline">
										{new Date(proc.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
									</span>
									<span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">v{proc.version}</span>
								</div>
							</Link>
						);
					})}
				</div>
			)}

			{/* Create dialog */}
			<CreateProcedureDialog
				open={showCreate}
				onOpenChange={setShowCreate}
				processes={processes}
				organizationSlug={organizationSlug}
			/>
		</>
	);
}
