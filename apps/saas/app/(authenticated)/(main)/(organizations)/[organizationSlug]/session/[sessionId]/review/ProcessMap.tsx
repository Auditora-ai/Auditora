import { ReportSection } from "./ReportSection";

/**
 * Visual Process Map by Lanes
 *
 * Renders extracted process as a simplified visual flow:
 * - Grouped by lane/role (horizontal swimlanes)
 * - Nodes color-coded by type
 * - Sequential layout within each lane (sorted by formedAt)
 * - Anchor links to Activity Detail Cards
 */

interface ProcessNode {
	id: string;
	label: string;
	nodeType: string;
	lane: string | null;
	state: string;
	confidence: number | null;
}

interface ProcessMapProps {
	nodes: ProcessNode[];
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
	START_EVENT: { bg: "bg-green-100", border: "border-green-400", text: "text-green-800" },
	END_EVENT: { bg: "bg-red-100", border: "border-red-400", text: "text-red-800" },
	TASK: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
	USER_TASK: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
	USERTASK: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
	EXCLUSIVE_GATEWAY: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800" },
	PARALLEL_GATEWAY: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800" },
	INCLUSIVE_GATEWAY: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800" },
	INTERMEDIATE_EVENT: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-800" },
	SUB_PROCESS: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-800" },
};

const DEFAULT_COLOR = { bg: "bg-stone-50", border: "border-stone-300", text: "text-stone-800" };

function getNodeColor(nodeType: string) {
	return NODE_COLORS[nodeType] || NODE_COLORS[nodeType.toUpperCase()] || DEFAULT_COLOR;
}

function nodeTypeLabel(nodeType: string): string {
	const labels: Record<string, string> = {
		START_EVENT: "Inicio",
		END_EVENT: "Fin",
		TASK: "Tarea",
		USER_TASK: "Tarea",
		USERTASK: "Tarea",
		EXCLUSIVE_GATEWAY: "Decision",
		PARALLEL_GATEWAY: "Paralelo",
		INCLUSIVE_GATEWAY: "Inclusivo",
		INTERMEDIATE_EVENT: "Evento",
		SUB_PROCESS: "Subproceso",
	};
	return labels[nodeType] || labels[nodeType.toUpperCase()] || nodeType.replace(/_/g, " ").toLowerCase();
}

export function ProcessMap({ nodes }: ProcessMapProps) {
	if (nodes.length === 0) {
		return (
			<ReportSection title="Mapa del Proceso">
				<p className="text-sm text-stone-400">No se extrajeron actividades en esta sesion.</p>
			</ReportSection>
		);
	}

	// Group by lane
	const laneMap = new Map<string, ProcessNode[]>();
	for (const node of nodes) {
		const lane = node.lane || "General";
		if (!laneMap.has(lane)) laneMap.set(lane, []);
		laneMap.get(lane)!.push(node);
	}

	return (
		<ReportSection title="Mapa del Proceso">
			<p className="mb-4 text-sm text-stone-500">
				{nodes.length} actividades en {laneMap.size} rol(es)
			</p>
			<div className="space-y-3 overflow-x-auto">
				{Array.from(laneMap.entries()).map(([lane, laneNodes]) => (
					<div key={lane} className="rounded-lg border border-stone-200 overflow-hidden">
						{/* Lane header */}
						<div className="bg-stone-100 px-4 py-2">
							<span className="text-sm font-medium text-stone-700">{lane}</span>
							<span className="ml-2 text-xs text-stone-400">
								({laneNodes.length})
							</span>
						</div>
						{/* Lane nodes */}
						<div className="bg-white px-4 py-3">
							<div className="flex flex-wrap gap-2 items-center">
								{laneNodes.map((node, i) => {
									const color = getNodeColor(node.nodeType);
									const isGateway = node.nodeType.toUpperCase().includes("GATEWAY");
									const isEvent = node.nodeType.toUpperCase().includes("EVENT");
									return (
										<div key={node.id} className="flex items-center gap-2">
											{i > 0 && (
												<svg className="w-4 h-4 text-stone-300 shrink-0" viewBox="0 0 16 16" fill="none">
													<path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											)}
											<a
												href={`#node-${node.id}`}
												className={`group inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-shadow hover:shadow-sm ${color.bg} ${color.border} ${color.text} ${node.state === "FORMING" ? "opacity-60 border-dashed" : ""} ${isGateway ? "rotate-0" : ""}`}
											>
												{isEvent && (
													<span className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${node.nodeType === "START_EVENT" ? "border-green-500" : "border-red-500"}`} />
												)}
												{isGateway && (
													<span className="w-3 h-3 shrink-0 rotate-45 border-2 border-amber-500" />
												)}
												<span className="truncate max-w-[180px]">{node.label}</span>
											</a>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				))}
			</div>
		</ReportSection>
	);
}
