"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@repo/ui";
import {
	PanelLeftIcon,
	PanelRightIcon,
	ColumnsIcon,
	HistoryIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "lucide-react";
import { Breadcrumbs } from "@shared/components/Breadcrumbs";
import { ProcedureStatusBar } from "./ProcedureStatusBar";
import { ProcedurePreview } from "./ProcedurePreview";
import { ProcedureGenerateButton } from "./ProcedureGenerateButton";
import { ProcedureVersionTimeline } from "./ProcedureVersionTimeline";
import { ProcedureEditor } from "@meeting/components/ProcedureEditor";

type ProcedureStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

interface ProcedureStep {
	stepNumber?: number;
	action: string;
	responsible?: string;
	description?: string;
	inputs?: string[];
	outputs?: string[];
	systems?: string[];
	controls?: string[];
	exceptions?: { condition: string; action: string }[];
	estimatedTime?: string;
	notes?: string;
}

interface LinkedRisk {
	id: string;
	title: string;
	riskType: string;
	severity: number;
	probability: number;
	riskScore: number;
}

interface VersionEntry {
	id: string;
	version: number;
	status: ProcedureStatus;
	changeNote: string | null;
	changedBy: string;
	changedAt: string;
}

export interface ProcedureData {
	id: string;
	title: string;
	version: number;
	status: ProcedureStatus;
	objective: string | null;
	scope: string | null;
	responsible: string | null;
	frequency: string | null;
	prerequisites: unknown;
	steps: unknown;
	indicators: unknown;
	richContent: unknown;
	controlPointsSummary: string | null;
	processDefinition: { name: string; level: string };
	linkedRisks: LinkedRisk[];
}

interface ProcedureWorkspaceProps {
	procedure: ProcedureData;
	versions: VersionEntry[];
	organizationSlug: string;
}

type ViewMode = "split" | "editor" | "preview";

export function ProcedureWorkspace({ procedure: initialProcedure, versions: initialVersions, organizationSlug }: ProcedureWorkspaceProps) {
	const [procedure, setProcedure] = useState<ProcedureData>(initialProcedure);
	const [versions, setVersions] = useState<VersionEntry[]>(initialVersions);
	const [viewMode, setViewMode] = useState<ViewMode>("split");
	const [showVersions, setShowVersions] = useState(false);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const steps = (procedure.steps || []) as ProcedureStep[];
	const prerequisites = (procedure.prerequisites || []) as string[];
	const indicators = (procedure.indicators || []) as any[];
	const isEditable = procedure.status === "DRAFT" || procedure.status === "IN_REVIEW";

	// Debounced auto-save
	const saveProcedure = useCallback((updates: Partial<ProcedureData>) => {
		const updated = { ...procedure, ...updates };
		setProcedure(updated);
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		saveTimerRef.current = setTimeout(() => {
			fetch(`/api/procedures/${procedure.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			}).catch(() => {});
		}, 1500);
	}, [procedure]);

	// Handle status change
	const handleStatusChange = useCallback(async (newStatus: ProcedureStatus) => {
		const res = await fetch(`/api/procedures/${procedure.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: newStatus }),
		});
		if (res.ok) {
			const updated = await res.json();
			setProcedure((prev) => ({
				...prev,
				status: updated.status,
				version: updated.version ?? prev.version,
				approvedBy: updated.approvedBy,
				approvedAt: updated.approvedAt,
			}));
			// Refresh versions
			const versRes = await fetch(`/api/procedures/${procedure.id}/versions`);
			if (versRes.ok) {
				const { versions: newVersions } = await versRes.json();
				setVersions(newVersions);
			}
		}
	}, [procedure.id]);

	// Handle AI generation
	const handleGenerated = useCallback((generated: any) => {
		setProcedure((prev) => ({
			...prev,
			objective: generated.objective ?? prev.objective,
			scope: generated.scope ?? prev.scope,
			responsible: generated.responsible ?? prev.responsible,
			frequency: generated.frequency ?? prev.frequency,
			prerequisites: generated.prerequisites ?? prev.prerequisites,
			steps: generated.steps ?? prev.steps,
			indicators: generated.indicators ?? prev.indicators,
			controlPointsSummary: generated.controlPointsSummary ?? prev.controlPointsSummary,
		}));
	}, []);

	// Handle rich content change from editor
	const handleEditorChange = useCallback((doc: Record<string, any>) => {
		saveProcedure({ richContent: doc as any });
	}, [saveProcedure]);

	const basePath = `/${organizationSlug}`;

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="shrink-0 space-y-3 border-b border-border/50 bg-background px-6 py-4">
				<Breadcrumbs items={[
					{ label: "Procedimientos", href: `${basePath}/procedures` },
					{ label: procedure.title },
				]} />

				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-semibold text-foreground">{procedure.title}</h1>
						<p className="mt-0.5 text-sm text-muted-foreground">{procedure.processDefinition.name}</p>
					</div>
					<div className="flex items-center gap-2">
						{isEditable && (
							<ProcedureGenerateButton
								procedureId={procedure.id}
								disabled={!isEditable}
								onGenerated={handleGenerated}
							/>
						)}
					</div>
				</div>

				<ProcedureStatusBar
					status={procedure.status}
					onStatusChange={handleStatusChange}
				/>

				{/* View mode toggles + version toggle */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
						<ViewToggle
							icon={<PanelLeftIcon className="h-3.5 w-3.5" />}
							label="Editor"
							active={viewMode === "editor"}
							onClick={() => setViewMode("editor")}
						/>
						<ViewToggle
							icon={<ColumnsIcon className="h-3.5 w-3.5" />}
							label="Split"
							active={viewMode === "split"}
							onClick={() => setViewMode("split")}
						/>
						<ViewToggle
							icon={<PanelRightIcon className="h-3.5 w-3.5" />}
							label="Preview"
							active={viewMode === "preview"}
							onClick={() => setViewMode("preview")}
						/>
					</div>
					<button
						onClick={() => setShowVersions(!showVersions)}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
					>
						<HistoryIcon className="h-3.5 w-3.5" />
						Historial (v{procedure.version})
						{showVersions ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
					</button>
				</div>
			</div>

			{/* Version timeline (collapsible) */}
			{showVersions && (
				<div className="shrink-0 border-b border-border/50 bg-card/50 px-6 py-4 max-h-[240px] overflow-y-auto">
					<ProcedureVersionTimeline versions={versions} currentVersion={procedure.version} />
				</div>
			)}

			{/* Split view content */}
			<div className={cn(
				"flex-1 min-h-0 overflow-hidden",
				viewMode === "split" ? "grid grid-cols-1 lg:grid-cols-2" : "",
			)}>
				{/* Editor panel */}
				{(viewMode === "split" || viewMode === "editor") && (
					<div className="flex flex-col overflow-y-auto border-r border-border/30">
						<div className="shrink-0 border-b border-border/30 px-4 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Editor</p>
						</div>
						<div className="flex-1 overflow-y-auto p-4">
							{isEditable ? (
								<ProcedureEditor
									content={procedure.richContent as any}
									onChange={handleEditorChange}
									sessionId={procedure.id}
								/>
							) : (
								<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
									El procedimiento está {procedure.status === "APPROVED" ? "aprobado" : "publicado"} y no se puede editar.
								</div>
							)}
						</div>
					</div>
				)}

				{/* Preview panel */}
				{(viewMode === "split" || viewMode === "preview") && (
					<div className="flex flex-col overflow-y-auto bg-card/30">
						<div className="shrink-0 border-b border-border/30 px-4 py-2">
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vista Previa</p>
						</div>
						<div className="flex-1 overflow-y-auto">
							<ProcedurePreview
								title={procedure.title}
								version={procedure.version}
								status={procedure.status}
								objective={procedure.objective}
								scope={procedure.scope}
								responsible={procedure.responsible}
								frequency={procedure.frequency}
								prerequisites={prerequisites}
								steps={steps}
								indicators={indicators}
								controlPointsSummary={procedure.controlPointsSummary}
								linkedRisks={procedure.linkedRisks}
								processName={procedure.processDefinition.name}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function ViewToggle({
	icon,
	label,
	active,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
				active
					? "bg-primary/15 text-primary"
					: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
			)}
		>
			{icon}
			<span className="hidden sm:inline">{label}</span>
		</button>
	);
}
