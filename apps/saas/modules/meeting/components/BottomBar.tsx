"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
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
	LayoutDashboardIcon,
	MessageSquareIcon,
} from "lucide-react";

const TOOLS = [
	{ id: "select" as const, icon: MousePointerIcon, labelKey: "bottomBar.toolSelect" },
	{ id: "connect" as const, icon: ArrowRightLeftIcon, labelKey: "bottomBar.toolConnect" },
	{ id: "text" as const, icon: TypeIcon, labelKey: "bottomBar.toolText" },
] as const;

export function BottomBar() {
	const { selectedTool, setSelectedTool, nodes, modelerApi, sessionId, layoutMode, setLayoutMode } =
		useLiveSessionContext();
	const t = useTranslations("meeting");
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
						toast.success(t("toast.renamed", { name: warning.suggestion }));
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
						toast.success(t("toast.convertedGateway"));
					} else if (node) {
						await fetch(`/api/sessions/${sessionId}/nodes/${warning.nodeId}`, {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ action: "edit", type: "exclusiveGateway", label: `¿${node.label}?` }),
						});
						toast.success(t("toast.convertedGateway"));
					}
					break;
				}

				case "gateway_no_conditions": {
					// Gateway missing flow labels → rebuild diagram to fix
					toast.info(t("toast.reorganizingFlows"));
					if (modelerApi?.isReady) {
						await modelerApi.rebuildFromNodes(nodes);
						toast.success(t("toast.diagramReorganized"));
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
					toast.success(t("toast.mergeCreated"));
					break;
				}

				case "orphan":
			case "dead_end":
			case "missing_start":
			case "missing_end":
			case "cycle":
			case "missing_connection": {
				// Structural issues → rebuild fixes them
				// The builder auto-connects: orphans to chain, dead-ends to _end,
				// missing start/end added, cycles broken
				toast.info(t("toast.reorganizingBuilder"));
				if (modelerApi?.isReady) {
					await modelerApi.rebuildFromNodes(nodes);
					toast.success(t("toast.reorganizedReconnected"));
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
							toast.success(t("toast.laneUnified", { name: targetLane }));
						}
					}
					break;
				}

				default: {
					// Rebuild as fallback
					toast.info(t("toast.reorganizing"));
					if (modelerApi?.isReady) {
						await modelerApi.rebuildFromNodes(nodes);
						toast.success(t("toast.diagramReorganized"));
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
			toast.error(t("toast.fixError"));
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
				toast.error(t("toast.connectNotAvailable"));
				setSelectedTool("select");
				return;
			}
		}
	};

	const handleAudit = () => {
		if (nodes.length === 0) {
			toast.info(t("toast.noAuditNodes"));
			return;
		}
		const result = validateDiagram(nodes);
		setAuditResults(result);
		setShowAudit(true);

		if (result.warnings.length === 0) {
			toast.success(t("toast.auditScore", { score: result.bestPracticesScore }));
		} else {
			toast.info(t("toast.auditObservations", { count: result.warnings.length }));
		}
	};

	return (
		<>
			<div
				className="flex items-center justify-between border-t border-chrome-border bg-chrome-base px-4"
				style={{ gridArea: "bottom", height: 36, fontFamily: "'Geist Sans', system-ui, sans-serif" }}
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
										? "bg-primary text-white"
										: "text-chrome-text-muted hover:bg-chrome-raised hover:text-chrome-text-secondary"
								}`}
							>
								<Icon className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{t(tool.labelKey)}</span>
							</button>
						);
					})}

					<div className="mx-1 h-4 w-px bg-chrome-hover" />

					{/* Audit BPMN button */}
					<button
						type="button"
						onClick={handleAudit}
						className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors duration-75 ${
							showAudit
								? "bg-violet-600 text-white"
								: "text-chrome-text-muted hover:bg-chrome-raised hover:text-chrome-text-secondary"
						}`}
					>
						<ShieldCheckIcon className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">{t("bottomBar.auditBpmn")}</span>
					</button>

					<div className="mx-1 h-4 w-px bg-chrome-hover" />

					{/* Layout switcher */}
					<div className="flex items-center gap-0.5 rounded-lg bg-chrome-raised p-0.5">
						<button
							type="button"
							onClick={() => setLayoutMode("default")}
							className={`flex items-center rounded px-2 py-1 text-[10px] font-medium transition-colors duration-75 ${
								layoutMode === "default"
									? "bg-primary text-white"
									: "text-chrome-text-muted hover:text-chrome-text-secondary"
							}`}
							title={t("bottomBar.layoutDefault")}
						>
							<LayoutDashboardIcon className="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							onClick={() => setLayoutMode("chat-focus")}
							className={`flex items-center rounded px-2 py-1 text-[10px] font-medium transition-colors duration-75 ${
								layoutMode === "chat-focus"
									? "bg-primary text-white"
									: "text-chrome-text-muted hover:text-chrome-text-secondary"
							}`}
							title={t("bottomBar.layoutChatFocus")}
						>
							<MessageSquareIcon className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				{/* AI Element Counter */}
				<div className="flex items-center gap-2 text-[10px] text-chrome-text-muted">
					{auditResults && (
						<span className={`mr-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${
							auditResults.bestPracticesScore >= 80 ? "bg-green-500/10 text-green-400" :
							auditResults.bestPracticesScore >= 50 ? "bg-amber-500/10 text-amber-400" :
							"bg-red-500/10 text-red-400"
						}`}>
							BPMN {auditResults.bestPracticesScore}/100
						</span>
					)}
					<SparklesIcon className="h-3.5 w-3.5 text-primary" />
					<span className="tabular-nums">
						{t("bottomBar.aiElements")}: {confirmedCount}/{totalCount}
					</span>
				</div>
			</div>

			{/* Audit results panel (slides up from bottom bar) */}
			{showAudit && auditResults && (
				<div
					className={`fixed bottom-[36px] z-20 max-h-[300px] overflow-y-auto border-t border-chrome-border bg-chrome-base/95 backdrop-blur-sm ${
					layoutMode === "chat-focus" ? "left-[50%] right-0" : "left-[220px] right-[280px]"
				}`}
				>
					<div className="flex items-center justify-between border-b border-chrome-border px-4 py-2">
						<div className="flex items-center gap-2">
							<ShieldCheckIcon className="h-3.5 w-3.5 text-violet-600" />
							<span className="font-display text-sm text-chrome-text">
								{t("bottomBar.auditHeader")}
							</span>
							<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
								auditResults.bestPracticesScore >= 80 ? "bg-green-500/10 text-green-400" :
								auditResults.bestPracticesScore >= 50 ? "bg-amber-500/10 text-amber-400" :
								"bg-red-500/10 text-red-400"
							}`}>
								{auditResults.bestPracticesScore}/100
							</span>
							<span className="text-[10px] text-chrome-text-muted">
								{t("bottomBar.observations", { count: auditResults.warnings.length })}
							</span>
						</div>
						<button
							type="button"
							onClick={() => setShowAudit(false)}
							className="rounded-md p-1 text-chrome-text-muted hover:bg-chrome-raised hover:text-white"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{auditResults.warnings.length === 0 ? (
						<div className="flex items-center gap-2 p-4 text-xs text-green-400">
							<CheckCircleIcon className="h-4 w-4" />
							{t("bottomBar.diagramCorrect")}
						</div>
					) : (
						<div className="divide-y divide-chrome-border/50">
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
										<p className="text-[11px] text-chrome-text-secondary">{w.message}</p>
										{w.suggestion && (
											<p className="mt-0.5 text-[10px] text-violet-600">
												{t("bottomBar.suggestion")}: {w.suggestion}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={() => handleFixWithAi(w, i)}
										disabled={fixingIdx === i}
										className="flex flex-shrink-0 items-center gap-1 rounded-md bg-violet-600/10 px-2 py-1 text-[9px] font-medium text-violet-600 transition-colors hover:bg-violet-600/20 disabled:opacity-50"
									>
										{fixingIdx === i ? (
											<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
										) : (
											<WrenchIcon className="h-3.5 w-3.5" />
										)}
										{t("bottomBar.fix")}
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
