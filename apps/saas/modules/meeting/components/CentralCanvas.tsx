"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { useKeyboardShortcuts, type ShortcutDef } from "../hooks/useKeyboardShortcuts";
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
	ChevronLeftIcon,
	ChevronRightIcon,
	ListTreeIcon,
	SpellCheckIcon,
	SparklesIcon,
} from "lucide-react";
import { NodePropertiesView } from "./NodePropertiesView";
import { ProcessTreeEditor } from "./ProcessTreeEditor";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-editor.css";

interface CentralCanvasProps {
	containerRef: RefObject<HTMLDivElement | null>;
	leftCollapsed?: boolean;
	rightCollapsed?: boolean;
	onToggleLeft?: () => void;
	onToggleRight?: () => void;
}

export function CentralCanvas({ containerRef, leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }: CentralCanvasProps) {
	const {
		modelerApi, diagramHealth, nodes, processId, sessionId, firstPollDone,
		activeCentralTab, openPropertyTabs, setActiveCentralTab, closePropertyTab, openPropertyTab,
	} = useLiveSessionContext();
	const t = useTranslations("meeting");
	const isDiagramActive = activeCentralTab === "diagram";
	const isTreeActive = activeCentralTab === "tree";
	const [repairing, setRepairing] = useState(false);

	// Rotating AI thinking phrases
	const AI_PHASES = [
		t("canvas.aiPhase1"),
		t("canvas.aiPhase2"),
		t("canvas.aiPhase3"),
		t("canvas.aiPhase4"),
		t("canvas.aiPhase5"),
		t("canvas.aiPhase6"),
		t("canvas.aiPhase7"),
		t("canvas.aiPhase8"),
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

		// Save backup XML before destructive operations
		let backupXml: string | null = null;
		try {
			const modeler = modelerApi.getModeler();
			if (modeler) {
				const result = await modeler.saveXML({ format: true });
				backupXml = result.xml || null;
			}
		} catch { /* ok */ }

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
				body: JSON.stringify({ mode: "full" }),
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
					toast.success(`${emoji} ${t("toast.complete", { score })}`, { duration: 4000 });
				}
				if (data.gaps?.length > 0) {
					toast.info(t("toast.newQuestions", { count: data.gaps.length }), { duration: 3000 });
				}
			} else {
				// Fallback: just rebuild layout from canvas nodes
				if (canvasNodes.length > 0) {
					toast.info(t("canvas.reorganizingLayout"));
					await modelerApi.rebuildFromNodes();
					toast.success(t("toast.diagramReorganized"));
				} else {
					toast.error(data.error || t("toast.noNodesFound"));
				}
			}
		} catch (err) {
			console.error("[CentralCanvas] Rebuild failed:", err);
			// Restore backup if diagram was destroyed
			if (backupXml) {
				try {
					const modeler = modelerApi.getModeler();
					if (modeler) {
						await modeler.importXML(backupXml);
						modeler.get("canvas").zoom("fit-viewport", "auto");
						toast.error(t("toast.reorganizeErrorRestored"));
					}
				} catch {
					toast.error(t("toast.reorganizeErrorRetry"));
				}
			} else {
				toast.error(t("toast.reorganizeErrorRetry"));
			}
		} finally {
			setRepairing(false);
		}
	};

	const handleSave = useCallback(async () => {
		if (!modelerApi?.isReady || !sessionId) return;
		try {
			const modeler = modelerApi.getModeler();
			if (!modeler) return;

			// Sync canvas elements to DB (upsert = no duplicates)
			const canvasNodes = extractCanvasNodes();
			console.group("[BPMN-DEBUG] handleSave");
			console.log("canvas nodes:", canvasNodes.length);
			console.log("IDs:", canvasNodes.map(n => `${n.id.slice(0,8)}:${n.label}:${n.lane}`));
			console.groupEnd();
			if (canvasNodes.length > 0) {
				await fetch(`/api/sessions/${sessionId}/sync-canvas`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nodes: canvasNodes }),
				});
			}

			// Save BPMN XML to session
			const { xml } = await modeler.saveXML({ format: true });
			if (xml) {
				await fetch(`/api/sessions/${sessionId}/diagram`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bpmnXml: xml }),
				});
			}

			toast.success(t("toast.diagramSaved"), { duration: 2000 });
		} catch {
			toast.error(t("toast.saveError"));
		}
	}, [modelerApi, sessionId, extractCanvasNodes]);

	// Shared persist function — used by handleSave, 30s interval, and debounced change listener
	const lastXmlRef = useRef<string | null>(null);
	const persistDiagram = useCallback(async () => {
		const modeler = modelerApi?.getModeler();
		if (!modeler || !sessionId) return;
		try {
			const canvasNodes = extractCanvasNodes();
			if (canvasNodes.length > 0) {
				fetch(`/api/sessions/${sessionId}/sync-canvas`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nodes: canvasNodes }),
				}).catch(() => {});
			}
			const { xml } = await modeler.saveXML({ format: true });
			if (xml) {
				lastXmlRef.current = xml;
				fetch(`/api/sessions/${sessionId}/diagram`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bpmnXml: xml }),
				}).catch(() => {});
			}
		} catch { /* non-critical */ }
	}, [modelerApi, sessionId, extractCanvasNodes]);

	/** ELK-only re-layout: rearrange positions without AI */
	const [relaying, setRelaying] = useState(false);
	const handleRelayoutOnly = useCallback(async () => {
		if (!modelerApi?.isReady || !sessionId) return;
		setRelaying(true);
		try {
			await modelerApi.relayout();
			// Save the new layout
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
			toast.success(t("toast.relayoutDone"), { duration: 2000 });
		} catch {
			toast.error(t("toast.relayoutError"));
		} finally {
			setRelaying(false);
		}
	}, [modelerApi, sessionId]);

	/** AI labels-only: fix spelling/grammar/types without structural changes */
	const [fixingLabels, setFixingLabels] = useState(false);
	const handleFixLabelsOnly = useCallback(async () => {
		if (!modelerApi?.isReady || !sessionId) return;
		setFixingLabels(true);
		try {
			// Sync canvas first
			const canvasNodes = extractCanvasNodes();
			if (canvasNodes.length > 0) {
				await fetch(`/api/sessions/${sessionId}/sync-canvas`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nodes: canvasNodes }),
				}).catch(() => {});
			}

			const res = await fetch(`/api/sessions/${sessionId}/reorganize`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ mode: "labels_only" }),
			});
			const data = await res.json().catch(() => ({}));

			if (res.ok && data.fixes?.length > 0) {
				// Apply label/type fixes directly on canvas without rebuild
				const modeler = modelerApi.getModeler();
				if (modeler) {
					const modeling = modeler.get("modeling");
					const elementRegistry = modeler.get("elementRegistry");
					for (const fix of data.fixes) {
						const el = elementRegistry.get(fix.id);
						if (!el) continue;
						if (fix.label) {
							try { modeling.updateLabel(el, fix.label); } catch { /* */ }
						}
					}
				}
				toast.success(t("toast.labelsFixed", { count: data.applied || data.fixes.length }), { duration: 3000 });
			} else if (res.ok) {
				toast.info(t("toast.allLabelsCorrect"), { duration: 2000 });
			} else {
				toast.error(data.error || t("toast.fixLabelsError"));
			}
		} catch {
			toast.error(t("toast.fixLabelsError"));
		} finally {
			setFixingLabels(false);
		}
	}, [modelerApi, sessionId, extractCanvasNodes]);

	// Auto-save BPMN XML + sync canvas nodes every 30s (fallback)
	useEffect(() => {
		if (!modelerApi?.isReady || !sessionId) return;
		const interval = setInterval(() => { persistDiagram(); }, 30000);
		return () => clearInterval(interval);
	}, [modelerApi?.isReady, sessionId, persistDiagram]);

	// Debounced auto-save on diagram changes (3s after last change)
	useEffect(() => {
		if (!modelerApi?.isReady || !sessionId) return;
		const modeler = modelerApi.getModeler();
		if (!modeler) return;

		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		const eventBus = modeler.get("eventBus");

		const debouncedSave = () => {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => { persistDiagram(); }, 3000);
		};

		eventBus.on("commandStack.changed", debouncedSave);
		return () => {
			eventBus.off("commandStack.changed", debouncedSave);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [modelerApi?.isReady, sessionId, persistDiagram]);

	// sendBeacon on beforeunload — last-chance save of cached BPMN XML
	useEffect(() => {
		if (!sessionId) return;
		const handler = () => {
			if (lastXmlRef.current) {
				const blob = new Blob(
					[JSON.stringify({ bpmnXml: lastXmlRef.current })],
					{ type: "application/json" },
				);
				navigator.sendBeacon(`/api/sessions/${sessionId}/diagram`, blob);
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [sessionId]);

	// Keyboard shortcuts for diagram actions
	const canvasShortcuts = useMemo<ShortcutDef[]>(() => [
		{ key: "s", ctrl: true, handler: () => handleSave(), description: t("canvas.shortcutSave") },
		{ key: "0", ctrl: true, handler: () => modelerApi?.zoomFit(), description: t("canvas.shortcutFit") },
		{ key: "l", ctrl: true, shift: true, handler: () => handleRelayoutOnly(), description: t("canvas.shortcutRelayout") },
		{ key: "f", ctrl: true, shift: true, handler: () => handleFixLabelsOnly(), description: t("canvas.shortcutFixLabels") },
		{ key: "r", ctrl: true, shift: true, handler: () => handleRebuildLayout(), description: t("canvas.shortcutFullReorganize") },
	], [handleSave, handleRelayoutOnly, handleFixLabelsOnly, handleRebuildLayout, modelerApi]);
	useKeyboardShortcuts(canvasShortcuts);

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
			style={{ gridArea: "canvas", boxShadow: "inset 4px 0 8px -4px rgba(28, 25, 23, 0.15), inset -4px 0 8px -4px rgba(28, 25, 23, 0.15)" }}
		>
			{/* Tab bar — always visible */}
			<div className="flex h-8 shrink-0 items-center gap-0 border-b border-canvas-border bg-secondary">
				<button
					type="button"
					onClick={() => setActiveCentralTab("diagram")}
					className={`flex h-full items-center gap-1.5 border-r border-canvas-border px-3 text-xs font-medium transition-colors ${
						isDiagramActive
							? "bg-background text-canvas-text"
							: "text-chrome-text-muted hover:bg-canvas-surface hover:text-canvas-text-secondary"
					}`}
				>
					<GridIcon className="h-3.5 w-3.5" />
					{t("canvas.tabDiagram")}
				</button>
				<button
					type="button"
					onClick={() => setActiveCentralTab("tree")}
					className={`flex h-full items-center gap-1.5 border-r border-canvas-border px-3 text-xs font-medium transition-colors ${
						isTreeActive
							? "bg-background text-canvas-text"
							: "text-chrome-text-muted hover:bg-canvas-surface hover:text-canvas-text-secondary"
					}`}
				>
					<ListTreeIcon className="h-3.5 w-3.5" />
					{t("canvas.tabTree")}
				</button>
				{openPropertyTabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveCentralTab(tab.id)}
						className={`group flex h-full items-center gap-1.5 border-r border-canvas-border px-3 text-xs font-medium transition-colors ${
							activeCentralTab === tab.id
								? "bg-background text-canvas-text"
								: "text-chrome-text-muted hover:bg-canvas-surface hover:text-canvas-text-secondary"
						}`}
					>
						<FileTextIcon className="h-3.5 w-3.5" />
						<span className="max-w-[120px] truncate">{tab.label}</span>
						<span
							role="button"
							tabIndex={0}
							onClick={(e) => { e.stopPropagation(); closePropertyTab(tab.id); }}
							onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); closePropertyTab(tab.id); } }}
							className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-canvas-border group-hover:opacity-100"
						>
							<XIcon className="h-3.5 w-3.5" />
						</span>
					</button>
				))}
				{/* Open properties tab for root process */}
				<button
					type="button"
					onClick={() => openPropertyTab("Process_1", t("canvas.processDefault"))}
					title={t("canvas.openProcessProps")}
					className="flex h-full items-center px-2 text-chrome-text-secondary transition-colors hover:bg-canvas-surface hover:text-canvas-text-secondary"
				>
					<PlusIcon className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Subprocess breadcrumb — visible when drilled into a subprocess */}
			{isDiagramActive && modelerApi?.navigationStack?.length > 0 && (
				<div className="flex h-6 shrink-0 items-center gap-1 border-b border-canvas-border bg-canvas-surface px-4 text-[11px]">
					<button
						type="button"
						onClick={() => modelerApi.navigateUp(0)}
						className="text-primary hover:underline"
					>
						{t("canvas.breadcrumbRoot")}
					</button>
					{modelerApi.navigationStack.map((item: { id: string; label: string }, idx: number) => (
						<Fragment key={item.id}>
							<span className="text-chrome-text-secondary">›</span>
							{idx < modelerApi.navigationStack.length - 1 ? (
								<button
									type="button"
									onClick={() => modelerApi.navigateUp(idx + 1)}
									className="text-primary hover:underline"
								>
									{item.label}
								</button>
							) : (
								<span className="font-medium text-canvas-text">{item.label}</span>
							)}
						</Fragment>
					))}
				</div>
			)}

			{/* Diagram canvas — always mounted, hidden when property tab active */}
			<div
				data-canvas=""
				className={`live-session bpmn-canvas-light relative flex-1 overflow-hidden ${isDiagramActive ? "" : "hidden"}`}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
			{/* Loading overlay — hides default empty diagram until first poll loads nodes */}
			{isDiagramActive && nodes.length === 0 && !firstPollDone && (
				<div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas-surface">
					<Loader2Icon className="h-6 w-6 animate-spin text-primary" />
				</div>
			)}
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
							border: 2px solid rgba(37, 99, 235, 0.3);
							border-image: linear-gradient(90deg, #00E5C0, #0EA5E9, #7C3AED, #00E5C0, #0EA5E9) 1;
							animation: auraSweep 2s linear infinite;
							background: transparent;
						}
						.ai-aura-scrim {
							position: absolute; inset: 0; z-index: 29; pointer-events: none;
							backdrop-filter: blur(2px);
							background: rgba(248, 250, 252, 0.5);
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

			{/* Lightweight AI indicator for labels-only fix */}
			{fixingLabels && (
				<div className="absolute bottom-16 left-1/2 z-30 -translate-x-1/2" style={{ pointerEvents: "none" }}>
					<div className="ai-aura-pill">
						<div className="ai-aura-dot" />
						<span className="ai-aura-text">{t("canvas.fixingLabels")}</span>
					</div>
					<style>{`
						@keyframes dotPulse {
							0%, 100% { transform: scale(1); box-shadow: 0 0 8px #60A5FA; }
							50% { transform: scale(1.3); box-shadow: 0 0 16px #3B82F6, 0 0 32px rgba(37, 99, 235, 0.3); }
						}
						@keyframes pillFloat {
							0%, 100% { transform: translateY(0); }
							50% { transform: translateY(-4px); }
						}
						@keyframes auraFade {
							0%, 100% { opacity: 0.6; }
							50% { opacity: 1; }
						}
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
						.ai-aura-text {
							white-space: nowrap;
						}
					`}</style>
				</div>
			)}

			{/* bpmn-js mounts here — matches ProcessDetailView pattern exactly */}
			<div
				ref={containerRef}
				className="bpmn-editor-canvas"
				style={{ width: "100%", height: "100%" }}
			/>

			{/* Loading state */}
			{!modelerApi?.isReady && (
				<div className="absolute inset-0 flex items-center justify-center bg-canvas-surface">
					<div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
				</div>
			)}

			{/* Render error */}
			{modelerApi?.renderError && (
				<div className="absolute inset-0 flex items-center justify-center bg-canvas-surface">
					<p className="text-sm text-red-600">{modelerApi.renderError}</p>
				</div>
			)}

			{/* Diagram health banner removed — was not dismissible and blocked UI */}

			{/* Floating toolbar — hidden during full AI repair */}
			{modelerApi?.isReady && !repairing && !fixingLabels && (
				<div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-xl bg-chrome-base/90 p-1.5 shadow-lg backdrop-blur-sm">
					<ToolButton icon={<Undo2Icon className="h-4 w-4" />} onClick={() => modelerApi.undo()} disabled={!modelerApi.canUndo} label={t("canvas.toolUndo")} shortcut="⌘Z" />
					<ToolButton icon={<Redo2Icon className="h-4 w-4" />} onClick={() => modelerApi.redo()} disabled={!modelerApi.canRedo} label={t("canvas.toolRedo")} shortcut="⌘⇧Z" />
					<div className="mx-1 h-5 w-px bg-chrome-hover" />
					<ToolButton icon={<MaximizeIcon className="h-4 w-4" />} onClick={() => modelerApi.zoomFit()} label={t("canvas.toolFit")} shortcut="⌘0" />
					<ToolButton icon={<SaveIcon className="h-4 w-4" />} onClick={handleSave} label={t("canvas.toolSave")} shortcut="⌘S" />
					<div className="mx-1 h-5 w-px bg-chrome-hover" />
					<ToolButton icon={<LayoutDashboardIcon className="h-4 w-4" />} onClick={handleRelayoutOnly} disabled={relaying} label={t("canvas.toolSort")} shortcut="⌘⇧L" />
					<ToolButton icon={<SpellCheckIcon className="h-4 w-4" />} onClick={handleFixLabelsOnly} label={t("canvas.toolSpelling")} shortcut="⌘⇧F" />
					<ToolButton icon={<SparklesIcon className="h-4 w-4" />} onClick={handleRebuildLayout} label={t("canvas.toolAiFull")} shortcut="⌘⇧R" />
				</div>
			)}
			</div>

			{/* Tree view — shown when tree tab is active */}
			{isTreeActive && (
				<div className="flex-1 overflow-hidden">
					<ProcessTreeEditor />
				</div>
			)}

			{/* Property view — shown when a property tab is active */}
			{activePropertyTab && (
				<div className="flex-1 overflow-auto bg-background">
					<NodePropertiesView
						tabId={activePropertyTab.id}
						elementId={activePropertyTab.elementId}
						label={activePropertyTab.label}
					/>
				</div>
			)}

			{/* Edge tabs (cejas) for collapsing panels — only on diagram view */}
			{onToggleLeft && isDiagramActive && (
				<button
					type="button"
					onClick={onToggleLeft}
					className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-md border border-chrome-border bg-chrome-base px-0.5 py-3 text-chrome-text-muted transition-colors hover:bg-chrome-raised hover:text-chrome-text-secondary"
					title={leftCollapsed ? t("canvas.toggleShowElements") : t("canvas.toggleHideElements")}
				>
					{leftCollapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
				</button>
			)}
			{onToggleRight && isDiagramActive && (
				<button
					type="button"
					onClick={onToggleRight}
					className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-md border border-chrome-border bg-chrome-base px-0.5 py-3 text-chrome-text-muted transition-colors hover:bg-chrome-raised hover:text-chrome-text-secondary"
					title={rightCollapsed ? t("canvas.toggleShowPanels") : t("canvas.toggleHidePanels")}
				>
					{rightCollapsed ? <ChevronLeftIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
				</button>
			)}
		</div>
	);
}

function ToolButton({
	icon,
	onClick,
	disabled,
	active,
	label,
	shortcut,
}: {
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	active?: boolean;
	label: string;
	shortcut?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={shortcut ? `${label} (${shortcut})` : label}
			className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-chrome-text-secondary transition-colors duration-75 hover:bg-chrome-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${
				active ? "bg-chrome-hover text-white" : ""
			}`}
		>
			{icon}
			<span className="text-[11px] leading-none">{label}</span>
			{shortcut && <span className="text-[10px] leading-none text-chrome-subtle">{shortcut}</span>}
		</button>
	);
}
