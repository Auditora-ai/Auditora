"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import {
	GitBranch,
	PlusIcon,
	SaveIcon,
	XIcon,
	EyeIcon,
	Undo2Icon,
	Redo2Icon,
	ZoomInIcon,
	ZoomOutIcon,
	MaximizeIcon,
} from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { useTranslations } from "next-intl";
import { useBpmnModeler } from "@meeting/hooks/useBpmnModeler";
import { useProcessWorkspace } from "../../context/ProcessWorkspaceContext";
import { HealthBadgeOverlay } from "./HealthBadgeOverlay";
import { EvalFeedbackOverlay } from "./EvalFeedbackOverlay";
import type { RaciEntry, ProcessEvalFeedbackData } from "../../types";

interface DiagramCanvasProps {
	processId: string;
	bpmnXml: string | null;
	raciEntries?: RaciEntry[];
	evalFeedback?: ProcessEvalFeedbackData;
}

export function DiagramCanvas({ processId, bpmnXml, raciEntries, evalFeedback }: DiagramCanvasProps) {
	const tc = useTranslations("common");
	const tpd = useTranslations("processDetail");
	const containerRef = useRef<HTMLDivElement>(null);
	const [showEditor, setShowEditor] = useState(!!bpmnXml);
	const [saving, setSaving] = useState(false);
	const [repairing, setRepairing] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const { setSelectedElement, clearSelection } = useProcessWorkspace();

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
		getModeler,
		navigationStack,
		navigateUp,
	} = useBpmnModeler({
		containerRef: showEditor ? containerRef : { current: null },
		initialXml: bpmnXml || undefined,
		sessionStatus: "ENDED",
	});

	// Wire bpmn-js element selection → ProcessWorkspaceContext
	useEffect(() => {
		const modeler = getModeler();
		if (!modeler || !isReady) return;

		const handleElementClick = (e: any) => {
			const el = e.element;
			if (!el || el.type === "bpmn:Process" || el.type === "label") {
				clearSelection();
				return;
			}
			setSelectedElement({
				id: el.id,
				type: el.type,
				name: el.businessObject?.name || el.id,
			});
		};

		const handleCanvasClick = () => {
			clearSelection();
		};

		const eventBus = modeler.get("eventBus");
		eventBus.on("element.click", handleElementClick);
		eventBus.on("canvas.click", handleCanvasClick);
		return () => {
			eventBus.off("element.click", handleElementClick);
			eventBus.off("canvas.click", handleCanvasClick);
		};
	}, [isReady, getModeler, setSelectedElement, clearSelection]);

	// Save diagram
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
			console.error("[DiagramCanvas] Save error:", err);
		} finally {
			setSaving(false);
		}
	}, [processId, getModeler]);

	// Rebuild from DB nodes
	const handleRebuildFromNodes = useCallback(async () => {
		setRepairing(true);
		try {
			const res = await fetch(`/api/processes/${processId}/diagram`);
			if (!res.ok) throw new Error("Failed to fetch diagram data");
			const data = await res.json();
			if (data.nodes?.length > 0) await rebuildFromNodes(data.nodes);
		} catch (err) {
			console.error("[DiagramCanvas] Rebuild failed:", err);
		} finally {
			setRepairing(false);
		}
	}, [processId, rebuildFromNodes]);

	// AI repair
	const handleRepairWithAi = useCallback(async () => {
		setRepairing(true);
		try {
			const res = await fetch(`/api/processes/${processId}/repair`, { method: "POST" });
			if (!res.ok) throw new Error("Repair failed");
			const data = await res.json();
			if (data.nodes?.length > 0) {
				await rebuildFromNodes(data.nodes);
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
			console.error("[DiagramCanvas] AI repair failed:", err);
		} finally {
			setRepairing(false);
		}
	}, [processId, rebuildFromNodes, getModeler]);

	// Keyboard shortcuts
	useEffect(() => {
		if (!showEditor) return;
		const handler = (e: KeyboardEvent) => {
			// Don't intercept when typing in inputs
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

			if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
			if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); /* export handled by header */ }
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

	// Empty state — no diagram
	if (!showEditor) {
		return (
			<div className="flex h-full items-center justify-center">
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 px-16 text-center">
						<GitBranch className="mb-3 h-8 w-8 text-muted-foreground/40" />
						<p className="mb-4 text-sm text-muted-foreground">
							{tpd("noDiagram")}
						</p>
						<Button onClick={() => setShowEditor(true)}>
							<PlusIcon className="mr-2 h-4 w-4" />
							Crear Diagrama
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const toolbar = (
		<div className={`flex items-center justify-between border-b border-border bg-background px-3 py-1.5 ${fullscreen ? "" : ""}`}>
			<div className="flex items-center gap-0.5">
				{navigationStack && navigationStack.length > 0 && (
					<>
						<Button variant="ghost" size="sm" onClick={() => navigateUp(0)} className="h-7 text-xs">
							↑ Subir
						</Button>
						<div className="mx-1.5 h-4 w-px bg-border" />
					</>
				)}
			<Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} className="h-9 w-9 p-0 sm:h-7 sm:w-7">
				<Undo2Icon className="h-3.5 w-3.5" />
			</Button>
			<Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} className="h-9 w-9 p-0 sm:h-7 sm:w-7">
				<Redo2Icon className="h-3.5 w-3.5" />
			</Button>
			<div className="mx-1.5 h-4 w-px bg-border" />
			<Button variant="ghost" size="sm" onClick={zoomIn} className="h-9 w-9 p-0 sm:h-7 sm:w-7">
				<ZoomInIcon className="h-3.5 w-3.5" />
			</Button>
			<Button variant="ghost" size="sm" onClick={zoomOut} className="h-9 w-9 p-0 sm:h-7 sm:w-7">
				<ZoomOutIcon className="h-3.5 w-3.5" />
			</Button>
				<Button variant="ghost" size="sm" onClick={zoomFit} className="h-7 text-xs">
					<MaximizeIcon className="h-3.5 w-3.5 mr-1" />
					Ajustar
				</Button>
			</div>
			<div className="flex items-center gap-0.5">
				<Button onClick={handleSave} disabled={saving} size="sm" className="h-7 text-xs">
					<SaveIcon className="mr-1 h-3.5 w-3.5" />
					{saving ? "..." : tc("save")}
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)} className="h-9 w-9 p-0 sm:h-7 sm:w-7">
					{fullscreen ? <XIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
				</Button>
			</div>
		</div>
	);

	const canvas = (
		<div className="relative flex-1">
			<div
				ref={containerRef}
				className="bpmn-editor-canvas"
				style={{ height: "100%", width: "100%" }}
			/>

			{/* Health badges overlay */}
			{isReady && raciEntries && (
				<HealthBadgeOverlay
					getModeler={getModeler}
					isReady={isReady}
					raciEntries={raciEntries}
				/>
			)}

			{/* Evaluation feedback overlay — failure rates on steps */}
			{isReady && evalFeedback?.hasData && (
				<EvalFeedbackOverlay
					getModeler={getModeler}
					isReady={isReady}
					evalFeedback={evalFeedback}
				/>
			)}

			{/* Error/repair bar */}
			{(renderError || repairing) && (
				<div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border border-amber-300 bg-amber-100 px-4 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm">
					<div className="flex items-center gap-3">
						<span>{repairing ? "Reparando diagrama..." : renderError}</span>
						{!repairing && (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleRebuildFromNodes}
									className="rounded bg-yellow-200 px-2 py-0.5 text-[10px] font-medium text-amber-900 hover:bg-amber-300 dark:bg-amber-800/50 dark:text-amber-300 dark:hover:bg-amber-700/50 transition-colors"
								>
									Regenerar
								</button>
								<button
									type="button"
									onClick={handleRepairWithAi}
									className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
								>
									Arreglar con IA
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Loading state — skeleton diagram placeholder */}
			{!isReady && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
					<div className="flex items-center gap-4">
						<div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
						<div className="h-px w-8 animate-pulse bg-muted" />
						<div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
						<div className="h-px w-8 animate-pulse bg-muted" />
						<div className="h-10 w-20 animate-pulse rounded-lg bg-muted" />
					</div>
					<p className="text-xs text-muted-foreground animate-pulse">Cargando diagrama…</p>
				</div>
			)}
		</div>
	);

	if (fullscreen) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col bg-background">
				{toolbar}
				{canvas}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{toolbar}
			{canvas}
		</div>
	);
}
