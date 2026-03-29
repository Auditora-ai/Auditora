"use client";

import { useMemo } from "react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	XIcon,
	CheckCircleIcon,
	AlertCircleIcon,
	BoxIcon,
	GitBranchIcon,
	CircleIcon,
	ArrowRightIcon,
} from "lucide-react";
import { useProcessWorkspace } from "../../context/ProcessWorkspaceContext";
import type { RaciEntry } from "../../types";

const TYPE_LABELS: Record<string, string> = {
	"bpmn:Task": "Tarea",
	"bpmn:UserTask": "Tarea de Usuario",
	"bpmn:ServiceTask": "Tarea de Servicio",
	"bpmn:ScriptTask": "Tarea de Script",
	"bpmn:ManualTask": "Tarea Manual",
	"bpmn:BusinessRuleTask": "Regla de Negocio",
	"bpmn:SendTask": "Tarea de Envío",
	"bpmn:ReceiveTask": "Tarea de Recepción",
	"bpmn:SubProcess": "Sub-Proceso",
	"bpmn:CallActivity": "Actividad de Llamada",
	"bpmn:ExclusiveGateway": "Gateway Exclusivo",
	"bpmn:ParallelGateway": "Gateway Paralelo",
	"bpmn:InclusiveGateway": "Gateway Inclusivo",
	"bpmn:StartEvent": "Evento de Inicio",
	"bpmn:EndEvent": "Evento de Fin",
	"bpmn:IntermediateCatchEvent": "Evento Intermedio",
	"bpmn:IntermediateThrowEvent": "Evento Intermedio",
	"bpmn:BoundaryEvent": "Evento de Borde",
	"bpmn:SequenceFlow": "Flujo de Secuencia",
	"bpmn:Participant": "Participante",
	"bpmn:Lane": "Carril",
};

interface NodeContextPanelProps {
	element: { id: string; type: string; name: string };
	processId: string;
	raciEntries?: RaciEntry[];
}

export function NodeContextPanel({ element, processId, raciEntries }: NodeContextPanelProps) {
	const { clearSelection } = useProcessWorkspace();

	const typeLabel = TYPE_LABELS[element.type] || element.type.replace("bpmn:", "");

	// Match RACI entries by exact activity name
	const matchedRaci = useMemo(() => {
		if (!raciEntries) return [];
		const nameLower = element.name.toLowerCase().trim();
		return raciEntries.filter(
			(entry) => entry.activityName.toLowerCase().trim() === nameLower,
		);
	}, [raciEntries, element.name]);

	const hasRaci = matchedRaci.length > 0;

	const isTask = element.type.includes("Task") || element.type === "bpmn:SubProcess" || element.type === "bpmn:CallActivity";

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2.5">
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold">{element.name || element.id}</p>
					<p className="text-xs text-muted-foreground">{typeLabel}</p>
				</div>
				<Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={clearSelection}>
					<XIcon className="h-3.5 w-3.5" />
				</Button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-3 space-y-4">
				{/* Health Status */}
				{isTask && (
					<div className="rounded-lg border p-3">
						<div className="flex items-center gap-2 mb-2">
							{hasRaci ? (
								<CheckCircleIcon className="h-4 w-4 text-success" />
							) : (
								<AlertCircleIcon className="h-4 w-4 text-destructive" />
							)}
							<span className="text-sm font-medium">
								{hasRaci ? "RACI asignado" : "RACI pendiente"}
							</span>
						</div>
						{hasRaci ? (
							<div className="space-y-1.5">
								{matchedRaci.map((entry, i) => (
									<div key={i} className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">{entry.role}</span>
										<Badge status="info" className="text-[10px]">
											{entry.assignment}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<p className="text-xs text-muted-foreground">
								No hay asignación RACI para esta actividad. Genera la matriz RACI desde la pestaña de análisis.
							</p>
						)}
					</div>
				)}

				{/* Element Info */}
				<div className="space-y-2">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Propiedades
					</h4>
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">ID</span>
							<span className="font-mono text-[10px]">{element.id}</span>
						</div>
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">Tipo</span>
							<span>{typeLabel}</span>
						</div>
					</div>
				</div>

				{/* Gateway info */}
				{element.type.includes("Gateway") && (
					<div className="rounded-lg border border-yellow-500/30 bg-yellow-50 p-3">
						<p className="text-xs text-yellow-800">
							Los gateways controlan el flujo del proceso. Haz click en los flujos de salida para ver las condiciones.
						</p>
					</div>
				)}

				{/* Event info */}
				{(element.type.includes("Event")) && (
					<div className="rounded-lg border border-success/30 bg-green-50 p-3">
						<p className="text-xs text-green-800">
							{element.type.includes("Start") && "Este evento inicia el proceso."}
							{element.type.includes("End") && "Este evento finaliza el proceso."}
							{element.type.includes("Intermediate") && "Evento intermedio en el flujo."}
							{element.type.includes("Boundary") && "Evento de borde adjunto a una actividad."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
