"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
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
	HandIcon,
	BookOpenIcon,
	TimerIcon,
	MailIcon,
	BellIcon,
	LayersIcon,
	StickyNoteIcon,
	DatabaseIcon,
	BoxIcon,
	CopyIcon,
} from "lucide-react";
import { PatternLibrary } from "./PatternLibrary";

interface ElementDef {
	type: string;
	label: string;
	icon: React.ElementType;
	tip?: string;
}

interface CategoryDef {
	name: string;
	elements: ElementDef[];
}

function getCategories(t: (key: string) => string): CategoryDef[] {
	return [
		{
			name: t("leftPanel.catEvents"),
			elements: [
				{ type: "bpmn:StartEvent", label: t("leftPanel.startEvent"), icon: CircleIcon, tip: t("leftPanel.startEventTip") },
				{ type: "bpmn:EndEvent", label: t("leftPanel.endEvent"), icon: CircleDotIcon, tip: t("leftPanel.endEventTip") },
				{ type: "bpmn:IntermediateThrowEvent", label: t("leftPanel.intermediateEvent"), icon: CircleDotIcon, tip: t("leftPanel.intermediateEventTip") },
				{ type: "bpmn:IntermediateCatchEvent", label: t("leftPanel.timerEvent"), icon: TimerIcon, tip: t("leftPanel.timerEventTip") },
				{ type: "bpmn:BoundaryEvent", label: t("leftPanel.boundaryEvent"), icon: CircleDotIcon, tip: t("leftPanel.boundaryEventTip") },
			],
		},
		{
			name: t("leftPanel.catTasks"),
			elements: [
				{ type: "bpmn:Task", label: t("leftPanel.task"), icon: SquareIcon, tip: t("leftPanel.taskTip") },
				{ type: "bpmn:UserTask", label: t("leftPanel.userTask"), icon: UserIcon, tip: t("leftPanel.userTaskTip") },
				{ type: "bpmn:ServiceTask", label: t("leftPanel.serviceTask"), icon: ServerIcon, tip: t("leftPanel.serviceTaskTip") },
				{ type: "bpmn:ManualTask", label: t("leftPanel.manualTask"), icon: HandIcon, tip: t("leftPanel.manualTaskTip") },
				{ type: "bpmn:BusinessRuleTask", label: t("leftPanel.businessRule"), icon: BookOpenIcon, tip: t("leftPanel.businessRuleTip") },
				{ type: "bpmn:ScriptTask", label: t("leftPanel.scriptTask"), icon: CopyIcon, tip: t("leftPanel.scriptTaskTip") },
			],
		},
		{
			name: t("leftPanel.catGateways"),
			elements: [
				{ type: "bpmn:ExclusiveGateway", label: t("leftPanel.exclusive"), icon: GitBranchIcon, tip: t("leftPanel.exclusiveTip") },
				{ type: "bpmn:ParallelGateway", label: t("leftPanel.parallel"), icon: GitForkIcon, tip: t("leftPanel.parallelTip") },
				{ type: "bpmn:InclusiveGateway", label: t("leftPanel.inclusive"), icon: CopyIcon, tip: t("leftPanel.inclusiveTip") },
			],
		},
		{
			name: t("leftPanel.catSubprocesses"),
			elements: [
				{ type: "bpmn:SubProcess", label: t("leftPanel.subprocess"), icon: LayersIcon, tip: t("leftPanel.subprocessTip") },
				{ type: "bpmn:CallActivity", label: t("leftPanel.callActivity"), icon: BoxIcon, tip: t("leftPanel.callActivityTip") },
			],
		},
		{
			name: t("leftPanel.catData"),
			elements: [
				{ type: "bpmn:DataObjectReference", label: t("leftPanel.dataObject"), icon: DatabaseIcon, tip: t("leftPanel.dataObjectTip") },
				{ type: "bpmn:DataStoreReference", label: t("leftPanel.dataStore"), icon: DatabaseIcon, tip: t("leftPanel.dataStoreTip") },
				{ type: "bpmn:TextAnnotation", label: t("leftPanel.annotation"), icon: StickyNoteIcon, tip: t("leftPanel.annotationTip") },
				{ type: "bpmn:Group", label: t("leftPanel.group"), icon: BoxIcon, tip: t("leftPanel.groupTip") },
			],
		},
	];
}

interface LeftPanelProps {
	collapsed: boolean;
}

export function LeftPanel({ collapsed }: LeftPanelProps) {
	const t = useTranslations("meeting");
	const categories = getCategories(t);

	if (collapsed) return <div style={{ gridArea: "left" }} />;

	return (
		<div
			className="flex flex-col overflow-hidden border-r border-chrome-border bg-chrome-base"
			style={{ gridArea: "left", fontFamily: "'Geist Sans', system-ui, sans-serif" }}
		>
			{/* Header */}
			<div className="border-b border-chrome-border px-3 py-2">
				<span className="font-display text-sm text-chrome-text-secondary">
					{t("leftPanel.header")}
				</span>
			</div>

			{/* Element categories */}
			<div className="flex-1 overflow-y-auto no-scrollbar">
				{categories.map((cat) => (
					<CollapsibleCategory key={cat.name} category={cat} />
				))}

				{/* Pattern Library */}
				<div className="border-t border-chrome-border">
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
				className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-chrome-text-muted transition-colors hover:text-chrome-text-secondary"
			>
				{open ? (
					<ChevronDownIcon className="h-3.5 w-3.5" />
				) : (
					<ChevronRightIcon className="h-3.5 w-3.5" />
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
	const [showTip, setShowTip] = useState(false);
	const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
	const elRef = useRef<HTMLDivElement>(null);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			e.dataTransfer.setData("application/bpmn-element", element.type);
			e.dataTransfer.effectAllowed = "copy";
			setShowTip(false);
		},
		[element.type],
	);

	const handleMouseEnter = useCallback(() => {
		if (!elRef.current || !element.tip) return;
		const rect = elRef.current.getBoundingClientRect();
		setTipPos({ x: rect.right + 8, y: rect.top });
		setShowTip(true);
	}, [element.tip]);

	return (
		<div
			ref={elRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={() => setShowTip(false)}
		>
			<div
				draggable
				onDragStart={handleDragStart}
				className="flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 text-chrome-text-secondary transition-all duration-75 hover:bg-chrome-raised hover:text-white hover:shadow-[0_0_8px_rgba(37,99,235,0.2)] active:cursor-grabbing"
			>
				<Icon className="h-4 w-4 flex-shrink-0" />
				<span className="text-xs">{element.label}</span>
			</div>

			{/* Tooltip via portal — escapes overflow:hidden */}
			{showTip && element.tip && typeof document !== "undefined" && createPortal(
				<div
					className="pointer-events-none fixed z-[9999] w-56 rounded-lg bg-chrome-base px-3 py-2.5 text-[11px] leading-relaxed text-chrome-text-secondary shadow-xl ring-1 ring-chrome-border"
					style={{ left: tipPos.x, top: tipPos.y }}
				>
					<div className="text-xs font-medium text-white">{element.label}</div>
					<div className="mt-1 text-chrome-text-secondary">{element.tip}</div>
				</div>,
				document.body,
			)}
		</div>
	);
}
