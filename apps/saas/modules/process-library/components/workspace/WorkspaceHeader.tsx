"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	ArrowLeft,
	FileText,
	PlayIcon,
	ChevronRightIcon,
	ShareIcon,
	TrashIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
} from "lucide-react";
import { toastSuccess, toastError } from "@repo/ui/components/toast";
import { useTranslations } from "next-intl";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { useRouter } from "next/navigation";
import { ProcessHealthRing } from "../ProcessHealthRing";
import {
	calculatePhaseCompleteness,
	calculateOverallHealth,
} from "../ProcessPhaseDashboard";
import { GenerateEvaluationDialog } from "../GenerateEvaluationDialog";
import { useProcessWorkspace } from "../../context/ProcessWorkspaceContext";
import { MaturityFlow } from "./MaturityFlow";
import { PresenceAvatars } from "@collaboration/components/PresenceAvatars";
import { usePresence } from "@collaboration/hooks/use-presence";
import type { ProcessData } from "../../types";

interface WorkspaceHeaderProps {
	process: ProcessData;
	organizationSlug: string;
	processesPath: string;
	onUpdate: (data: Partial<ProcessData>) => void;
}

export function WorkspaceHeader({
	process,
	organizationSlug,
	processesPath,
	onUpdate,
}: WorkspaceHeaderProps) {
	const router = useRouter();
	const tc = useTranslations("common");
	const tpd = useTranslations("processDetail");
	const { confirm } = useConfirmationAlert();
	const { sidebarCollapsed, toggleSidebar } = useProcessWorkspace();
	const [exporting, setExporting] = useState(false);
	const [editingField, setEditingField] = useState<string | null>(null);
	const { onlineUsers } = usePresence(process.id);
	const [editName, setEditName] = useState(process.name);
	const [editDescription, setEditDescription] = useState(process.description || "");

	const scores = calculatePhaseCompleteness({
		...process,
		risksCount: process.risksCount ?? 0,
		hasIntelligence: process.hasIntelligence ?? false,
	});
	const healthScore = calculateOverallHealth(scores);

	const handleExportReport = async () => {
		setExporting(true);
		try {
			const res = await fetch(`/api/processes/${process.id}/export-book`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			if (res.ok) {
				const html = await res.text();
				const blob = new Blob([html], { type: "text/html" });
				const url = URL.createObjectURL(blob);
				window.open(url, "_blank");
				setTimeout(() => URL.revokeObjectURL(url), 5000);
			}
		} finally {
			setExporting(false);
		}
	};

	const handleShare = async () => {
		const url = `${window.location.origin}/share/${process.id}`;
		await navigator.clipboard.writeText(url);
		toastSuccess("Link copiado");
	};

	const handleDeleteProcess = () => {
		confirm({
			title: "Eliminar proceso",
			message: `Se eliminará "${process.name}" y todos sus sub-procesos, sesiones, RACI, riesgos y versiones asociados. Esta acción no se puede deshacer.`,
			confirmLabel: tc("delete"),
			destructive: true,
			onConfirm: async () => {
				const { orpcClient } = await import("@shared/lib/orpc-client");
				await orpcClient.processes.delete({ processId: process.id });
				router.push(processesPath);
			},
		});
	};

	const saveInlineField = async (field: string, value: string) => {
		if (field === "name" && !value.trim()) {
			setEditName(process.name);
			toastError("El nombre es requerido");
			setEditingField(null);
			return;
		}
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [field]: value || null }),
			});
			if (res.ok) {
				onUpdate({ [field]: value || null });
			} else {
				if (field === "name") setEditName(process.name);
				if (field === "description") setEditDescription(process.description || "");
				toastError(tc("errorSaving"));
			}
		} catch {
			if (field === "name") setEditName(process.name);
			if (field === "description") setEditDescription(process.description || "");
			toastError(tc("errorSaving"));
		}
		setEditingField(null);
	};

	const handleStatusChange = async (newStatus: string) => {
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ processStatus: newStatus }),
			});
			if (res.ok) {
				onUpdate({ processStatus: newStatus });
			} else {
				toastError(tpd("errorStatusChange"));
			}
		} catch {
			toastError(tpd("errorStatusChange"));
		}
	};

	return (
		<div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
			{/* Left: Back + Name + Status */}
			<div className="flex items-center gap-3 min-w-0">
				<Link href={processesPath}>
				<Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0">
					<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>

				{/* Breadcrumb */}
				{process.parent && (
					<div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
						<Link href={`${processesPath}/${process.parent.id}`} className="hover:text-foreground truncate max-w-[120px]">
							{process.parent.name}
						</Link>
						<ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
					</div>
				)}

				{/* Name — inline editable */}
				{editingField === "name" ? (
					<input
						autoFocus
						className="text-base font-semibold bg-transparent border-b-2 border-primary outline-none px-0 py-0 min-w-[200px]"
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						onBlur={() => saveInlineField("name", editName)}
						onKeyDown={(e) => {
							if (e.key === "Enter") saveInlineField("name", editName);
							if (e.key === "Escape") { setEditName(process.name); setEditingField(null); }
						}}
					/>
				) : (
					<h1
						className="text-base font-semibold cursor-pointer hover:text-primary/80 transition-colors truncate max-w-[300px]"
						onClick={() => { setEditName(process.name); setEditingField("name"); }}
						title={process.name}
					>
						{process.name}
					</h1>
				)}

				{process.category && (
					<Badge className="hidden sm:inline-flex">{process.category}</Badge>
				)}

				<div className="hidden sm:block">
					<MaturityFlow
						currentStatus={process.processStatus}
						onStatusChange={handleStatusChange}
						hasBpmn={!!process.bpmnXml}
						hasRaci={process.raciCount > 0}
					/>
				</div>

			<ProcessHealthRing score={healthScore} size={28} />

			{/* Presence indicators */}
			{onlineUsers.length > 0 && (
				<div className="hidden sm:flex items-center ml-1">
					<PresenceAvatars users={onlineUsers} max={4} />
				</div>
			)}
		</div>

		{/* Right: Actions */}
			<div className="flex items-center gap-1.5 shrink-0">
			<Button
				variant="outline"
				size="sm"
				onClick={handleExportReport}
				loading={exporting}
				className="hidden sm:inline-flex"
			>
				<FileText className="mr-1.5 h-3.5 w-3.5" />
				Exportar
			</Button>

			{(process.risksCount ?? 0) > 0 && (
				<div className="hidden sm:block">
					<GenerateEvaluationDialog
						processId={process.id}
						processName={process.name}
						organizationSlug={organizationSlug}
					/>
				</div>
			)}

			<Button size="sm" asChild>
				<Link href={`/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE`}>
					<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
					Deep Dive
				</Link>
			</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-10 w-10 p-0 sm:h-8 sm:w-8">
						<MoreHorizontalIcon className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={handleExportReport} className="sm:hidden">
							<FileText className="mr-2 h-4 w-4" />
							Exportar
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleShare}>
							<ShareIcon className="mr-2 h-4 w-4" />
							Compartir
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={handleDeleteProcess}
						>
							<TrashIcon className="mr-2 h-4 w-4" />
							Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button
					variant="ghost"
					size="sm"
				className="h-10 w-10 p-0 sm:h-8 sm:w-8"
				onClick={toggleSidebar}
					title={sidebarCollapsed ? "Mostrar panel" : "Ocultar panel"}
				>
					{sidebarCollapsed ? (
						<PanelRightOpenIcon className="h-4 w-4" />
					) : (
						<PanelRightCloseIcon className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
