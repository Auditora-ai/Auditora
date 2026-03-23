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
	FileUpIcon,
	ShareIcon,
	SparklesIcon,
	CircleIcon,
	CheckCircleIcon,
	AlertTriangleIcon,
	ShieldAlertIcon,
} from "lucide-react";
import { toastSuccess, toastError } from "@repo/ui/components/toast";
import { RaciTab } from "./RaciTab";
import { ConsolidationView } from "./ConsolidationView";
import { IntelligenceTab } from "@projects/components/IntelligenceTab";
import { RiskTab } from "@risk/components/RiskTab";
import { ProcessSchedule } from "@projects/components/ProcessSchedule";
import { NodeComments } from "@meeting/components/NodeComments";
import { useBpmnModeler } from "@meeting/hooks/useBpmnModeler";
import { ProcessCompleteness } from "@meeting/components/ProcessCompleteness";
// BpmnIntelligence and BpmnVersionDiff available but not rendered inside canvas
// to avoid breaking modeler interaction. Activated via toolbar toggles.
import { DocumentList } from "@documents/components/DocumentList";
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

type ProcessSession = {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	endedAt: string | null;
	_count: { diagramNodes: number };
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
				className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/30"
			>
				<div className="flex items-center gap-2.5">
					<Icon className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-semibold">{title}</span>
					{badge?.type === "count" && badge.count > 0 && (
						<span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">
							{badge.count}
						</span>
					)}
					{badge?.type === "status" && badge.status === "success" && (
						<span className="flex items-center gap-1 text-xs text-emerald-600">
							<CheckCircleIcon className="h-3 w-3" />
							{badge.label}
						</span>
					)}
					{badge?.type === "status" && badge.status === "empty" && (
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<CircleIcon className="h-3 w-3" />
							{badge.label}
						</span>
					)}
					{badge?.type === "status" && badge.status === "warning" && (
						<span className="flex items-center gap-1 text-xs text-amber-600">
							<AlertTriangleIcon className="h-3 w-3" />
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
							<SparklesIcon className="mr-1 h-3 w-3" />
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
	const [activeTab, setActiveTab] = useState<string>("diagram");
	const [exporting, setExporting] = useState(false);
	const router = useRouter();

	const tabs = [
		{ key: "diagram", label: "Diagrama", icon: GitBranch },
		{ key: "info", label: "Informacion", icon: FileText },
		{ key: "analysis", label: "Analisis IA", icon: SparklesIcon },
		{ key: "sessions", label: "Sesiones", icon: ClockIcon },
	];

	const processesPath = `${basePath}/procesos`;

	const handleExportReport = async () => {
		setExporting(true);
		try {
			const res = await fetch("/api/processes/export-report", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ svgMap: {} }),
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
	};

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link href={processesPath} className="hover:text-foreground">
					Procesos
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

			{/* Header + Action Bar */}
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-4">
					<Link href={processesPath}>
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold">{process.name}</h1>
							<Badge status={STATUS_MAP[process.processStatus] || "info"}>
								{process.processStatus}
							</Badge>
							{process.category && <Badge>{process.category}</Badge>}
						</div>
						{process.description && (
							<p className="mt-1 text-sm text-muted-foreground max-w-xl">
								{process.description}
							</p>
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
						Export Report
					</Button>
					<Button variant="ghost" size="sm" onClick={handleShare}>
						<ShareIcon className="h-3.5 w-3.5" />
					</Button>
					<div className="ml-2 text-xs text-muted-foreground">
						{process.sessionsCount} sesiones · {process.versionsCount}v
					</div>
				</div>
			</div>

			{/* 4 Smart Tabs */}
			<div className="flex overflow-x-auto border-b">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
								activeTab === tab.key
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Tab Content */}
			{activeTab === "diagram" && (
				<DiagramTab processId={process.id} bpmnXml={process.bpmnXml} versions={process.versions} />
			)}

			{activeTab === "info" && (
				<InformacionTab
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

			{activeTab === "analysis" && (
				<AnalisisIATab
					processId={process.id}
					sessionsCount={process.sessionsCount}
					raciCount={process.raciCount}
					conflictsCount={process.conflictsCount}
				/>
			)}

			{activeTab === "sessions" && (
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
		</div>
	);
}

// ─── Informacion Tab (merged: Details + Children + Documents + Versions) ────

function InformacionTab({
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
	return (
		<div className="space-y-3">
			<CollapsibleSection
				title="Detalles"
				icon={FileText}
				defaultOpen={true}
			>
				<DetailsContent process={process} onUpdate={onUpdate} />
			</CollapsibleSection>

			<CollapsibleSection
				title="Sub-procesos"
				icon={ListIcon}
				badge={
					(process.children?.length ?? 0) > 0
						? { type: "count", count: process.children!.length }
						: { type: "status", status: "empty", label: "Sin sub-procesos" }
				}
			>
				<ChildrenTab
					processId={process.id}
					children={process.children || []}
					processesPath={processesPath}
					onChildAdded={onChildAdded}
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Documentos"
				icon={FileUpIcon}
				badge={{ type: "status", status: "empty", label: "Subir SOPs o manuales" }}
			>
				<DocumentsTab organizationSlug={organizationSlug} />
			</CollapsibleSection>

			{(process.versions?.length ?? 0) > 0 && (
				<CollapsibleSection
					title="Versiones"
					icon={ClockIcon}
					badge={{ type: "count", count: process.versions!.length }}
				>
					<div className="space-y-2">
						{process.versions!.map((v) => (
							<div
								key={v.version}
								className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
							>
								<div className="flex items-center gap-3">
									<Badge status="info">v{v.version}</Badge>
									<span className="text-muted-foreground">
										{v.changeNote || "Sin nota"}
									</span>
								</div>
								<span className="text-xs text-muted-foreground">
									{new Date(v.createdAt).toLocaleDateString()}
								</span>
							</div>
						))}
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
	return (
		<div className="space-y-3">
			<CollapsibleSection
				title="Matriz RACI"
				icon={Table2}
				badge={
					raciCount > 0
						? { type: "count", count: raciCount }
						: { type: "status", status: "empty", label: "No generado" }
				}
				defaultOpen={raciCount > 0}
			>
				<RaciTab processId={processId} />
			</CollapsibleSection>

			<CollapsibleSection
				title="Inteligencia"
				icon={BrainIcon}
				badge={{ type: "status", status: "empty", label: "Analizar proceso" }}
				defaultOpen={false}
			>
				<IntelligenceTab processId={processId} />
			</CollapsibleSection>

			<CollapsibleSection
				title="Riesgos y Calidad"
				icon={ShieldAlertIcon}
				badge={{ type: "status", status: "empty", label: "Analizar riesgos" }}
				defaultOpen={false}
			>
				<RiskTab processId={processId} />
			</CollapsibleSection>

			{sessionsCount >= 2 && (
				<CollapsibleSection
					title="Consolidacion"
					icon={GitMerge}
					badge={
						conflictsCount > 0
							? { type: "status", status: "warning", label: `${conflictsCount} conflictos` }
							: { type: "status", status: "empty", label: "Consolidar perspectivas" }
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
	const containerRef = useRef<HTMLDivElement>(null);
	const [showEditor, setShowEditor] = useState(!!bpmnXml);
	const [saving, setSaving] = useState(false);
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
		// No onConfirmNode/onRejectNode → editor mode (no AI overlays)
		sessionStatus: "ENDED",
	});

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
						Sin diagrama. Crea uno o ejecuta una sesión para generarlo.
					</p>
					<Button onClick={() => setShowEditor(true)}>
						<PlusIcon className="mr-2 h-4 w-4" />
						Crear Diagrama
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
					{saving ? "Guardando..." : "Guardar"}
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

			{!isReady && (
				<div className="flex items-center justify-center" style={{ height: canvasHeight, marginTop: `-${canvasHeight}` }}>
					<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
				</div>
			)}

			{commentMode && selectedNode && (
				<div className="relative" style={{ marginTop: fullscreen ? "calc(-100vh + 49px)" : "-600px", height: fullscreen ? "calc(100vh - 49px)" : "600px", pointerEvents: "none" }}>
					<div style={{ pointerEvents: "auto" }}>
						<NodeComments
							processId={processId}
							nodeId={selectedNode.nodeId}
							nodeLabel={selectedNode.label}
							isOpen={true}
							onClose={() => setSelectedNode(null)}
							position={selectedNode.position}
						/>
					</div>
				</div>
			)}
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

			{showIntelligence && (
				<div className="mt-2">
					<ProcessCompleteness processId={processId} />
				</div>
			)}
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
				toastSuccess("Detalles guardados");
			} else {
				toastError("Error al guardar detalles");
			}
		} catch {
			toastError("Error al guardar detalles");
		} finally {
			setSaving(false);
		}
	}, [description, owner, goals, triggers, outputs, process.id, onUpdate]);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Descripcion</Label>
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
						placeholder="Departamento o persona responsable..."
					/>
				</div>
			</div>
			<TagField label="Objetivos" items={goals} onChange={setGoals} placeholder="Agregar objetivo..." />
			<TagField label="Triggers" items={triggers} onChange={setTriggers} placeholder="Agregar trigger..." />
			<TagField label="Outputs" items={outputs} onChange={setOutputs} placeholder="Agregar output..." />

			<div className="flex justify-end pt-2">
				<Button onClick={saveDetails} disabled={saving} size="sm">
					<SaveIcon className="mr-1.5 h-3.5 w-3.5" />
					{saving ? "Guardando..." : "Guardar"}
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
							className="ml-1 rounded-full p-0.5 hover:bg-accent"
						>
							<XIcon className="h-3 w-3" />
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
					Agregar
				</Button>
			</div>

			{showForm && (
				<Card className="mb-4">
					<CardContent className="flex items-end gap-3 p-4">
						<div className="flex-1 space-y-1.5">
							<Label>Nombre</Label>
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
							<Label>Nivel</Label>
							<Select value={childLevel} onValueChange={setChildLevel}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUBPROCESS">Sub-proceso</SelectItem>
									<SelectItem value="TASK">Tarea</SelectItem>
									<SelectItem value="PROCEDURE">Procedimiento</SelectItem>
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
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-sm text-muted-foreground">
							Sin sub-procesos. Agrega uno para descomponer este proceso.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-2">
					{children.map((child) => {
						const Icon = LEVEL_ICONS[child.level] ?? PackageIcon;
						return (
							<Link key={child.id} href={`${processesPath}/${child.id}`} className="block">
								<Card className="transition-colors hover:bg-accent/50">
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
								Continuar ultima
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
					<CardContent className="flex flex-col items-center justify-center py-12 text-center">
						<ClockIcon className="mb-3 h-8 w-8 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">
							Sin sesiones. Inicia un Deep Dive para mapear este proceso.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{sessions.map((session) => (
						<Card key={session.id}>
							<CardContent className="flex items-center justify-between p-4">
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
										<ClockIcon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											{session.type === "DISCOVERY" ? "Discovery" : "Deep Dive"}
										</p>
										<p className="text-xs text-muted-foreground">
											{session._count.diagramNodes} nodos
										</p>
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
												<PlayIcon className="mr-1 h-3 w-3" />
												Unirse
											</Link>
										</Button>
									) : (
										<Button size="sm" variant="secondary" asChild>
											<Link href={`/${organizationSlug}/session/${session.id}`}>
												<EyeIcon className="mr-1 h-3 w-3" />
												Ver
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

// ─── Documents Tab ──────────────────────────────────────────────────────────

function DocumentsTab({ organizationSlug }: { organizationSlug: string }) {
	const [documents, setDocuments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchDocs = useCallback(async () => {
		setLoading(true);
		try {
			const { orpcClient } = await import("@shared/lib/orpc-client");
			const docs = await orpcClient.documents.list();
			setDocuments(docs || []);
		} catch {
			try {
				const res = await fetch("/api/rpc/documents.list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
				if (res.ok) {
					const data = await res.json();
					setDocuments(data || []);
				}
			} catch {
				// no documents endpoint available
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDocs();
	}, [fetchDocs]);

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		try {
			for (const file of Array.from(files)) {
				const { orpcClient } = await import("@shared/lib/orpc-client");
				const { url, documentId } = await orpcClient.documents.createUploadUrl({
					fileName: file.name,
					mimeType: file.type,
					fileSize: file.size,
				});
				await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
			}
			await fetchDocs();
		} catch (err) {
			console.error("Upload error:", err);
		} finally {
			setUploading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="h-6 w-6 animate-pulse rounded-lg bg-gray-100" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Upload Zone */}
			<div
				className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
					dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
				}`}
				onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
				onClick={() => fileInputRef.current?.click()}
			>
				<FileUpIcon className="mb-2 h-6 w-6 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					{uploading ? "Subiendo..." : "Arrastra archivos o haz click para subir"}
				</p>
				<p className="mt-1 text-xs text-muted-foreground/60">
					PDF, DOCX, TXT, imagenes — max 50MB
				</p>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					multiple
					accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
					onChange={(e) => handleUpload(e.target.files)}
				/>
			</div>

			<DocumentList
				documents={documents}
				showExtract={true}
				onExtracted={fetchDocs}
			/>
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
