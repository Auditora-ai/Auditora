/**
 * Shared display configuration for BPMN node types and states.
 * Used by NodePropertiesView, ProcessTreeEditor, and other node-related components.
 */

import {
	CircleDotIcon,
	SquareIcon,
	DiamondIcon,
	BoxIcon,
	UserIcon,
	CpuIcon,
	CheckCircle2Icon,
	ClockIcon,
	AlertCircleIcon,
} from "lucide-react";

export const NODE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
	"bpmn:StartEvent": { icon: CircleDotIcon, color: "#16A34A", bg: "#F0FDF4", label: "Inicio" },
	"bpmn:EndEvent": { icon: CircleDotIcon, color: "#DC2626", bg: "#FEF2F2", label: "Fin" },
	"bpmn:Task": { icon: SquareIcon, color: "#3B82F6", bg: "#ECFDF5", label: "Tarea" },
	"bpmn:UserTask": { icon: UserIcon, color: "#3B82F6", bg: "#ECFDF5", label: "Tarea Usuario" },
	"bpmn:ServiceTask": { icon: CpuIcon, color: "#3B82F6", bg: "#ECFDF5", label: "Tarea Servicio" },
	"bpmn:ManualTask": { icon: SquareIcon, color: "#3B82F6", bg: "#ECFDF5", label: "Tarea Manual" },
	"bpmn:ExclusiveGateway": { icon: DiamondIcon, color: "#EAB308", bg: "#FEF9C3", label: "Gateway" },
	"bpmn:ParallelGateway": { icon: DiamondIcon, color: "#7C3AED", bg: "#F5F3FF", label: "Paralelo" },
	"bpmn:SubProcess": { icon: BoxIcon, color: "#7C3AED", bg: "#F5F3FF", label: "Subproceso" },
};

export const getNodeConfig = (type: string) =>
	NODE_CONFIG[type] || { icon: SquareIcon, color: "#64748B", bg: "#F8FAFC", label: "Elemento" };

export const STATE_BADGE: Record<string, { icon: React.ElementType; color: string; label: string }> = {
	confirmed: { icon: CheckCircle2Icon, color: "#16A34A", label: "Confirmado" },
	forming: { icon: ClockIcon, color: "#EAB308", label: "En formacion" },
	rejected: { icon: AlertCircleIcon, color: "#DC2626", label: "Rechazado" },
};

/** All available node types for the type selector dropdown */
export const NODE_TYPES = [
	{ value: "TASK", label: "Tarea", bpmn: "bpmn:Task" },
	{ value: "USER_TASK", label: "Tarea Usuario", bpmn: "bpmn:UserTask" },
	{ value: "SERVICE_TASK", label: "Tarea Servicio", bpmn: "bpmn:ServiceTask" },
	{ value: "MANUAL_TASK", label: "Tarea Manual", bpmn: "bpmn:ManualTask" },
	{ value: "EXCLUSIVE_GATEWAY", label: "Gateway Exclusivo", bpmn: "bpmn:ExclusiveGateway" },
	{ value: "PARALLEL_GATEWAY", label: "Gateway Paralelo", bpmn: "bpmn:ParallelGateway" },
	{ value: "SUBPROCESS", label: "Subproceso", bpmn: "bpmn:SubProcess" },
	{ value: "START_EVENT", label: "Evento Inicio", bpmn: "bpmn:StartEvent" },
	{ value: "END_EVENT", label: "Evento Fin", bpmn: "bpmn:EndEvent" },
] as const;
