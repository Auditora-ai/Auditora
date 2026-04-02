"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
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
	GitBranch,
	Table2,
	GitMerge,
	Target,
	Zap,
	PackageOpen,
	User,
	PlusIcon,
	SaveIcon,
	XIcon,
	PlayIcon,
	ClockIcon,
	EyeIcon,
	ChevronRightIcon,
	ChevronDownIcon,
	BrainIcon,
	CalendarIcon,
	PackageIcon,
	ListIcon,
	CheckSquareIcon,
	MessageSquareIcon,
	ShareIcon,
	SparklesIcon,
	CircleIcon,
	CheckCircleIcon,
	AlertTriangleIcon,
	ShieldAlertIcon,
	TrashIcon,
	MoreHorizontalIcon,
	GitBranchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toastSuccess, toastError } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { EmptyState } from "@shared/components/EmptyState";
import { RaciTab } from "./RaciTab";
import { ConsolidationView } from "./ConsolidationView";
import { IntelligenceTab } from "@projects/components/IntelligenceTab";
import { RiskTab } from "@risk/components/RiskTab";
import { ProcessSchedule } from "@projects/components/ProcessSchedule";
import { useBpmnModeler } from "@meeting/hooks/useBpmnModeler";
// BpmnIntelligence and BpmnVersionDiff available but not rendered inside canvas
// to avoid breaking modeler interaction. Activated via toolbar toggles.
import { ContextChat } from "./ContextChat";
import { VersionDiff } from "./VersionDiff";
import {
	ProcessPhaseDashboard,
	calculatePhaseCompleteness,
	calculateOverallHealth,
} from "./ProcessPhaseDashboard";
import { ProcessHealthRing } from "./ProcessHealthRing";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@meeting/styles/bpmn-editor.css";
import { applyBizagiColors } from "@meeting/lib/bpmn-colors";

// ─── Types ──────────────────────────────────────────────────────────────────

type ProcessChild = {
	id: string;
	name: string;
	level: string;
	processStatus: string;
	description: string | null;
};

type SessionDeliverable = {
	type: string;
	status: string;
	data: Record<string, unknown> | null;
};

type ProcessSession = {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	endedAt: string | null;
	_count: { diagramNodes: number };
	deliverables?: SessionDeliverable[];
};

type ProcessVersionEntry = {
	id: string;
	version: number;
	changeNote: string | null;
	createdBy: string;
	createdAt: string;
	bpmnXml?: string | null;
};

interface ProcessData {
	id: string;
	name: string;
	description: string | null;
	level: string;
	processStatus: string;
	category: string | null;
	owner: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	bpmnXml: string | null;
	parent?: { id: string; name: string; level: string } | null;
	children?: ProcessChild[];
	sessions?: ProcessSession[];
	versions?: ProcessVersionEntry[];
	sessionsCount: number;
	versionsCount: number;
	raciCount: number;
	risksCount: number;
	hasIntelligence: boolean;
	conflictsCount: number;
}

