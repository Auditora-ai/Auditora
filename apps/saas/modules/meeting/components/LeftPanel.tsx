"use client";

import { useState, useCallback } from "react";
import {
	CircleIcon,
	CircleDotIcon,
	SquareIcon,
	UserIcon,
	ServerIcon,
	GitBranchIcon,
	GitForkIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from "lucide-react";
import { PatternLibrary } from "./PatternLibrary";

interface ElementDef {
	type: string;
	label: string;
	icon: React.ElementType;
}

interface CategoryDef {
	name: string;
	elements: ElementDef[];
}

const CATEGORIES: CategoryDef[] = [
	{
		name: "Eventos",
		elements: [
			{ type: "bpmn:StartEvent", label: "Inicio", icon: CircleIcon },
			{ type: "bpmn:EndEvent", label: "Fin", icon: CircleDotIcon },
		],
	},
	{
		name: "Tareas",
		elements: [
			{ type: "bpmn:Task", label: "Tarea", icon: SquareIcon },
			{ type: "bpmn:UserTask", label: "Tarea Usuario", icon: UserIcon },
			{ type: "bpmn:ServiceTask", label: "Tarea Servicio", icon: ServerIcon },
		],
	},
	{
		name: "Gateways",
		elements: [
			{ type: "bpmn:ExclusiveGateway", label: "Exclusivo", icon: GitBranchIcon },
			{ type: "bpmn:ParallelGateway", label: "Paralelo", icon: GitForkIcon },
		],
	},
];

export function LeftPanel() {
	// PatternLibrary reads nodes from context directly

	return (
		<div
			className="flex flex-col overflow-hidden border-r border-[#334155] bg-[#0F172A]"
			style={{ gridArea: "left", width: 220, fontFamily: "Inter, system-ui, sans-serif" }}
		>
			{/* Header */}
			<div className="border-b border-[#334155] px-3 py-2">
				<span className="text-xs font-medium text-[#94A3B8]">
					Elementos BPMN
				</span>
			</div>

			{/* Element categories */}
			<div className="flex-1 overflow-y-auto no-scrollbar">
				{CATEGORIES.map((cat) => (
					<CollapsibleCategory key={cat.name} category={cat} />
				))}

				{/* Pattern Library */}
				<div className="border-t border-[#334155]">
					<PatternLibrary />
				</div>
			</div>
		</div>
	);
}

function CollapsibleCategory({ category }: { category: CategoryDef }) {
	const [open, setOpen] = useState(true);

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] transition-colors hover:text-[#94A3B8]"
			>
				{open ? (
					<ChevronDownIcon className="h-3 w-3" />
				) : (
					<ChevronRightIcon className="h-3 w-3" />
				)}
				{category.name}
			</button>
			{open && (
				<div className="space-y-0.5 px-2 pb-2">
					{category.elements.map((el) => (
						<DraggableElement key={el.type} element={el} />
					))}
				</div>
			)}
		</div>
	);
}

function DraggableElement({ element }: { element: ElementDef }) {
	const Icon = element.icon;

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			e.dataTransfer.setData("application/bpmn-element", element.type);
			e.dataTransfer.effectAllowed = "copy";
		},
		[element.type],
	);

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			className="flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#94A3B8] transition-all duration-75 hover:bg-[#1E293B] hover:text-white hover:shadow-[0_0_8px_rgba(37,99,235,0.2)] active:cursor-grabbing"
		>
			<Icon className="h-4 w-4 flex-shrink-0" />
			<span className="text-xs">{element.label}</span>
		</div>
	);
}
