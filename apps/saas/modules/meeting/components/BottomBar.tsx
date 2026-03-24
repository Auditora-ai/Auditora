"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { validateDiagram, type DiagramWarning } from "../lib/bpmn-validator";
import {
	MousePointerIcon,
	ArrowRightLeftIcon,
	TypeIcon,
	ShieldCheckIcon,
	SparklesIcon,
	XIcon,
	AlertTriangleIcon,
	InfoIcon,
	CheckCircleIcon,
	WrenchIcon,
	Loader2Icon,
} from "lucide-react";

const TOOLS = [
	{ id: "select" as const, icon: MousePointerIcon, label: "Select" },
	{ id: "connect" as const, icon: ArrowRightLeftIcon, label: "Connect" },
	{ id: "text" as const, icon: TypeIcon, label: "Text" },
];

export function BottomBar() {
	const { selectedTool, setSelectedTool, nodes, modelerApi, sessionId } =
		useLiveSessionContext();
	const [auditResults, setAuditResults] = useState<ReturnType<typeof validateDiagram> | null>(null);
	const [showAudit, setShowAudit] = useState(false);
	const [fixingIdx, setFixingIdx] = useState<number | null>(null);

	const handleFixWithAi = useCallback(async (warning: DiagramWarning, idx: number) => {
		if (!sessionId) return;
		setFixingIdx(idx);
		try {
			const node = nodes.find((n) => n.id === warning.nodeId);

			switch (warning.type) {
				case "naming":
				case "gateway_label": {
					// Direct label fix
					if (warning.suggestion) {
						await fetch(`/api/sessions/${sessionId}/nodes/${warning.nodeId}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "edit", label: warning.suggestion }),
						});
						toast.success(`Renombrado a "${warning.suggestion}"`);
					}
					break;
				}

				case "task_as_decision": {
					if (node && node.connections.length > 1 && !node.type.toLowerCase().includes("gateway")) {
						// Task with multiple outputs → convert to gateway
						await fetch(`/api/sessions/${sessionId}/nodes/${warning.nodeId}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "edit", type: "exclusiveGateway", label: `¿${node.label}?` }),
						});
						toast.success(`Convertido a gateway: "¿${node.label}?"`);
					} else if (node) {
						await fetch(`/api/sessions/${sessionId}/nodes/${warning.nodeId}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "edit", type: "exclusiveGateway", label: `¿${node.label}?` }),
						});
						toast.success("Convertido a gateway");
					}
					break;
				}

				case "gateway_no_conditions": {
					// Gateway missing flow labels → rebuild diagram to fix
					toast.info("Reorganizando diagrama para corregir flujos...");
					if (modelerApi?.isReady) {
						await modelerApi.rebuildFromNodes(nodes);
						toast.success("Diagrama reorganizado");
					}
					break;
				}

				case "gateway_no_merge": {
					// Missing merge gateway → create one via bulk API
					await fetch(`/api/sessions/${sessionId}/nodes/bulk`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							nodes: [{
								type: "exclusiveGateway",
								label: `Reunion: ${node?.label || "merge"}`,
								lane: node?.lane || null,
							}],
						}),
					});
					toast.success("Gateway de reunion creado");
					break;
				}

				case "orphan":
				case "dead_end":
				case "missing_start":
				case "missing_end":
				case "cycle":
				case "missing_connection": {
					// Structural issues → rebuild fixes them automatically
					toast.info("Reorganizando diagrama...");
					if (modelerApi?.isReady) {
						await modelerApi.rebuildFromNodes(nodes);
						toast.success("Diagrama reorganizado");
					}
					break;
				}

				case "lane_inconsistency": {
					// Fix lane name to match the primary variant
					if (warning.suggestion && node) {
						// Find the primary lane name (the one used most)
						const targetLane = warning.message.match(/similar a "([^"]+)"/)?.[1];
						if (targetLane) {
							await fetch(`/api/sessions/${sessionId}/nodes/${warning.nodeId}`, {
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ action: "edit", lane: targetLane }),
							});
							toast.success(`Lane unificado a "${targetLane}"`);
						}
					}
					break;
				}

				default: {
					// Rebuild as fallback
					toast.info("Reorganizando diagrama...");
					if (modelerApi?.isReady) {
						await modelerApi.rebuildFromNodes(nodes);
						toast.success("Diagrama reorganizado");
					}
					break;
				}
			}

			// Remove fixed warning
			if (auditResults) {
				const updated = auditResults.warnings.filter((_, i) => i !== idx);
				setAuditResults({ ...auditResults, warnings: updated, bestPracticesScore: Math.min(100, auditResults.bestPracticesScore + 5) });
			}
		} catch {
			toast.error("Error al aplicar corrección");
		} finally {
			setFixingIdx(null);
		}
	}, [sessionId, auditResults, nodes, modelerApi]);

	const confirmedCount = nodes.filter((n) => n.state === "confirmed").length;
	const totalCount = nodes.length;

	const handleToolSelect = (toolId: typeof selectedTool) => {
		setSelectedTool(toolId);

		if (!modelerApi?.isReady) return;
		const modeler = modelerApi.getModeler();
		if (!modeler) return;

		if (toolId === "connect") {
			try {
				modeler.get("globalConnect").toggle();
			} catch {
				toast.error("Herramienta Connect no disponible");
				setSelectedTool("select");
				return;
			}
		}
	};

	const handleAudit = () => {
		if (nodes.length === 0) {
			toast.info("No hay nodos para auditar");
			return;
		}
		const result = validateDiagram(nodes);
		setAuditResults(result);
		setShowAudit(true);

		if (result.warnings.length === 0) {
			toast.success(`Diagrama BPMN correcto — Score: ${result.bestPracticesScore}/100`);
		} else {
			toast.info(`${result.warnings.length} observaciones encontradas`);
		}
	};

	return (
		<>
			<div
				className="flex items-center justify-between border-t border-[#334155] bg-[#0F172A] px-4"
				style={{ gridArea: "bottom", height: 36, fontFamily: "Inter, system-ui, sans-serif" }}
			>
				{/* Tools */}
				<div className="flex items-center gap-1">
					{TOOLS.map((tool) => {
						const Icon = tool.icon;
						const active = selectedTool === tool.id;
						return (
							<button
								key={tool.id}
								type="button"
								onClick={() => handleToolSelect(tool.id)}
								className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors duration-75 ${
									active
										? "bg-[#2563EB] text-white"
										: "text-[#64748B] hover:bg-[#1E293B] hover:text-[#94A3B8]"
								}`}
							>
								<Icon className="h-3 w-3" />
								<span className="hidden sm:inline">{tool.label}</span>
							</button>
						);
					})}

					<div className="mx-1 h-4 w-px bg-[#334155]" />

					{/* Audit BPMN button */}
					<button
						type="button"
						onClick={handleAudit}
						className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors duration-75 ${
							showAudit
								? "bg-[#7C3AED] text-white"
								: "text-[#64748B] hover:bg-[#1E293B] hover:text-[#94A3B8]"
						}`}
					>
						<ShieldCheckIcon className="h-3 w-3" />
						<span className="hidden sm:inline">Auditar BPMN</span>
					</button>
				</div>

				{/* AI Element Counter */}
				<div className="flex items-center gap-2 text-[10px] text-[#64748B]">
					{auditResults && (
						<span className={`mr-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${
							auditResults.bestPracticesScore >= 80 ? "bg-green-500/10 text-green-400" :
							auditResults.bestPracticesScore >= 50 ? "bg-amber-500/10 text-amber-400" :
							"bg-red-500/10 text-red-400"
						}`}>
							BPMN {auditResults.bestPracticesScore}/100
						</span>
					)}
					<SparklesIcon className="h-3 w-3 text-[#2563EB]" />
					<span className="tabular-nums">
						Elementos IA: {confirmedCount}/{totalCount}
					</span>
				</div>
			</div>

			{/* Audit results panel (slides up from bottom bar) */}
			{showAudit && auditResults && (
				<div
					className="fixed bottom-[36px] left-[220px] right-[280px] z-20 max-h-[300px] overflow-y-auto border-t border-[#334155] bg-[#0F172A]/95 backdrop-blur-sm"
				>
					<div className="flex items-center justify-between border-b border-[#334155] px-4 py-2">
						<div className="flex items-center gap-2">
							<ShieldCheckIcon className="h-3.5 w-3.5 text-[#7C3AED]" />
							<span className="text-xs font-medium text-[#F1F5F9]">
								Auditoria BPMN
							</span>
							<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
								auditResults.bestPracticesScore >= 80 ? "bg-green-500/10 text-green-400" :
								auditResults.bestPracticesScore >= 50 ? "bg-amber-500/10 text-amber-400" :
								"bg-red-500/10 text-red-400"
							}`}>
								{auditResults.bestPracticesScore}/100
							</span>
							<span className="text-[10px] text-[#64748B]">
								{auditResults.warnings.length} observaciones
							</span>
						</div>
						<button
							type="button"
							onClick={() => setShowAudit(false)}
							className="rounded-md p-1 text-[#64748B] hover:bg-[#1E293B] hover:text-white"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{auditResults.warnings.length === 0 ? (
						<div className="flex items-center gap-2 p-4 text-xs text-green-400">
							<CheckCircleIcon className="h-4 w-4" />
							El diagrama cumple con las buenas practicas de BPMN 2.0
						</div>
					) : (
						<div className="divide-y divide-[#334155]/50">
							{auditResults.warnings.map((w, i) => (
								<div key={i} className="flex items-start gap-2.5 px-4 py-2">
									{w.severity === "error" ? (
										<AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
									) : w.severity === "warning" ? (
										<AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
									) : (
										<InfoIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
									)}
									<div className="flex-1">
										<p className="text-[11px] text-[#E2E8F0]">{w.message}</p>
										{w.suggestion && (
											<p className="mt-0.5 text-[10px] text-[#7C3AED]">
												Sugerencia: {w.suggestion}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={() => handleFixWithAi(w, i)}
										disabled={fixingIdx === i}
										className="flex flex-shrink-0 items-center gap-1 rounded-md bg-[#7C3AED]/10 px-2 py-1 text-[9px] font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/20 disabled:opacity-50"
									>
										{fixingIdx === i ? (
											<Loader2Icon className="h-3 w-3 animate-spin" />
										) : (
											<WrenchIcon className="h-3 w-3" />
										)}
										Corregir
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</>
	);
}