interface ProcessDetailViewProps {
	process: ProcessData;
	organizationSlug?: string;
	basePath: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, "success" | "info" | "warning" | "error"> = {
	DRAFT: "info",
	MAPPED: "warning",
	VALIDATED: "success",
	APPROVED: "success",
};

const SESSION_STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "error"> = {
	ACTIVE: "info",
	CONNECTING: "warning",
	ENDED: "success",
	FAILED: "error",
	SCHEDULED: "info",
};

const LEVEL_ICONS: Record<string, typeof PackageIcon> = {
	PROCESS: PackageIcon,
	SUBPROCESS: ListIcon,
	TASK: CheckSquareIcon,
	PROCEDURE: FileText,
};

// ─── Collapsible Section ────────────────────────────────────────────────────

type SectionBadge =
	| { type: "count"; count: number }
	| { type: "status"; status: "success" | "empty" | "warning"; label: string };

function CollapsibleSection({
	title,
	icon: Icon,
	badge,
	action,
	defaultOpen = false,
	children,
}: {
	title: string;
	icon: React.ElementType;
	badge?: SectionBadge;
	action?: { label: string; onClick: () => void; loading?: boolean };
	defaultOpen?: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Card>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted"
			>
				<div className="flex items-center gap-2.5">
					<Icon className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-semibold">{title}</span>
					{badge?.type === "count" && badge.count > 0 && (
						<span className="rounded-full bg-accent px-1.5 text-xs text-primary">
							{badge.count}
						</span>
					)}
					{badge?.type === "status" && badge.status === "success" && (
						<span className="flex items-center gap-1 text-xs text-emerald-600">
							<CheckCircleIcon className="h-3.5 w-3.5" />
							{badge.label}
						</span>
					)}
					{badge?.type === "status" && badge.status === "empty" && (
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<CircleIcon className="h-3.5 w-3.5" />
							{badge.label}
						</span>
					)}
					{badge?.type === "status" && badge.status === "warning" && (
						<span className="flex items-center gap-1 text-xs text-amber-600">
							<AlertTriangleIcon className="h-3.5 w-3.5" />
							{badge.label}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{action && (
						<Button
							variant="ghost"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								action.onClick();
							}}
							loading={action.loading}
							className="text-xs"
						>
							<SparklesIcon className="mr-1 h-3.5 w-3.5" />
							{action.label}
						</Button>
					)}
					<ChevronDownIcon
						className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</div>
			</button>
			{open && <CardContent className="border-t pt-4">{children}</CardContent>}
		</Card>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProcessDetailView({
	process: initialProcess,
	organizationSlug,
	basePath,
}: ProcessDetailViewProps) {
	const [process, setProcess] = useState(initialProcess);
	const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
	// Keep DiagramTab mounted once expanded to avoid costly bpmn-js remount
	const [modeloMounted, setModeloMounted] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [editingField, setEditingField] = useState<string | null>(null);
	const [editName, setEditName] = useState(process.name);
	const [editDescription, setEditDescription] = useState(process.description || "");
	const [editOwner, setEditOwner] = useState(process.owner || "");
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");

	const processesPath = `${basePath}/processes`;

	// Calculate health score for the header ring
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
		toastSuccess(t("linkCopied"));
	};

	const handleDeleteProcess = () => {
		confirm({
			title: t("deleteConfirm"),
			message: t("deleteMessage"),
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
		// Validate: name cannot be empty
		if (field === "name" && !value.trim()) {
			setEditName(process.name);
			toastError(t("nameRequired"));
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
				setProcess((prev) => ({ ...prev, [field]: value || null }));
			} else {
				// Revert on failure
				if (field === "name") setEditName(process.name);
				if (field === "description") setEditDescription(process.description || "");
				if (field === "owner") setEditOwner(process.owner || "");
				toastError(tc("errorSaving"));
			}
		} catch {
			if (field === "name") setEditName(process.name);
			if (field === "description") setEditDescription(process.description || "");
			if (field === "owner") setEditOwner(process.owner || "");
			toastError(tc("errorSaving"));
		}
		setEditingField(null);
	};

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={processesPath} className="hover:text-foreground">
					{tc("process")}
				</Link>
				{process.parent && (
					<>
						<ChevronRightIcon className="h-3.5 w-3.5" />
						<Link
							href={`${processesPath}/${process.parent.id}`}
							className="hover:text-foreground"
						>
							{process.parent.name}
						</Link>
					</>
				)}
				<ChevronRightIcon className="h-3.5 w-3.5" />
				<span className="text-foreground font-medium">{process.name}</span>
			</nav>

			{/* Header Identity Card */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					<Link href={processesPath}>
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1 space-y-1">
						{/* Name — inline editable */}
						<div className="flex items-center gap-3">
							{editingField === "name" ? (
								<input
									autoFocus
									className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none px-0 py-0"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									onBlur={() => saveInlineField("name", editName)}
									onKeyDown={(e) => {
										if (e.key === "Enter") saveInlineField("name", editName);
										if (e.key === "Escape") {
											setEditName(process.name);
											setEditingField(null);
										}
									}}
								/>
							) : (
								<h1
									className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
									onClick={() => {
										setEditName(process.name);
										setEditingField("name");
									}}
									title="Click para editar"
								>
									{process.name}
								</h1>
							)}
							{process.category && <Badge>{process.category}</Badge>}
							<ProcessHealthRing score={healthScore} />
						</div>

						{/* Description — inline editable */}
						{editingField === "description" ? (
							<input
								autoFocus
								className="text-sm text-muted-foreground bg-transparent border-b border-primary outline-none w-full max-w-xl px-0 py-0"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								onBlur={() => saveInlineField("description", editDescription)}
								onKeyDown={(e) => {
									if (e.key === "Enter") saveInlineField("description", editDescription);
									if (e.key === "Escape") {
										setEditDescription(process.description || "");
										setEditingField(null);
									}
								}}
								placeholder="Agregar descripción..."
							/>
						) : (
							<p
								className="text-sm text-muted-foreground max-w-xl cursor-pointer hover:text-foreground/70 transition-colors"
								onClick={() => {
									setEditDescription(process.description || "");
									setEditingField("description");
								}}
								title="Click para editar"
							>
								{process.description || "Agregar descripción..."}
							</p>
						)}

						{/* Owner — inline editable */}
						{editingField === "owner" ? (
							<div className="flex items-center gap-1.5 text-xs">
								<User className="h-3.5 w-3.5 text-muted-foreground" />
								<input
									autoFocus
									className="text-xs bg-transparent border-b border-primary outline-none px-0 py-0"
									value={editOwner}
									onChange={(e) => setEditOwner(e.target.value)}
									onBlur={() => saveInlineField("owner", editOwner)}
									onKeyDown={(e) => {
										if (e.key === "Enter") saveInlineField("owner", editOwner);
										if (e.key === "Escape") {
											setEditOwner(process.owner || "");
											setEditingField(null);
										}
									}}
									placeholder="Asignar responsable..."
								/>
							</div>
						) : (
							<div
								className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground/70 transition-colors"
								onClick={() => {
									setEditOwner(process.owner || "");
									setEditingField("owner");
								}}
								title="Click para editar"
							>
								<User className="h-3.5 w-3.5" />
								<span>{process.owner || "Asignar responsable..."}</span>
							</div>
						)}
					</div>
				</div>

				{/* Action Bar */}
				<div className="flex items-center gap-2">
					<Button size="sm" asChild>
						<Link href={`/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE`}>
							<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
							Deep Dive
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportReport}
						loading={exporting}
					>
						<FileText className="mr-1.5 h-3.5 w-3.5" />
						Exportar
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								<MoreHorizontalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
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
				</div>
			</div>

			{/* Onboarding banner for new processes */}
			{healthScore === 0 && !expandedPhase && (
				<div className="rounded-lg border border-blue-200 bg-accent p-4">
					<p className="text-sm font-medium">{t("onboardingTitle")}</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("onboardingDesc1")}{" "}
						{t("onboardingDesc2")}
					</p>
				</div>
			)}

			{/* Phase Dashboard */}
			<ProcessPhaseDashboard
				process={{
					...process,
					risksCount: process.risksCount ?? 0,
					hasIntelligence: process.hasIntelligence ?? false,
				}}
				organizationSlug={organizationSlug || ""}
				onExpandPhase={(phase) => {
					if (phase === "modelo") setModeloMounted(true);
					setExpandedPhase(phase);
				}}
				expandedPhase={expandedPhase}
			/>

			{/* Expanded Phase Content — order matches phase cards */}
			{expandedPhase === "contexto" && (
				<ContextoTab
					process={process}
					processesPath={processesPath}
					organizationSlug={organizationSlug || ""}
					onUpdate={(updated) =>
						setProcess((prev) => ({ ...prev, ...updated }))
					}
					onChildAdded={(child) =>
						setProcess((prev) => ({
							...prev,
							children: [...(prev.children || []), child],
						}))
					}
				/>
			)}

			{expandedPhase === "captura" && (
				<div className="space-y-6">
					<SessionsTab
						sessions={process.sessions || []}
						organizationSlug={organizationSlug || ""}
						processId={process.id}
					/>
					<CollapsibleSection
						title="Agenda"
						icon={CalendarIcon}
						defaultOpen={false}
					>
						<ProcessSchedule process={process as any} organizationSlug={organizationSlug || ""} />
					</CollapsibleSection>
				</div>
			)}

			{/* DiagramTab stays mounted once opened to avoid costly bpmn-js remount */}
			{modeloMounted && (
				<div className={expandedPhase === "modelo" ? "" : "hidden"}>
					<DiagramTab processId={process.id} bpmnXml={process.bpmnXml} versions={process.versions} />
				</div>
			)}

			{expandedPhase === "analisis" && (
				<AnalisisIATab
					processId={process.id}
					sessionsCount={process.sessionsCount}
					raciCount={process.raciCount}
					conflictsCount={process.conflictsCount}
				/>
			)}
		</div>
	);
}

// ─── Contexto Tab (Sub-procesos + Documents + Details form) ─────────────────

function ContextoTab({
	process,
	processesPath,
	organizationSlug,
	onUpdate,
	onChildAdded,
}: {
	process: ProcessData;
	processesPath: string;
	organizationSlug: string;
	onUpdate: (data: Partial<ProcessData>) => void;
	onChildAdded: (child: ProcessChild) => void;
}) {
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");
	return (
		<div className="space-y-3">
			{/* AI Context Chat — describe the process, AI extracts structured data */}
			<ContextChat
				processId={process.id}
				onContextUpdated={(updated) => onUpdate(updated as Partial<ProcessData>)}
			/>

			<CollapsibleSection
				title={t("subprocesses")}
				icon={ListIcon}
				badge={
					(process.children?.length ?? 0) > 0
						? { type: "count", count: process.children!.length }
						: { type: "status", status: "empty", label: t("noSubprocesses") }
				}
				defaultOpen={(process.children?.length ?? 0) > 0}
			>
				<ChildrenTab
					processId={process.id}
					children={process.children || []}
					processesPath={processesPath}
					onChildAdded={onChildAdded}
				/>
		</CollapsibleSection>

		<CollapsibleSection
			title={t("processDetails")}
				icon={FileText}
				defaultOpen={false}
			>
				<DetailsContent process={process} onUpdate={onUpdate} />
			</CollapsibleSection>

			{(process.versions?.length ?? 0) > 0 && (
				<CollapsibleSection
					title="Versiones"
					icon={ClockIcon}
					badge={{ type: "count", count: process.versions!.length }}
				>
					<div className="space-y-4">
						{/* Version Diff — compare 2 versions */}
						{(process.versions?.length ?? 0) >= 2 && (
							<VersionDiff
								processId={process.id}
								versions={process.versions!}
							/>
						)}

						{/* Version list */}
						<div className="space-y-2">
							{process.versions!.map((v) => (
								<div
									key={v.version}
									className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
								>
									<div className="flex items-center gap-3">
										<Badge status="info">v{v.version}</Badge>
										<span className="text-muted-foreground">
											{v.changeNote || tc("noNote")}
										</span>
									</div>
									<span className="text-xs text-muted-foreground">
										{new Date(v.createdAt).toLocaleDateString()}
									</span>
								</div>
							))}
						</div>
					</div>
				</CollapsibleSection>
			)}
		</div>
	);
}

// ─── Analisis IA Tab (merged: RACI + Intelligence + Consolidation) ──────────

function AnalisisIATab({
	processId,
	sessionsCount,
	raciCount,
	conflictsCount,
}: {
	processId: string;
	sessionsCount: number;
	raciCount: number;
	conflictsCount: number;
}) {
	const t = useTranslations("processDetail");
	return (
		<div className="space-y-3">
			<CollapsibleSection
				title={t("raciMatrix")}
				icon={Table2}
				badge={
					raciCount > 0
						? { type: "count", count: raciCount }
						: { type: "status", status: "empty", label: t("notGenerated") }
				}
				defaultOpen={raciCount > 0}
			>
				<RaciTab processId={processId} />
			</CollapsibleSection>

			<CollapsibleSection
				title={t("intelligence")}
				icon={BrainIcon}
				badge={{ type: "status", status: "empty", label: t("analyzeProcess") }}
				defaultOpen={false}
			>
				<IntelligenceTab processId={processId} />
			</CollapsibleSection>

			<CollapsibleSection
				title={t("risksQuality")}
				icon={ShieldAlertIcon}
				badge={{ type: "status", status: "empty", label: t("analyzeRisks") }}
				defaultOpen={false}
			>
				<RiskTab processId={processId} />
			</CollapsibleSection>

			{sessionsCount >= 2 && (
				<CollapsibleSection
					title={t("consolidation")}
					icon={GitMerge}
					badge={
						conflictsCount > 0
							? { type: "status", status: "warning", label: t("conflicts", { count: conflictsCount }) }
							: { type: "status", status: "empty", label: t("consolidate") }
					}
					defaultOpen={conflictsCount > 0}
				>
					<ConsolidationView
						processId={processId}
						sessionCount={sessionsCount}
					/>
				</CollapsibleSection>
			)}
		</div>
	);
}

// ─── Diagram Tab ────────────────────────────────────────────────────────────

/**
 * DiagramTab — BPMN Modeler for process editing
 *
 * Uses the SAME useBpmnModeler hook as DiagramPanel (live sessions).
 * One modeler, one source of truth. No duplicate init code.
 *
 * In editor mode (no onConfirmNode/onRejectNode), the hook:
 * - Loads initialXml instead of empty diagram
 * - Skips AI merge logic and state overlays
 * - Provides the same zoom/undo/redo/grid/deep-linking API
 */
function DiagramTab({
	processId,
	bpmnXml,
	versions,
}: {
	processId: string;
	bpmnXml: string | null;
	versions?: ProcessVersionEntry[];
}) {
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");
	const containerRef = useRef<HTMLDivElement>(null);
	const [showEditor, setShowEditor] = useState(!!bpmnXml);
	const [saving, setSaving] = useState(false);
	const [repairing, setRepairing] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const [commentMode, setCommentMode] = useState(false);
	const [showIntelligence, setShowIntelligence] = useState(false);
	const [selectedNode, setSelectedNode] = useState<{
		nodeId: string;
		label: string;
		position: { x: number; y: number };
	} | null>(null);

	// ─── Single shared hook — same as live sessions ─────────────────
	const {
		isReady,
		renderError,
		rebuildFromNodes,
		zoomIn,
		zoomOut,
		zoomFit,
		undo,
		redo,
		canUndo,
		canRedo,
		toggleGrid,
		gridEnabled,
		getModeler,
		selectedElement,
		navigationStack,
		navigateUp,
	} = useBpmnModeler({
		containerRef: showEditor ? containerRef : { current: null },
		initialXml: bpmnXml || undefined,
		sessionStatus: "ENDED",
	});

	// Rebuild diagram from nodes stored in the database
	const handleRebuildFromNodes = useCallback(async () => {
		setRepairing(true);
		try {
			const res = await fetch(`/api/processes/${processId}/diagram`);
			if (!res.ok) throw new Error("Failed to fetch diagram data");
			const data = await res.json();
			if (data.nodes && data.nodes.length > 0) {
				await rebuildFromNodes(data.nodes);
			}
		} catch (err) {
			console.error("[DiagramTab] Rebuild failed:", err);
		} finally {
			setRepairing(false);
		}
	}, [processId, rebuildFromNodes]);

	// AI-powered repair
	const handleRepairWithAi = useCallback(async () => {
		setRepairing(true);
		try {
			const res = await fetch(`/api/processes/${processId}/repair`, {
				method: "POST",
			});
			if (!res.ok) throw new Error("Repair failed");
			const data = await res.json();
			if (data.nodes && data.nodes.length > 0) {
				await rebuildFromNodes(data.nodes);
				// Save the repaired diagram
				const modeler = getModeler();
				if (modeler) {
					const { xml } = await modeler.saveXML({ format: true });
					await fetch(`/api/processes/${processId}/diagram`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ bpmnXml: xml }),
					});
				}
			}
		} catch (err) {
			console.error("[DiagramTab] AI repair failed:", err);
		} finally {
			setRepairing(false);
		}
	}, [processId, rebuildFromNodes, getModeler]);

	// Element click for comments
	useEffect(() => {
		const modeler = getModeler();
		if (!modeler || !isReady) return;

		const handler = (e: any) => {
			const el = e.element;
			if (!el || el.type === "bpmn:Process" || el.type === "label") return;
			const gfx = e.gfx || document.querySelector(`[data-element-id="${el.id}"]`);
			if (!gfx || !containerRef.current) return;
			const containerRect = containerRef.current.getBoundingClientRect();
			const gfxRect = gfx.getBoundingClientRect();
			setSelectedNode({
				nodeId: el.id,
				label: el.businessObject?.name || el.id,
				position: { x: gfxRect.right - containerRect.left + 8, y: gfxRect.top - containerRect.top },
			});
		};

		modeler.get("eventBus").on("element.click", handler);
		return () => modeler.get("eventBus").off("element.click", handler);
	}, [isReady, getModeler]);

	// Save to API (Ctrl+S)
	const handleSave = useCallback(async () => {
		const modeler = getModeler();
		if (!modeler) return;
		setSaving(true);
		try {
			const { xml } = await modeler.saveXML({ format: true });
			await fetch(`/api/processes/${processId}/diagram`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bpmnXml: xml }),
			});
		} catch (err) {
			console.error("[DiagramTab] Save error:", err);
		} finally {
			setSaving(false);
		}
	}, [processId, getModeler]);

	// Keyboard shortcuts
	useEffect(() => {
		if (!showEditor) return;
		const handler = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
			if (e.key === "Escape" && fullscreen) setFullscreen(false);
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [showEditor, handleSave, fullscreen]);

	// Re-fit on fullscreen toggle
	useEffect(() => {
		if (!isReady) return;
		const timer = setTimeout(() => zoomFit(), 100);
		return () => clearTimeout(timer);
	}, [fullscreen, isReady, zoomFit]);

	// ─── Empty state ────────────────────────────────────────────────
	if (!showEditor) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<GitBranch className="mb-3 h-8 w-8 text-muted-foreground/40" />
					<p className="mb-4 text-sm text-muted-foreground">
						{t("noDiagram")}
					</p>
					<Button onClick={() => setShowEditor(true)}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("createDiagram")}
					</Button>
				</CardContent>
			</Card>
		);
	}

	// ─── Render ─────────────────────────────────────────────────────
	const canvasHeight = fullscreen ? "100vh" : "600px";

	const toolbar = (
		<div className={`flex items-center justify-between ${fullscreen ? "px-4 py-2 border-b border-border bg-background" : "mb-2"}`}>
			<div className="flex items-center gap-1">
				<Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
					Undo
				</Button>
				<Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
					Redo
				</Button>
				<div className="mx-2 h-5 w-px bg-border" />
				<Button variant="ghost" size="sm" onClick={zoomIn}>
					Zoom +
				</Button>
				<Button variant="ghost" size="sm" onClick={zoomOut}>
					Zoom -
				</Button>
				<Button variant="ghost" size="sm" onClick={zoomFit}>
					Ajustar
				</Button>
				<div className="mx-2 h-5 w-px bg-border" />
				<Button
					variant={commentMode ? "secondary" : "ghost"} size="sm"
					onClick={() => { setCommentMode(!commentMode); if (commentMode) setSelectedNode(null); }}
				>
					<MessageSquareIcon className="mr-1.5 h-3.5 w-3.5" />
					Comentarios
				</Button>
				<Button
					variant={showIntelligence ? "secondary" : "ghost"} size="sm"
					onClick={() => setShowIntelligence(!showIntelligence)}
				>
					<SparklesIcon className="mr-1.5 h-3.5 w-3.5" />
					AI
				</Button>
			</div>
			<div className="flex items-center gap-1">
				<Button onClick={handleSave} disabled={saving} size="sm">
					<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
					{saving ? tc("saving") : tc("save")}
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)}>
					{fullscreen ? (
						<>
							<XIcon className="mr-1.5 h-3.5 w-3.5" />
							Salir
						</>
					) : (
						<>
							<EyeIcon className="mr-1.5 h-3.5 w-3.5" />
							Maximizar
						</>
					)}
				</Button>
			</div>
		</div>
	);

	const canvas = (
		<>
			<div
				ref={containerRef}
				className="bpmn-editor-canvas"
				style={{
					height: fullscreen ? "calc(100vh - 49px)" : "600px",
					width: "100%",
					border: fullscreen ? "none" : "1px solid var(--border)",
					borderRadius: fullscreen ? "0" : "var(--radius)",
				}}
			/>

			{(renderError || repairing) && (
				<div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-md border border-orientation bg-amber-100 px-4 py-2 text-xs text-amber-800 shadow-sm" style={{ marginTop: fullscreen ? "-calc(100vh - 49px)" : "-600px", position: "relative" }}>
					<div className="flex items-center gap-3">
						<span>{repairing ? t("repairingDiagram") : renderError}</span>
						{!repairing && (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleRebuildFromNodes}
									className="rounded bg-yellow-200 px-2 py-0.5 text-[10px] font-medium text-amber-900 hover:bg-amber-300 transition-colors"
								>
									{t("regenerate")}
								</button>
								<button
									type="button"
									onClick={handleRepairWithAi}
									className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-600 transition-colors"
								>
									{t("fixWithAi")}
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{!isReady && (
				<div className="flex items-center justify-center" style={{ height: canvasHeight, marginTop: `-${canvasHeight}` }}>
					<div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
				</div>
			)}

			{/* TODO: NodeComments — rebuild from scratch */}
		</>
	);

	// Fullscreen: fixed overlay covering entire screen
	if (fullscreen) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col bg-background">
				{toolbar}
				{canvas}
			</div>
		);
	}

	// Normal: inline in the page
	return (
		<div>
			{toolbar}
			{canvas}

			{/* TODO: ProcessCompleteness — rebuild from scratch */}
		</div>
	);
}

