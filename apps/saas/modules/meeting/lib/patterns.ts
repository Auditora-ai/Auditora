import type { DiagramNode } from "@repo/process-engine";

export interface ProcessPattern {
	id: string;
	name: string;
	description: string;
	icon: string;
	triggerWhen: (nodes: DiagramNode[]) => boolean;
	templateNodes: Omit<DiagramNode, "id">[];
}

function hasLabel(nodes: DiagramNode[], pattern: RegExp): boolean {
	return nodes.some((n) => n.state !== "rejected" && pattern.test(n.label));
}

function lacksLabel(nodes: DiagramNode[], pattern: RegExp): boolean {
	return !hasLabel(nodes, pattern);
}

export const PATTERNS: ProcessPattern[] = [
	{
		id: "approval-flow",
		name: "Flujo de Aprobacion",
		description: "Solicitud → Revision → Aprobacion/Rechazo con escalamiento",
		icon: "check-circle",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /solicitud|pedido|peticion|requerimiento/i) &&
			lacksLabel(nodes, /aprobar|rechazar|aprobacion/i),
		templateNodes: [
			{ type: "task", label: "Recibir solicitud", state: "forming", connections: [], lane: "Solicitante" },
			{ type: "task", label: "Revisar documentacion", state: "forming", connections: [], lane: "Analista" },
			{ type: "exclusive_gateway", label: "¿Cumple requisitos?", state: "forming", connections: [] },
			{ type: "task", label: "Solicitar correccion", state: "forming", connections: [], lane: "Solicitante" },
			{ type: "task", label: "Aprobar solicitud", state: "forming", connections: [], lane: "Jefe de Area" },
			{ type: "task", label: "Rechazar solicitud", state: "forming", connections: [], lane: "Jefe de Area" },
			{ type: "task", label: "Notificar resultado", state: "forming", connections: [], lane: "Sistema" },
			{ type: "end_event", label: "Fin del proceso", state: "forming", connections: [] },
		],
	},
	{
		id: "exception-handling",
		name: "Manejo de Excepciones",
		description: "Deteccion → Evaluacion → Escalamiento → Resolucion",
		icon: "alert-triangle",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /excepcion|error|incidente|problema|falla/i) &&
			lacksLabel(nodes, /escalar|escalamiento|resolucion/i),
		templateNodes: [
			{ type: "task", label: "Detectar excepcion", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Severidad?", state: "forming", connections: [] },
			{ type: "task", label: "Resolver en primer nivel", state: "forming", connections: [] },
			{ type: "task", label: "Escalar a supervisor", state: "forming", connections: [] },
			{ type: "task", label: "Investigar causa raiz", state: "forming", connections: [] },
			{ type: "task", label: "Aplicar solucion", state: "forming", connections: [] },
			{ type: "task", label: "Documentar incidente", state: "forming", connections: [] },
			{ type: "end_event", label: "Excepcion resuelta", state: "forming", connections: [] },
		],
	},
	{
		id: "review-cycle",
		name: "Ciclo de Revision",
		description: "Elaborar → Revisar → Corregir → Aprobar (iterativo)",
		icon: "refresh-cw",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /elaborar|crear|preparar|redactar/i) &&
			lacksLabel(nodes, /revisar|revision|corregir/i),
		templateNodes: [
			{ type: "task", label: "Elaborar documento", state: "forming", connections: [] },
			{ type: "task", label: "Enviar a revision", state: "forming", connections: [] },
			{ type: "task", label: "Revisar contenido", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Aprobado?", state: "forming", connections: [] },
			{ type: "task", label: "Solicitar correcciones", state: "forming", connections: [] },
			{ type: "task", label: "Aplicar correcciones", state: "forming", connections: [] },
			{ type: "task", label: "Aprobar documento", state: "forming", connections: [] },
		],
	},
	{
		id: "data-collection",
		name: "Recoleccion de Datos",
		description: "Solicitar → Recibir → Validar → Consolidar",
		icon: "database",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /datos|informacion|formato|formulario/i) &&
			lacksLabel(nodes, /validar|consolidar|verificar/i),
		templateNodes: [
			{ type: "task", label: "Solicitar informacion", state: "forming", connections: [] },
			{ type: "task", label: "Llenar formulario", state: "forming", connections: [] },
			{ type: "task", label: "Validar datos", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Datos completos?", state: "forming", connections: [] },
			{ type: "task", label: "Solicitar datos faltantes", state: "forming", connections: [] },
			{ type: "task", label: "Consolidar informacion", state: "forming", connections: [] },
		],
	},
	{
		id: "notification-loop",
		name: "Notificacion y Seguimiento",
		description: "Notificar → Esperar → Verificar → Re-notificar si no hay respuesta",
		icon: "bell",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /notificar|avisar|comunicar|informar/i) &&
			lacksLabel(nodes, /seguimiento|recordatorio|verificar respuesta/i),
		templateNodes: [
			{ type: "task", label: "Enviar notificacion", state: "forming", connections: [] },
			{ type: "task", label: "Esperar respuesta", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Respondio?", state: "forming", connections: [] },
			{ type: "task", label: "Enviar recordatorio", state: "forming", connections: [] },
			{ type: "task", label: "Escalar por falta de respuesta", state: "forming", connections: [] },
			{ type: "task", label: "Registrar respuesta", state: "forming", connections: [] },
		],
	},
	{
		id: "onboarding",
		name: "Onboarding / Alta",
		description: "Registro → Verificacion → Configuracion → Activacion",
		icon: "user-plus",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /registr|alta|onboarding|ingreso|incorporacion/i) &&
			lacksLabel(nodes, /verificar identidad|configurar|activar cuenta/i),
		templateNodes: [
			{ type: "task", label: "Recibir solicitud de alta", state: "forming", connections: [] },
			{ type: "task", label: "Verificar identidad", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Documentos validos?", state: "forming", connections: [] },
			{ type: "task", label: "Solicitar documentos", state: "forming", connections: [] },
			{ type: "task", label: "Crear perfil", state: "forming", connections: [] },
			{ type: "task", label: "Configurar accesos", state: "forming", connections: [] },
			{ type: "task", label: "Activar cuenta", state: "forming", connections: [] },
			{ type: "task", label: "Enviar bienvenida", state: "forming", connections: [] },
		],
	},
	{
		id: "parallel-processing",
		name: "Procesamiento Paralelo",
		description: "Dividir trabajo → Ejecutar en paralelo → Sincronizar",
		icon: "git-merge",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /paralelo|simultaneo|al mismo tiempo/i) &&
			lacksLabel(nodes, /sincronizar|consolidar resultados/i),
		templateNodes: [
			{ type: "parallel_gateway", label: "Dividir trabajo", state: "forming", connections: [] },
			{ type: "task", label: "Rama A - Ejecutar", state: "forming", connections: [] },
			{ type: "task", label: "Rama B - Ejecutar", state: "forming", connections: [] },
			{ type: "task", label: "Rama C - Ejecutar", state: "forming", connections: [] },
			{ type: "parallel_gateway", label: "Sincronizar resultados", state: "forming", connections: [] },
			{ type: "task", label: "Consolidar resultados", state: "forming", connections: [] },
		],
	},
	{
		id: "handoff",
		name: "Traspaso entre Areas",
		description: "Preparar → Transferir → Confirmar recepcion → Ejecutar",
		icon: "arrow-right-left",
		triggerWhen: (nodes) =>
			hasLabel(nodes, /traspasar|transferir|derivar|enviar a/i) &&
			lacksLabel(nodes, /confirmar recepcion|acuse de recibo/i),
		templateNodes: [
			{ type: "task", label: "Preparar documentacion", state: "forming", connections: [] },
			{ type: "task", label: "Transferir caso", state: "forming", connections: [] },
			{ type: "task", label: "Confirmar recepcion", state: "forming", connections: [] },
			{ type: "exclusive_gateway", label: "¿Informacion completa?", state: "forming", connections: [] },
			{ type: "task", label: "Solicitar informacion adicional", state: "forming", connections: [] },
			{ type: "task", label: "Ejecutar tarea receptora", state: "forming", connections: [] },
		],
	},
];

export function detectPatterns(currentNodes: DiagramNode[]): ProcessPattern[] {
	if (currentNodes.length < 2) return [];
	return PATTERNS.filter((p) => p.triggerWhen(currentNodes));
}
