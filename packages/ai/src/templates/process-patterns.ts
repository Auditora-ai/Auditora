/**
 * Process Pattern Templates
 *
 * Common BPM process patterns that can be suggested as scaffolds
 * when the AI detects a matching pattern during extraction.
 * Each pattern provides 5-8 pre-connected nodes.
 */

export interface ProcessPatternNode {
  id: string;
  type: "task" | "exclusiveGateway" | "startEvent" | "endEvent";
  label: string;
  lane?: string;
  connectTo?: string;
}

export interface ProcessPattern {
  id: string;
  name: string;
  description: string;
  nodes: ProcessPatternNode[];
}

export const PROCESS_PATTERNS: ProcessPattern[] = [
  {
    id: "approval_flow",
    name: "Flujo de Aprobacion",
    description:
      "Proceso estandar de solicitud, revision y aprobacion/rechazo con notificacion al solicitante.",
    nodes: [
      {
        id: "tpl_approval_start",
        type: "startEvent",
        label: "Solicitud recibida",
        connectTo: "tpl_approval_review",
      },
      {
        id: "tpl_approval_review",
        type: "task",
        label: "Revisar solicitud",
        lane: "Revisor",
        connectTo: "tpl_approval_decision",
      },
      {
        id: "tpl_approval_decision",
        type: "exclusiveGateway",
        label: "Aprobado?",
        connectTo: "tpl_approval_approve",
      },
      {
        id: "tpl_approval_approve",
        type: "task",
        label: "Registrar aprobacion",
        lane: "Revisor",
        connectTo: "tpl_approval_notify",
      },
      {
        id: "tpl_approval_reject",
        type: "task",
        label: "Registrar rechazo",
        lane: "Revisor",
        connectTo: "tpl_approval_notify",
      },
      {
        id: "tpl_approval_notify",
        type: "task",
        label: "Notificar solicitante",
        lane: "Sistema",
        connectTo: "tpl_approval_end",
      },
      {
        id: "tpl_approval_end",
        type: "endEvent",
        label: "Fin",
      },
    ],
  },
  {
    id: "procurement",
    name: "Proceso de Compras",
    description:
      "Ciclo completo de adquisicion: desde la requisicion hasta el pago al proveedor.",
    nodes: [
      {
        id: "tpl_proc_start",
        type: "startEvent",
        label: "Necesidad identificada",
        connectTo: "tpl_proc_requisicion",
      },
      {
        id: "tpl_proc_requisicion",
        type: "task",
        label: "Crear requisicion",
        lane: "Solicitante",
        connectTo: "tpl_proc_cotizacion",
      },
      {
        id: "tpl_proc_cotizacion",
        type: "task",
        label: "Solicitar cotizaciones",
        lane: "Compras",
        connectTo: "tpl_proc_evaluacion",
      },
      {
        id: "tpl_proc_evaluacion",
        type: "task",
        label: "Evaluar proveedores",
        lane: "Compras",
        connectTo: "tpl_proc_orden",
      },
      {
        id: "tpl_proc_orden",
        type: "task",
        label: "Emitir orden de compra",
        lane: "Compras",
        connectTo: "tpl_proc_recepcion",
      },
      {
        id: "tpl_proc_recepcion",
        type: "task",
        label: "Recibir material",
        lane: "Almacen",
        connectTo: "tpl_proc_pago",
      },
      {
        id: "tpl_proc_pago",
        type: "task",
        label: "Procesar pago",
        lane: "Finanzas",
        connectTo: "tpl_proc_end",
      },
      {
        id: "tpl_proc_end",
        type: "endEvent",
        label: "Fin",
      },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding de Personal",
    description:
      "Proceso de incorporacion de nuevos empleados: documentacion, capacitacion y alta en sistemas.",
    nodes: [
      {
        id: "tpl_onb_start",
        type: "startEvent",
        label: "Nuevo ingreso autorizado",
        connectTo: "tpl_onb_solicitud",
      },
      {
        id: "tpl_onb_solicitud",
        type: "task",
        label: "Recabar solicitud",
        lane: "RRHH",
        connectTo: "tpl_onb_docs",
      },
      {
        id: "tpl_onb_docs",
        type: "task",
        label: "Recopilar documentacion",
        lane: "RRHH",
        connectTo: "tpl_onb_capacitacion",
      },
      {
        id: "tpl_onb_capacitacion",
        type: "task",
        label: "Impartir capacitacion",
        lane: "Capacitacion",
        connectTo: "tpl_onb_evaluacion",
      },
      {
        id: "tpl_onb_evaluacion",
        type: "task",
        label: "Evaluar competencias",
        lane: "Capacitacion",
        connectTo: "tpl_onb_alta",
      },
      {
        id: "tpl_onb_alta",
        type: "task",
        label: "Alta en sistema",
        lane: "TI",
        connectTo: "tpl_onb_end",
      },
      {
        id: "tpl_onb_end",
        type: "endEvent",
        label: "Fin",
      },
    ],
  },
  {
    id: "incident_management",
    name: "Gestion de Incidentes",
    description:
      "Proceso de atencion a incidentes: reporte, clasificacion, asignacion, resolucion y cierre.",
    nodes: [
      {
        id: "tpl_inc_start",
        type: "startEvent",
        label: "Incidente reportado",
        connectTo: "tpl_inc_reporte",
      },
      {
        id: "tpl_inc_reporte",
        type: "task",
        label: "Registrar incidente",
        lane: "Mesa de Servicio",
        connectTo: "tpl_inc_clasificacion",
      },
      {
        id: "tpl_inc_clasificacion",
        type: "task",
        label: "Clasificar y priorizar",
        lane: "Mesa de Servicio",
        connectTo: "tpl_inc_asignacion",
      },
      {
        id: "tpl_inc_asignacion",
        type: "task",
        label: "Asignar responsable",
        lane: "Mesa de Servicio",
        connectTo: "tpl_inc_resolucion",
      },
      {
        id: "tpl_inc_resolucion",
        type: "task",
        label: "Resolver incidente",
        lane: "Soporte Tecnico",
        connectTo: "tpl_inc_cierre",
      },
      {
        id: "tpl_inc_cierre",
        type: "task",
        label: "Cerrar y documentar",
        lane: "Mesa de Servicio",
        connectTo: "tpl_inc_end",
      },
      {
        id: "tpl_inc_end",
        type: "endEvent",
        label: "Fin",
      },
    ],
  },
  {
    id: "customer_service",
    name: "Atencion al Cliente",
    description:
      "Proceso de recepcion y resolucion de solicitudes de clientes con seguimiento.",
    nodes: [
      {
        id: "tpl_cs_start",
        type: "startEvent",
        label: "Solicitud de cliente",
        connectTo: "tpl_cs_recepcion",
      },
      {
        id: "tpl_cs_recepcion",
        type: "task",
        label: "Recibir solicitud",
        lane: "Atencion al Cliente",
        connectTo: "tpl_cs_clasificacion",
      },
      {
        id: "tpl_cs_clasificacion",
        type: "task",
        label: "Clasificar solicitud",
        lane: "Atencion al Cliente",
        connectTo: "tpl_cs_atencion",
      },
      {
        id: "tpl_cs_atencion",
        type: "task",
        label: "Atender solicitud",
        lane: "Especialista",
        connectTo: "tpl_cs_seguimiento",
      },
      {
        id: "tpl_cs_seguimiento",
        type: "task",
        label: "Dar seguimiento",
        lane: "Atencion al Cliente",
        connectTo: "tpl_cs_cierre",
      },
      {
        id: "tpl_cs_cierre",
        type: "task",
        label: "Cerrar caso",
        lane: "Atencion al Cliente",
        connectTo: "tpl_cs_end",
      },
      {
        id: "tpl_cs_end",
        type: "endEvent",
        label: "Fin",
      },
    ],
  },
];

/**
 * Available pattern IDs for prompt injection.
 * Used by the extraction pipeline to tell the LLM what patterns exist.
 */
export function getPatternSummariesForPrompt(): string {
  return PROCESS_PATTERNS.map(
    (p) => `- "${p.id}": ${p.name} — ${p.description} (${p.nodes.length} nodos)`,
  ).join("\n");
}

/**
 * Find a pattern by ID.
 */
export function getPatternById(id: string): ProcessPattern | undefined {
  return PROCESS_PATTERNS.find((p) => p.id === id);
}
