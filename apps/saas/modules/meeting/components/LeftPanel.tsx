"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

const CATEGORIES: CategoryDef[] = [
	{
		name: "Eventos",
		elements: [
			{ type: "bpmn:StartEvent", label: "Inicio", icon: CircleIcon, tip: "Punto donde arranca el proceso. Solo debe haber uno por flujo principal." },
			{ type: "bpmn:EndEvent", label: "Fin", icon: CircleDotIcon, tip: "Punto donde termina el proceso. Puede haber varios si hay caminos distintos." },
			{ type: "bpmn:IntermediateThrowEvent", label: "Intermedio", icon: CircleDotIcon, tip: "Algo que ocurre a mitad del flujo. Ej: enviar una notificacion, escalar un caso." },
			{ type: "bpmn:IntermediateCatchEvent", label: "Temporizador", icon: TimerIcon, tip: "Una espera o plazo. Ej: esperar 24 hrs para aprobacion, deadline de respuesta." },
			{ type: "bpmn:BoundaryEvent", label: "Evento Limite", icon: CircleDotIcon, tip: "Evento adjunto al borde de una tarea. Ej: timeout de SLA, error que interrumpe la tarea." },
		],
	},
	{
		name: "Tareas",
		elements: [
			{ type: "bpmn:Task", label: "Tarea", icon: SquareIcon, tip: "Actividad generica. Usala cuando no importa si es manual o de sistema." },
			{ type: "bpmn:UserTask", label: "Tarea Usuario", icon: UserIcon, tip: "Una persona hace esta tarea. Ej: revisar documento, aprobar solicitud." },
			{ type: "bpmn:ServiceTask", label: "Tarea Servicio", icon: ServerIcon, tip: "Un sistema lo hace automaticamente. Ej: enviar email, consultar API, generar reporte." },
			{ type: "bpmn:ManualTask", label: "Tarea Manual", icon: HandIcon, tip: "Trabajo fisico sin sistema. Ej: entregar paquete, firmar documento en papel." },
			{ type: "bpmn:BusinessRuleTask", label: "Regla de Negocio", icon: BookOpenIcon, tip: "Decision basada en reglas definidas. Ej: calcular descuento segun politica, validar credito." },
			{ type: "bpmn:ScriptTask", label: "Tarea Script", icon: CopyIcon, tip: "Ejecucion automatica de codigo. Ej: transformar datos, calcular totales." },
		],
	},
	{
		name: "Gateways",
		elements: [
			{ type: "bpmn:ExclusiveGateway", label: "Exclusivo", icon: GitBranchIcon, tip: "Solo UN camino se ejecuta. Ej: Si aprobado -> continuar, Si no -> rechazar." },
			{ type: "bpmn:ParallelGateway", label: "Paralelo", icon: GitForkIcon, tip: "TODOS los caminos se ejecutan al mismo tiempo. Ej: enviar email Y actualizar sistema." },
			{ type: "bpmn:InclusiveGateway", label: "Inclusivo", icon: CopyIcon, tip: "UNO O MAS caminos se ejecutan. Ej: notificar a gerente Y/O a director segun monto." },
		],
	},
	{
		name: "Subprocesos",
		elements: [
			{ type: "bpmn:SubProcess", label: "Subproceso", icon: LayersIcon, tip: "Un proceso dentro de otro. Agrupa pasos que van juntos. Ej: 'Validacion de documentos'." },
			{ type: "bpmn:CallActivity", label: "Call Activity", icon: BoxIcon, tip: "Llama a otro proceso ya definido. Ej: reusar el proceso de 'Aprobacion de compras'." },
		],
	},
	{
		name: "Datos",
		elements: [
			{ type: "bpmn:DataObjectReference", label: "Objeto de Datos", icon: DatabaseIcon, tip: "Un documento o dato que se usa o produce. Ej: factura, orden de compra, contrato." },
			{ type: "bpmn:DataStoreReference", label: "Almacen de Datos", icon: DatabaseIcon, tip: "Un sistema donde se guardan datos. Ej: ERP, base de datos, SharePoint." },
			{ type: "bpmn:TextAnnotation", label: "Anotacion", icon: StickyNoteIcon, tip: "Nota aclaratoria. No afecta el flujo, solo documenta. Ej: 'SLA: 48 hrs'." },
			{ type: "bpmn:Group", label: "Grupo", icon: BoxIcon, tip: "Agrupacion visual. No afecta el flujo, solo organiza visualmente. Ej: demarcar fases del proceso." },
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
				className="flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#94A3B8] transition-all duration-75 hover:bg-[#1E293B] hover:text-white hover:shadow-[0_0_8px_rgba(37,99,235,0.2)] active:cursor-grabbing"
			>
				<Icon className="h-4 w-4 flex-shrink-0" />
				<span className="text-xs">{element.label}</span>
			</div>

			{/* Tooltip via portal — escapes overflow:hidden */}
			{showTip && element.tip && typeof document !== "undefined" && createPortal(
				<div
					className="pointer-events-none fixed z-[9999] w-56 rounded-lg bg-[#0F172A] px-3 py-2.5 text-[11px] leading-relaxed text-[#CBD5E1] shadow-xl ring-1 ring-[#334155]"
					style={{ left: tipPos.x, top: tipPos.y }}
				>
					<div className="text-xs font-medium text-white">{element.label}</div>
					<div className="mt-1 text-[#94A3B8]">{element.tip}</div>
				</div>,
				document.body,
			)}
		</div>
	);
}