// ─── Details Content ────────────────────────────────────────────────────────

function DetailsContent({
	process,
	onUpdate,
}: {
	process: ProcessData;
	onUpdate: (data: Partial<ProcessData>) => void;
}) {
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");
	const [description, setDescription] = useState(process.description || "");
	const [owner, setOwner] = useState(process.owner || "");
	const [goals, setGoals] = useState<string[]>(process.goals);
	const [triggers, setTriggers] = useState<string[]>(process.triggers);
	const [outputs, setOutputs] = useState<string[]>(process.outputs);
	const [saving, setSaving] = useState(false);

	const saveDetails = useCallback(async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/processes/${process.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description, owner, goals, triggers, outputs }),
			});
			if (res.ok) {
				onUpdate({ description, owner, goals, triggers, outputs });
				toastSuccess(t("detailsSaved"));
			} else {
				toastError(t("errorSavingDetails"));
			}
		} catch {
			toastError(t("errorSavingDetails"));
		} finally {
			setSaving(false);
		}
	}, [description, owner, goals, triggers, outputs, process.id, onUpdate]);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>{t("descriptionLabel")}</Label>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
					placeholder="Describe este proceso..."
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label>Owner</Label>
					<Input
						value={owner}
						onChange={(e) => setOwner(e.target.value)}
						placeholder={t("ownerPlaceholder")}
					/>
				</div>
			</div>
			<TagField label={t("goals")} items={goals} onChange={setGoals} placeholder={t("addGoalPlaceholder")} />
			<TagField label={t("triggers")} items={triggers} onChange={setTriggers} placeholder={t("addTriggerPlaceholder")} />
			<TagField label={t("outputs")} items={outputs} onChange={setOutputs} placeholder={t("addOutputPlaceholder")} />

			<div className="flex justify-end pt-2">
				<Button onClick={saveDetails} disabled={saving} size="sm">
					<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
					{saving ? tc("saving") : tc("save")}
				</Button>
			</div>
		</div>
	);
}

