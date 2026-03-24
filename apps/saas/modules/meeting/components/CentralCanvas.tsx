"use client";

import { useCallback, type RefObject } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import {
	Undo2Icon,
	Redo2Icon,
	MaximizeIcon,
	GridIcon,
	AlertTriangleIcon,
	WrenchIcon,
	Loader2Icon,
	LayoutDashboardIcon,
} from "lucide-react";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-editor.css";

interface CentralCanvasProps {
	containerRef: RefObject<HTMLDivElement | null>;
}

export function CentralCanvas({ containerRef }: CentralCanvasProps) {
	const { modelerApi, diagramHealth, nodes, processId, sessionId } = useLiveSessionContext();
	const [repairing, setRepairing] = useState(false);

	const handleRebuildLayout = async () => {
		if (!modelerApi?.isReady || nodes.length === 0) return;
		setRepairing(true);
		try {
			// Rebuild the diagram XML from current nodes with proper topological layout
			await modelerApi.rebuildFromNodes(nodes);
			toast.success("Diagrama reorganizado");
		} catch (err) {
			console.error("[CentralCanvas] Rebuild failed:", err);
			toast.error("Error al reorganizar");
		} finally {
			setRepairing(false);
		}
	};

	const handleRepairWithAi = async () => {
		if (!sessionId) return;
		setRepairing(true);
		try {
			// Send instruction to AI to fix connections and structure
			const res = await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: `[CORRECCIÓN BPMN] Revisa el diagrama completo. Los nodos actuales son: ${nodes.map(n => `"${n.label}" (${n.type}, lane: ${n.lane || "sin lane"})`).join(", ")}. Organiza las conexiones correctamente siguiendo el flujo lógico del proceso. Cada nodo debe conectar al siguiente paso lógico, NO todos al inicio y al final.`,
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("IA analizando estructura del diagrama...");
			// After AI processes, rebuild layout
			setTimeout(() => handleRebuildLayout(), 8000);
		} catch (err) {
			console.error("[CentralCanvas] AI repair failed:", err);
			toast.error("Error al reparar");
		} finally {
			setRepairing(false);
		}
	};

	const handleDragOver = useCallback((e: React.DragEvent) => {
		const type = e.dataTransfer.types.includes("application/bpmn-element");
		if (type) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const elementType = e.dataTransfer.getData("application/bpmn-element");
			if (!elementType || !modelerApi?.isReady) return;

			const modeler = modelerApi.getModeler();
			if (!modeler) return;

			const canvas = modeler.get("canvas");
			const modeling = modeler.get("modeling");
			const elementFactory = modeler.get("elementFactory");
			const elementRegistry = modeler.get("elementRegistry");

			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			const viewbox = canvas.viewbox();
			const x = (e.clientX - rect.left) / viewbox.scale + viewbox.x;
			const y = (e.clientY - rect.top) / viewbox.scale + viewbox.y;

			// In collaboration diagrams, shapes must be dropped onto a participant, not the root
			const rootElement = canvas.getRootElement();
			let parent = rootElement;
			if (rootElement?.businessObject?.$type === "bpmn:Collaboration") {
				const participants = elementRegistry.filter(
					(el: any) => el.type === "bpmn:Participant",
				);
				if (participants.length > 0) {
					// Pick the participant whose bounds contain the drop point, or the first one
					parent =
						participants.find(
							(p: any) =>
								x >= p.x &&
								x <= p.x + p.width &&
								y >= p.y &&
								y <= p.y + p.height,
						) ?? participants[0];
				}
			}
			if (!parent?.children) return;

			const shape = elementFactory.createShape({ type: elementType });
			modeling.createShape(shape, { x, y }, parent);
		},
		[modelerApi, containerRef],
	);

	return (
		<div
			className="live-session bpmn-canvas-light relative overflow-hidden"
			style={{ gridArea: "canvas" }}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{/* bpmn-js mounts here — matches ProcessDetailView pattern exactly */}
			<div
				ref={containerRef}
				className="bpmn-editor-canvas"
				style={{ width: "100%", height: "100%" }}
			/>

			{/* Loading state */}
			{!modelerApi?.isReady && (
				<div className="absolute inset-0 flex items-center justify-center bg-white">
					<div className="h-16 w-16 animate-pulse rounded-xl bg-gray-100" />
				</div>
			)}

			{/* Render error */}
			{modelerApi?.renderError && (
				<div className="absolute inset-0 flex items-center justify-center bg-white">
					<p className="text-sm text-red-600">{modelerApi.renderError}</p>
				</div>
			)}

			{/* Diagram health banner */}
			{diagramHealth.needsRepair && (
				<div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow-sm">
					<AlertTriangleIcon className="h-3.5 w-3.5" />
					{diagramHealth.warningCount} problemas
					<button
						type="button"
						onClick={handleRebuildLayout}
						disabled={repairing}
						className="flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
					>
						{repairing ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <WrenchIcon className="h-3 w-3" />}
						Reorganizar
					</button>
					<button
						type="button"
						onClick={handleRepairWithAi}
						disabled={repairing}
						className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
					>
						Reparar con IA
					</button>
				</div>
			)}

			{/* Floating tools */}
			{modelerApi?.isReady && (
				<div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-xl bg-[#0F172A]/90 p-1.5 shadow-lg backdrop-blur-sm">
					<ToolButton
						icon={<Undo2Icon className="h-4 w-4" />}
						onClick={() => modelerApi.undo()}
						disabled={!modelerApi.canUndo}
						title="Deshacer"
					/>
					<ToolButton
						icon={<Redo2Icon className="h-4 w-4" />}
						onClick={() => modelerApi.redo()}
						disabled={!modelerApi.canRedo}
						title="Rehacer"
					/>
					<div className="mx-1 h-5 w-px bg-[#334155]" />
					<ToolButton
						icon={<MaximizeIcon className="h-4 w-4" />}
						onClick={() => modelerApi.zoomFit()}
						title="Ajustar al viewport"
					/>
					<ToolButton
						icon={<GridIcon className="h-4 w-4" />}
						onClick={() => modelerApi.toggleGrid()}
						active={modelerApi.gridEnabled}
						title="Toggle grid"
					/>
					{nodes.length > 0 && (
						<>
							<div className="mx-1 h-5 w-px bg-[#334155]" />
							<ToolButton
								icon={<LayoutDashboardIcon className="h-4 w-4" />}
								onClick={handleRebuildLayout}
								disabled={repairing}
								title="Reorganizar diagrama"
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
}

function ToolButton({
	icon,
	onClick,
	disabled,
	active,
	title,
}: {
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	active?: boolean;
	title: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`rounded-lg p-2 text-[#94A3B8] transition-colors duration-75 hover:bg-[#334155] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${
				active ? "bg-[#334155] text-white" : ""
			}`}
		>
			{icon}
		</button>
	);
}
