"use client";

import { cn } from "@repo/ui";
import { ClockIcon, CheckCircle2Icon, SendIcon, BookOpenIcon, FileTextIcon } from "lucide-react";

type ProcedureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface VersionEntry {
	id: string;
	version: number;
	status: ProcedureStatus;
	changeNote: string | null;
	changedBy: string;
	changedAt: string;
}

interface ProcedureVersionTimelineProps {
	versions: VersionEntry[];
	currentVersion: number;
}

const statusIcons: Record<ProcedureStatus, React.ReactNode> = {
	DRAFT: <FileTextIcon className="h-3.5 w-3.5" />,
	IN_REVIEW: <SendIcon className="h-3.5 w-3.5" />,
	APPROVED: <CheckCircle2Icon className="h-3.5 w-3.5" />,
	PUBLISHED: <BookOpenIcon className="h-3.5 w-3.5" />,
	ARCHIVED: <ClockIcon className="h-3.5 w-3.5" />,
};

const statusLabels: Record<ProcedureStatus, string> = {
	DRAFT: "Borrador",
	IN_REVIEW: "En revisión",
	APPROVED: "Aprobado",
	PUBLISHED: "Publicado",
	ARCHIVED: "Archivado",
};

const statusColors: Record<ProcedureStatus, string> = {
	DRAFT: "text-slate-400 bg-slate-500/15",
	IN_REVIEW: "text-amber-400 bg-amber-500/15",
	APPROVED: "text-blue-400 bg-blue-500/15",
	PUBLISHED: "text-emerald-400 bg-emerald-500/15",
	ARCHIVED: "text-slate-500 bg-slate-500/15",
};

export function ProcedureVersionTimeline({ versions, currentVersion }: ProcedureVersionTimelineProps) {
	if (versions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 mb-3">
					<ClockIcon className="h-5 w-5 text-muted-foreground/50" />
				</div>
				<p className="text-sm text-muted-foreground">Primera versión</p>
				<p className="text-xs text-muted-foreground/60 mt-0.5">
					El historial aparecerá al avanzar de estado.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-0">
			{/* Current version indicator */}
			<div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-3">
				<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
					v{currentVersion}
				</div>
				<div>
					<p className="text-xs font-medium text-foreground">Versión actual</p>
					<p className="text-[10px] text-muted-foreground">En edición</p>
				</div>
			</div>

			{/* Timeline */}
			<div className="relative pl-4">
				<div className="absolute left-[13px] top-0 bottom-0 w-px bg-border/50" />
				{versions.map((v, i) => (
					<div key={v.id} className="relative flex gap-3 pb-4 last:pb-0">
						<div className={cn(
							"relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
							statusColors[v.status],
						)}>
							{statusIcons[v.status]}
						</div>
						<div className="min-w-0 pt-0.5">
							<div className="flex items-center gap-2">
								<span className="text-xs font-medium text-foreground">v{v.version}</span>
								<span className={cn(
									"inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
									statusColors[v.status],
								)}>
									{statusLabels[v.status]}
								</span>
							</div>
							{v.changeNote && (
								<p className="mt-0.5 text-[11px] text-muted-foreground">{v.changeNote}</p>
							)}
							<p className="mt-0.5 text-[10px] text-muted-foreground/60">
								{new Date(v.changedAt).toLocaleDateString("es-MX", {
									day: "numeric",
									month: "short",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