// ─── Tag Field ──────────────────────────────────────────────────────────────

function TagField({
	label,
	items,
	onChange,
	placeholder,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	placeholder: string;
}) {
	const [input, setInput] = useState("");

	const add = () => {
		const value = input.trim();
		if (value && !items.includes(value)) {
			onChange([...items, value]);
			setInput("");
		}
	};

	const remove = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex flex-wrap gap-1.5">
				{items.map((item, i) => (
					<Badge key={i} status="info" className="gap-1 pr-1">
						{item}
						<button
							type="button"
							onClick={() => remove(i)}
							className="ml-1 rounded-full p-0.5 hover:bg-muted"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</Badge>
				))}
			</div>
			<div className="flex gap-2">
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={placeholder}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							add();
						}
					}}
					className="flex-1"
				/>
				<Button variant="secondary" size="sm" onClick={add} disabled={!input.trim()}>
					<PlusIcon className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}

// ─── Children Tab ───────────────────────────────────────────────────────────

function ChildrenTab({
	processId,
	children,
	processesPath,
	onChildAdded,
}: {
	processId: string;
	children: ProcessChild[];
	processesPath: string;
	onChildAdded: (child: ProcessChild) => void;
}) {
	const tp = useTranslations("emptyStates.processes");
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");
	const [showForm, setShowForm] = useState(false);
	const [childName, setChildName] = useState("");
	const [childLevel, setChildLevel] = useState("SUBPROCESS");
	const [creating, setCreating] = useState(false);

	const createChild = useCallback(async () => {
		if (!childName.trim()) return;
		setCreating(true);
		try {
			const res = await fetch(`/api/processes/${processId}/children`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: childName, level: childLevel }),
			});
			if (res.ok) {
				const data = await res.json();
				onChildAdded({
					id: data.id,
					name: data.name,
					level: data.level,
					processStatus: data.processStatus || "DRAFT",
					description: data.description || null,
				});
				setChildName("");
				setShowForm(false);
			}
		} finally {
			setCreating(false);
		}
	}, [processId, childName, childLevel, onChildAdded]);

	return (
		<div>
			<div className="mb-3 flex justify-end">
				<Button variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}>
					<PlusIcon className="mr-1.5 h-3.5 w-3.5" />
					{tc("add")}
				</Button>
			</div>

			{showForm && (
				<Card className="mb-4">
					<CardContent className="flex items-end gap-3 p-4">
						<div className="flex-1 space-y-1.5">
							<Label>{tc("name")}</Label>
							<Input
								value={childName}
								onChange={(e) => setChildName(e.target.value)}
								placeholder="Nombre del proceso..."
								onKeyDown={(e) => {
									if (e.key === "Enter") createChild();
								}}
							/>
						</div>
						<div className="w-[160px] space-y-1.5">
							<Label>{t("level")}</Label>
							<Select value={childLevel} onValueChange={setChildLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUBPROCESS">{t("subprocess")}</SelectItem>
									<SelectItem value="TASK">{t("task")}</SelectItem>
									<SelectItem value="PROCEDURE">{t("procedure")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button onClick={createChild} disabled={creating || !childName.trim()}>
							{creating ? "..." : "Crear"}
						</Button>
					</CardContent>
				</Card>
			)}

			{children.length === 0 ? (
				<Card>
					<EmptyState
						icon={GitBranchIcon}
						title={tp("noSubprocesses")}
						description={tp("noSubprocessesDesc")}
						compact
					/>
				</Card>
			) : (
				<div className="space-y-2">
					{children.map((child) => {
						const Icon = LEVEL_ICONS[child.level] ?? PackageIcon;
						return (
							<Link key={child.id} href={`${processesPath}/${child.id}`} className="block">
								<Card className="transition-colors hover:bg-muted">
									<CardContent className="flex items-center gap-3 p-3">
										<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
										<span className="flex-1 font-medium">{child.name}</span>
										<Badge status="info" className="text-xs">
											{child.level}
										</Badge>
										<Badge status={STATUS_MAP[child.processStatus] || "info"} className="text-xs">
											{child.processStatus}
										</Badge>
										<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ─── Sessions Tab ───────────────────────────────────────────────────────────

function SessionsTab({
	sessions,
	organizationSlug,
	processId,
}: {
	sessions: ProcessSession[];
	organizationSlug: string;
	processId: string;
}) {
	const tp = useTranslations("emptyStates.processes");
	const t = useTranslations("processDetail");
	const tc = useTranslations("common");
	const lastSession = sessions[0];

	return (
		<div>
			<div className="mb-4 flex items-center justify-end gap-2">
				<div className="flex items-center gap-2">
					{lastSession && lastSession.status === "ENDED" && (
						<Button variant="secondary" size="sm" asChild>
							<Link
								href={`/${organizationSlug}/sessions/new?processId=${processId}&type=DEEP_DIVE&continuationOf=${lastSession.id}`}
							>
								<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
								{t("continueLastSession")}
							</Link>
						</Button>
					)}
					<Button size="sm" asChild>
						<Link
							href={`/${organizationSlug}/sessions/new?processId=${processId}&type=DEEP_DIVE`}
						>
							<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
							Deep Dive
						</Link>
					</Button>
				</div>
			</div>

			{sessions.length === 0 ? (
				<Card>
					<EmptyState
						icon={ClockIcon}
						title={tp("noSessions")}
						description={tp("noSessionsDesc")}
						compact
					/>
				</Card>
			) : (
				<div className="space-y-3">
					{sessions.map((session) => (
						<Card key={session.id}>
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
										<ClockIcon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											{session.type === "DISCOVERY" ? "Discovery" : "Deep Dive"}
										</p>
										<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
											<span>{t("nodes", { count: session._count.diagramNodes })}</span>
											{session.deliverables?.map((d) => {
												if (d.type === "process_audit" && d.data) {
													const audit = d.data as { completenessScore?: number; newGaps?: unknown[] };
													return (
														<span key={d.type} className="flex items-center gap-1">
															{audit.completenessScore != null && (
																<span className="font-medium text-primary">{audit.completenessScore}%</span>
															)}
															{(audit.newGaps?.length ?? 0) > 0 && (
																<span className="text-amber-600">{audit.newGaps!.length} gaps</span>
															)}
														</span>
													);
												}
												if (d.type === "risk_audit" && d.data) {
													const risks = d.data as { newRisks?: unknown[] };
													if ((risks.newRisks?.length ?? 0) > 0) {
														return (
															<span key={d.type} className="text-red-600">
																{t("risks", { count: risks.newRisks!.length })}
															</span>
														);
													}
												}
												return null;
											})}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge status={SESSION_STATUS_VARIANT[session.status] || "info"}>
										{session.status}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{new Date(session.createdAt).toLocaleDateString()}
									</span>
									{session.status === "ACTIVE" || session.status === "CONNECTING" ? (
										<Button size="sm" asChild>
											<Link href={`/${organizationSlug}/session/${session.id}/live`}>
												<PlayIcon className="mr-1 h-3.5 w-3.5" />
												{t("join")}
											</Link>
										</Button>
									) : (
										<Button size="sm" variant="secondary" asChild>
											<Link href={`/${organizationSlug}/session/${session.id}`}>
												<EyeIcon className="mr-1 h-3.5 w-3.5" />
												{tc("view")}
											</Link>
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyBpmnXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
