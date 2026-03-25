"use client";

import { Fragment, useCallback, useEffect, useRef, type RefObject } from "react";
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
	SaveIcon,
	XIcon,
	FileTextIcon,
	PlusIcon,
} from "lucide-react";
import { NodePropertiesView } from "./NodePropertiesView";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-editor.css";

interface CentralCanvasProps {
	containerRef: RefObject<HTMLDivElement | null>;
}

export function CentralCanvas({ containerRef }: CentralCanvasProps) {
	const {
		modelerApi, diagramHealth, nodes, processId, sessionId,
		activeCentralTab, openPropertyTabs, setActiveCentralTab, closePropertyTab, openPropertyTab,
	} = useLiveSessionContext();
	const isDiagramActive = activeCentralTab === "diagram";
	const [repairing, setRepairing] = useState(false);

	// Rotating AI thinking phrases
	const AI_PHASES = [
		"Analizando tareas y conexiones",
		"Identificando roles y lanes",
		"Evaluando flujo del proceso",
		"Detectando faltantes",
		"Corrigiendo etiquetas",
		"Reorganizando nodos",
		"Optimizando layout",
		"Aplicando mejores prácticas BPMN",
	];
	const [thinkingPhase, setThinkingPhase] = useState(0);
	const phaseInterval = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (repairing) {
			setThinkingPhase(0);
			phaseInterval.current = setInterval(() => {
				setThinkingPhase((p) => (p + 1) % AI_PHASES.length);
			}, 2200);
		} else {
			if (phaseInterval.current) clearInterval(phaseInterval.current);
		}
		return () => { if (phaseInterval.current) clearInterval(phaseInterval.current); };
	}, [repairing]);

	/** Extract BPMN elements from the current canvas as DiagramNode-like objects */
	const extractCanvasNodes = useCallback(() => {
		const modeler = modelerApi?.getModeler();
		if (!modeler) return [];
		try {
			const elementRegistry = modeler.get("elementRegistry");
			const extracted: Array<{
				id: string; type: string; label: string; lane: string;
				connections: string[]; connectionLabels: string[];
			}> = [];
			const elements = elementRegistry.filter((e: any) =>
				e.type?.startsWith("bpmn:") &&
				e.type !== "bpmn:Participant" &&
				e.type !== "bpmn:Lane" &&
				e.type !== "bpmn:Collaboration" &&
				e.type !== "bpmn:Process" &&
				e.type !== "bpmn:SequenceFlow" &&
				!e.type.includes("Plane") &&
				!e.type.includes("Label"),
			);
			for (const el of elements) {
				const outgoing = (el.outgoing || [])
					.filter((c: any) => c.type === "bpmn:SequenceFlow" && c.target)
					.map((c: any) => ({ targetId: c.target.id, label: c.businessObject?.name || "" }));
				// Find lane
				let lane = "General";
				let parent = el.parent;
				while (parent) {
					if (parent.type === "bpmn:Lane") {
						lane = parent.businessObject?.name || "General";
						break;
					}
					parent = parent.parent;
				}
				// Convert bpmn:Type to snake_case for our system
				const rawType = el.type.replace("bpmn:", "");
				const snakeType = rawType.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
				extracted.push({
					id: el.id,
					type: snakeType,
					label: el.businessObject?.name || "",
					lane,
					connections: outgoing.map((o: any) => o.targetId),
					connectionLabels: outgoing.map((o: any) => o.label),
				});
			}
			// Filter out phantom elements: no label AND no connections AND not start/end events
			return extracted.filter((n) => {
				const isEvent = n.type.includes("start_event") || n.type.includes("end_event");
				const hasLabel = n.label && n.label.trim() !== "";
				const hasConnections = n.connections.length > 0;
				// Also check if any other node connects TO this one
				const hasIncoming = extracted.some((other) => other.connections.includes(n.id));
				return isEvent || hasLabel || hasConnections || hasIncoming;
			});
		} catch (err) {
			console.warn("[CentralCanvas] Canvas extraction failed:", err);
			return [];
		}
	}, [modelerApi]);

	const handleRebuildLayout = async () => {
		if (!modelerApi?.isReady || !sessionId) return;
		setRepairing(true);
		try {
			// Step 1: Extract current canvas elements and sync to DB
			const canvasNodes = extractCanvasNodes();
			if (canvasNodes.length > 0) {
				await fetch(`/api/sessions/${sessionId}/sync-canvas`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nodes: canvasNodes }),
				}).catch(() => {});
			}

			// Step 2: Call AI reorganize (now DB has the nodes)

			const res = await fetch(`/api/sessions/${sessionId}/reorganize`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			const data = await res.json().catch(() => ({}));
			console.log("[CentralCanvas] Reorganize response:", { ok: res.ok, status: res.status, nodeCount: data.nodes?.length, error: data.error });

			if (res.ok && data.nodes && data.nodes.length > 0) {
				await modelerApi.rebuildFromNodes(data.nodes);

				// Save rendered XML to session
				try {
					const modeler = modelerApi.getModeler();
					if (modeler) {
						const { xml } = await modeler.saveXML({ format: true });
						if (xml) {
							fetch(`/api/sessions/${sessionId}/diagram`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ bpmnXml: xml }),
							}).catch(() => {});
						}
					}
				} catch { /* non-critical */ }

				// Show brief completeness result
				const score = data.completeness?.score;
				if (score !== undefined) {
					const emoji = score >= 80 ? "🟢" : score >= 50 ? "🟡" : "🔴";
					toast.success(`${emoji} ${score}% completo`, { duration: 4000 });
				}
				if (data.gaps?.length > 0) {
					toast.info(`${data.gaps.length} preguntas nuevas`, { duration: 3000 });
				}
			} else {
				// Fallback: just rebuild layout from canvas nodes
				if (canvasNodes.length > 0) {
					toast.info("Reorganizando layout...");
					await modelerApi.rebuildFromNodes();
					toast.success("Diagrama reorganizado");
				} else {
					toast.error(data.error || "No se encontraron nodos para reorganizar");
				}
			}
		} catch (err) {
			console.error("[CentralCanvas] Rebuild failed:", err);
			toast.error("Error al reorganizar. Intenta de nuevo.");
		} finally {
			setRepairing(false);
		}
	};

	const handleSave = useCallback(async () => {
		if (!modelerApi?.isReady || !sessionId) return;
		try {
			const modeler = modelerApi.getModeler();
			if (!modeler) return;

			// Only save BPMN XML to session — do NOT sync to DB here
			// (syncing to DB triggers polling which creates duplicate nodes)
			const { xml } = await modeler.saveXML({ format: true });
			if (xml) {
				await fetch(`/api/sessions/${sessionId}/diagram`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bpmnXml: xml }),
				});
			}

			toast.success("Diagrama guardado", { duration: 2000 });
		} catch {
			toast.error("Error al guardar");
		}
	}, [modelerApi, sessionId]);

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

	const activePropertyTab = openPropertyTabs.find((t) => t.id === activeCentralTab);

	return (
		<div
			className="relative flex flex-col overflow-hidden"
			style={{ gridArea: "canvas" }}
		>
			{/* Tab bar — always visible */}
			<div className="flex h-8 shrink-0 items-center gap-0 border-b border-[#E2E8F0] bg-[#F8FAFC]">
				<button
					type="button"
					onClick={() => setActiveCentralTab("diagram")}
					className={`flex h-full items-center gap-1.5 border-r border-[#E2E8F0] px-3 text-xs font-medium transition-colors ${
						isDiagramActive
							? "bg-white text-[#0F172A]"
							: "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155]"
					}`}
				>
					<GridIcon className="h-3 w-3" />
					Diagrama
				</button>
				{openPropertyTabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveCentralTab(tab.id)}
						className={`group flex h-full items-center gap-1.5 border-r border-[#E2E8F0] px-3 text-xs font-medium transition-colors ${
							activeCentralTab === tab.id
								? "bg-white text-[#0F172A]"
								: "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155]"
						}`}
					>
						<FileTextIcon className="h-3 w-3" />
						<span className="max-w-[120px] truncate">{tab.label}</span>
						<span
							role="button"
							tabIndex={0}
							onClick={(e) => { e.stopPropagation(); closePropertyTab(tab.id); }}
							onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); closePropertyTab(tab.id); } }}
							className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-[#E2E8F0] group-hover:opacity-100"
						>
							<XIcon className="h-2.5 w-2.5" />
						</span>
					</button>
				))}
				{/* Open properties tab for root process */}
				<button
					type="button"
					onClick={() => openPropertyTab("Process_1", "Proceso")}
					title="Abrir propiedades del proceso"
					className="flex h-full items-center px-2 text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#334155]"
				>
					<PlusIcon className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Subprocess breadcrumb — visible when drilled into a subprocess */}
			{isDiagramActive && modelerApi?.navigationStack?.length > 0 && (
				<div className="flex h-6 shrink-0 items-center gap-1 border-b border-[#E2E8F0] bg-[#F1F5F9] px-4 text-[11px]">
					<button
						type="button"
						onClick={() => modelerApi.navigateUp(0)}
						className="text-[#3B82F6] hover:underline"
					>
						Proceso Principal
					</button>
					{modelerApi.navigationStack.map((item: { id: string; label: string }, idx: number) => (
						<Fragment key={item.id}>
							<span className="text-[#94A3B8]">›</span>
							{idx < modelerApi.navigationStack.length - 1 ? (
								<button
									type="button"
									onClick={() => modelerApi.navigateUp(idx + 1)}
									className="text-[#3B82F6] hover:underline"
								>
									{item.label}
								</button>
							) : (
								<span className="font-medium text-[#0F172A]">{item.label}</span>
							)}
						</Fragment>
					))}
				</div>
			)}

			{/* Diagram canvas — always mounted, hidden when property tab active */}
			<div
				className={`live-session bpmn-canvas-light relative flex-1 overflow-hidden ${isDiagramActive ? "" : "hidden"}`}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
			{/* AI thinking aura — full takeover of the canvas during reorganization */}
			{repairing && (
				<>
					<div className="ai-aura-border" />
					<div className="ai-aura-scrim" />
					<div className="ai-aura-center">
						<div className="ai-aura-ring" />
						<div className="ai-aura-ring ai-aura-ring-2" />
						<div className="ai-aura-pill">
							<div className="ai-aura-dot" />
							<span key={thinkingPhase} className="ai-aura-text">{AI_PHASES[thinkingPhase]}</span>
						</div>
					</div>
					<style>{`
						@keyframes auraSweep {
							0% { background-position: 0% 50%; }
							100% { background-position: 300% 50%; }
						}
						@keyframes auraFade {
							0%, 100% { opacity: 0.6; }
							50% { opacity: 1; }
						}
						@keyframes ringExpand {
							0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
							100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
						}
						@keyframes dotPulse {
							0%, 100% { transform: scale(1); box-shadow: 0 0 8px #60A5FA; }
							50% { transform: scale(1.3); box-shadow: 0 0 16px #3B82F6, 0 0 32px rgba(37, 99, 235, 0.3); }
						}
						@keyframes pillFloat {
							0%, 100% { transform: translateY(0); }
							50% { transform: translateY(-4px); }
						}
						.ai-aura-border {
							position: absolute; inset: 0; z-index: 30; pointer-events: none;
							border: 2px solid transparent;
							background:
								linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)) padding-box,
								linear-gradient(90deg, #2563EB, #0EA5E9, #7C3AED, #2563EB, #0EA5E9) border-box;
							background-size: 300% 100%;
							animation: auraSweep 2s linear infinite;
						}
						.ai-aura-scrim {
							position: absolute; inset: 0; z-index: 29; pointer-events: none;
							background: radial-gradient(ellipse at center, transparent 30%, rgba(37, 99, 235, 0.03) 70%);
						}
						.ai-aura-center {
							position: absolute; inset: 0; z-index: 31; pointer-events: none;
							display: flex; align-items: center; justify-content: center;
						}
						.ai-aura-ring {
							position: absolute; top: 50%; left: 50%;
							width: 120px; height: 120px; border-radius: 50%;
							border: 1.5px solid rgba(37, 99, 235, 0.2);
							transform: translate(-50%, -50%) scale(1);
							animation: ringExpand 2.5s ease-out infinite;
						}
						.ai-aura-ring-2 { animation-delay: 1.25s; }
						.ai-aura-pill {
							position: relative;
							display: flex; align-items: center; gap: 10px;
							padding: 10px 20px; border-radius: 100px;
							background: rgba(15, 23, 42, 0.92);
							backdrop-filter: blur(12px);
							color: #93C5FD; font-size: 13px; font-weight: 500;
							letter-spacing: 0.02em;
							box-shadow: 0 0 30px rgba(37, 99, 235, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15);
							animation: pillFloat 3s ease-in-out infinite, auraFade 2s ease-in-out infinite;
						}
						.ai-aura-dot {
							width: 8px; height: 8px; border-radius: 50%;
							background: #60A5FA; flex-shrink: 0;
							animation: dotPulse 1.5s ease-in-out infinite;
						}
						@keyframes textFadeIn {
							0% { opacity: 0; transform: translateY(6px); filter: blur(4px); }
							100% { opacity: 1; transform: translateY(0); filter: blur(0); }
						}
						.ai-aura-text {
							animation: textFadeIn 0.5s ease-out;
							white-space: nowrap;
						}
					`}</style>
				</>
			)}

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

			{/* Diagram health banner — hidden during AI repair */}
			{diagramHealth.needsRepair && !repairing && (
				<div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow-sm">
					<AlertTriangleIcon className="h-3.5 w-3.5" />
					{diagramHealth.warningCount} problemas
					<button
						type="button"
						onClick={handleRebuildLayout}
						disabled={repairing}
						className="flex items-center gap-1 rounded-lg bg-[#2563EB] px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
					>
						{repairing ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <WrenchIcon className="h-3 w-3" />}
						Reorganizar con IA
					</button>
				</div>
			)}

			{/* Floating tools — hidden during AI repair */}
			{modelerApi?.isReady && !repairing && (
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
						icon={<SaveIcon className="h-4 w-4" />}
						onClick={handleSave}
						title="Guardar diagrama"
					/>
					<div className="mx-1 h-5 w-px bg-[#334155]" />
					<ToolButton
						icon={<LayoutDashboardIcon className="h-4 w-4" />}
						onClick={handleRebuildLayout}
						disabled={repairing}
						title="Reorganizar diagrama"
					/>
				</div>
			)}
			</div>

			{/* Property view — shown when a property tab is active */}
			{activePropertyTab && (
				<div className="flex-1 overflow-auto bg-white">
					<NodePropertiesView
						tabId={activePropertyTab.id}
						elementId={activePropertyTab.elementId}
						label={activePropertyTab.label}
					/>
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
