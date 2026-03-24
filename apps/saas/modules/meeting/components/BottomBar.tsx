"use client";

import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import {
	MousePointerIcon,
	ArrowRightLeftIcon,
	TypeIcon,
	SparklesIcon,
} from "lucide-react";

const TOOLS = [
	{ id: "select" as const, icon: MousePointerIcon, label: "Select" },
	{ id: "connect" as const, icon: ArrowRightLeftIcon, label: "Connect" },
	{ id: "text" as const, icon: TypeIcon, label: "Text" },
	{ id: "ai-auto" as const, icon: SparklesIcon, label: "AI Auto-complete" },
];

export function BottomBar() {
	const { selectedTool, setSelectedTool, nodes, modelerApi } =
		useLiveSessionContext();

	const confirmedCount = nodes.filter((n) => n.state === "confirmed").length;
	const totalCount = nodes.length;

	const handleToolSelect = (toolId: typeof selectedTool) => {
		setSelectedTool(toolId);

		if (!modelerApi?.isReady) return;
		const modeler = modelerApi.getModeler();
		if (!modeler) return;

		// Activate bpmn-js tools
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

	return (
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
			</div>

			{/* AI Element Counter */}
			<div className="flex items-center gap-2 text-[10px] text-[#64748B]">
				<SparklesIcon className="h-3 w-3 text-[#2563EB]" />
				<span className="tabular-nums">
					Elementos generados por IA: {confirmedCount}/{totalCount}
				</span>
			</div>
		</div>
	);
}
