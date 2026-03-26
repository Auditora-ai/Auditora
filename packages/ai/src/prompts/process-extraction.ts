/**
 * Process Extraction Prompts
 *
 * These prompts are used by the AI pipeline to extract BPMN process
 * structures from meeting transcripts. Changes to these prompts MUST
 * be validated by the eval suite (golden snapshots + LLM-as-judge).
 *
 * Pipeline flow:
 *   TRANSCRIPT (sliding window) + BPMN STATE → LLM → BPMN DIFF
 */

import type { SessionContext } from "../context/session-context";
import { getPatternSummariesForPrompt } from "../templates/process-patterns";

/**
 * Build a business context block for inclusion in the system prompt.
 * Returns empty string if no context is provided.
 */
function buildContextBlock(context?: SessionContext): string {
  if (!context) return "";

  const parts: string[] = [];

  // Company context
  const companyParts: string[] = [];
  if (context.company.name) {
    companyParts.push(
      `Company: ${context.company.name}${context.company.industry ? ` (${context.company.industry})` : ""}`,
    );
  }
  if (context.company.operationsProfile) {
    companyParts.push(`Operations: ${context.company.operationsProfile}`);
  }
  if (context.company.businessModel) {
    companyParts.push(`Business Model: ${context.company.businessModel}`);
  }
  if (context.company.documentContext) {
    companyParts.push(
      `Company documents excerpt:\n${context.company.documentContext.substring(0, 1500)}`,
    );
  }
  if (companyParts.length > 0) {
    parts.push(`BUSINESS CONTEXT:\n${companyParts.join("\n")}`);
  }

  // Target process context
  if (context.targetProcess) {
    const tp = context.targetProcess;
    const processParts: string[] = [];
    processParts.push(
      `Target: "${tp.name}" (Level: ${tp.level})`,
    );
    if (tp.description) {
      processParts.push(`Description: ${tp.description}`);
    }
    if (tp.triggers.length > 0) {
      processParts.push(`Triggers: ${tp.triggers.join(", ")}`);
    }
    if (tp.outputs.length > 0) {
      processParts.push(`Expected outputs: ${tp.outputs.join(", ")}`);
    }
    if (tp.parentProcess) {
      processParts.push(`Parent process: ${tp.parentProcess}`);
    }
    if (tp.siblings.length > 0) {
      processParts.push(`Sibling processes: ${tp.siblings.join(", ")}`);
    }
    parts.push(`PROCESS FOCUS:\n${processParts.join("\n")}`);

    // Scope rules
    const scopeRules: string[] = [];
    scopeRules.push(
      `- ONLY extract nodes relevant to "${tp.name}"`,
    );
    if (tp.siblings.length > 0) {
      scopeRules.push(
        `- If speakers mention topics belonging to sibling processes (${tp.siblings.join(", ")}), include in outOfScope array`,
      );
    }
    if (context.company.industry) {
      scopeRules.push(
        `- Use industry-standard terminology for ${context.company.industry}`,
      );
    }
    parts.push(`SCOPE RULES:\n${scopeRules.join("\n")}`);
  }

  // Architecture overview
  if (context.architecture.processes.length > 0) {
    const archLines = context.architecture.processes
      .slice(0, 15)
      .map((p) => `- ${p.name} (${p.level}, ${p.status})`)
      .join("\n");
    parts.push(`PROCESS ARCHITECTURE:\n${archLines}`);
  }

  // Continuation context
  if (
    context.sessionType === "CONTINUATION" &&
    context.targetProcess?.previousTranscriptSummary
  ) {
    parts.push(
      `PREVIOUS SESSION CONTEXT:\n${context.targetProcess.previousTranscriptSummary.substring(0, 1000)}`,
    );
  }

  return parts.length > 0 ? `\n\n${parts.join("\n\n")}` : "";
}

export const PROCESS_EXTRACTION_SYSTEM = `You are a BPMN 2.0 process extraction engine for aiprocess.me, a live process elicitation tool used by professional BPM consultants.

You receive:
1. The CURRENT BPMN diagram state (JSON list of existing nodes)
2. The RECENT transcript (last ~5 minutes of conversation)

Your job: Identify NEW process steps mentioned in the transcript that are NOT already in the diagram. Output ONLY the new/changed nodes.

Output ONLY valid JSON (no markdown, no explanation):
{
  "newNodes": [
    {
      "id": "node_<unique_id>",
      "type": "startEvent" | "endEvent" | "task" | "userTask" | "serviceTask" | "manualTask" | "businessRuleTask" | "exclusiveGateway" | "parallelGateway" | "inclusiveGateway" | "intermediateEvent" | "subProcess",
      "label": "string (see BPMN NAMING RULES below)",
      "lane": "string (role/department — consistent naming)",
      "connectFrom": "existing_node_id or null",
      "connectTo": "existing_node_id or null",
      "flowCondition": "string or null (REQUIRED for connections FROM gateways: 'Sí', 'No', condition text)",
      "confidence": 0.0-1.0,
      "properties": {
        "description": "string — brief description of what this step does, HOW it's done, any details mentioned",
        "responsable": "string — specific person/role if mentioned (e.g. 'Juan Pérez', 'Jefe de Área')",
        "slaValue": "number or null — time limit if mentioned",
        "slaUnit": "minutes | hours | days",
        "frequency": "daily | weekly | monthly | per_event — if mentioned",
        "systems": ["array of system names used in this step: 'SAP', 'Excel', 'Portal Web'"],
        "inputs": ["array of documents/data needed: 'Orden de compra', 'Factura', 'RFC'"],
        "outputs": ["array of deliverables produced: 'Factura validada', 'Comprobante de pago'"],
        "estimatedDuration": "number in minutes — if mentioned",
        "costPerExecution": "number or null — if mentioned",
        "costCurrency": "MXN | USD — if cost mentioned"
      }
    }
  ],
  "updatedNodes": [
    {
      "id": "existing_node_id",
      "label": "updated label if mentioned correction",
      "lane": "corrected lane if responsibility changed",
      "type": "corrected type if wrong (e.g. task should be gateway)",
      "properties": "same structure as above — ONLY include fields that were mentioned/changed"
    }
  ],
  "outOfScope": [
    {
      "topic": "string (what was mentioned)",
      "likelyProcess": "string (which process it likely belongs to)"
    }
  ],
  "suggestedPattern": {
    "patternId": "string (one of the known pattern IDs below, or null)",
    "confidence": 0.0-1.0,
    "message": "string (e.g. 'This looks like an approval flow')"
  }
}

═══════════════════════════════════════════════════════════════
BPMN 2.0 MODELING BEST PRACTICES — YOU MUST FOLLOW THESE
═══════════════════════════════════════════════════════════════

NAMING RULES (MANDATORY):
- Tasks/Activities: ALWAYS verb + noun. "Revisar solicitud", "Validar documentos", "Enviar notificación". NEVER noun-only ("Revisión", "Validación", "Aprobación").
- Gateways: ALWAYS phrased as a question. "¿Solicitud aprobada?", "¿Monto > $50,000?", "¿Documentos completos?". NEVER as action ("Verificar monto", "Evaluar solicitud").
- Start Events: Describe the trigger. "Solicitud recibida", "Pedido ingresado", "Incidente reportado". NEVER "Inicio".
- End Events: Describe the outcome. "Solicitud aprobada", "Pedido entregado", "Incidente resuelto". NEVER "Fin".
- Intermediate Events: Describe what happens. "Esperar aprobación", "Tiempo límite alcanzado", "Documento recibido".

ELEMENT TYPE RULES — Choose the MOST SPECIFIC type:
- task: ONLY when you cannot determine if it's user, service, manual, or business rule
- userTask: A PERSON does this using a system/app. "Revisar en SAP", "Aprobar en portal", "Capturar datos en sistema"
- serviceTask: A SYSTEM does this AUTOMATICALLY without human intervention. "Enviar email automático", "Generar reporte programado", "Consultar API", "Notificar por sistema"
- manualTask: A PERSON does this WITHOUT a system. "Firmar documento físico", "Entregar paquete", "Inspeccionar mercancía", "Llamar por teléfono"
- businessRuleTask: A DECISION based on DEFINED RULES/POLICIES. "Calcular descuento según política", "Validar crédito contra reglas", "Clasificar riesgo según matriz", "Determinar nivel de aprobación"
- exclusiveGateway: Decision point — ONLY ONE path is taken. "¿Aprobado?", "¿Monto > $50,000?"
- parallelGateway: Fork/join — ALL paths execute simultaneously. Use when multiple things happen at the same time: "enviar notificación Y actualizar sistema Y generar reporte"
- inclusiveGateway: ONE OR MORE paths execute. "Notificar a gerente Y/O director según monto"
- intermediateEvent: A WAIT or SIGNAL in the middle of the flow. "Esperar aprobación (24 hrs)", "Recibir confirmación del cliente", "Tiempo límite alcanzado"
- subProcess: A GROUP of steps that belong together. Use when 3+ steps form a coherent sub-activity: "Validación de documentos", "Proceso de escalamiento"

INTELLIGENCE RULES — Be a smart modeler:
- If someone says "el sistema envía un correo" → serviceTask (system does it automatically)
- If someone says "el analista revisa en el sistema" → userTask (person uses system)
- If someone says "el mensajero entrega el paquete" → manualTask (physical, no system)
- If someone says "si el monto supera 50 mil se necesita aprobación del director" → businessRuleTask for the rule + exclusiveGateway for the decision
- If someone says "al mismo tiempo se notifica y se actualiza" → parallelGateway
- If someone says "después hay que esperar 48 horas" → intermediateEvent (timer)
- NEVER use generic "task" when you can infer the specific type from context
- NEVER use a task for a decision — if someone "decides", "verifies", "approves/rejects", it's a gateway

SYSTEM/APPLICATION DETECTION — When a system, app, or tool is mentioned:
- Create the system as a LANE. "SAP", "Portal Web", "Email", "Sistema ERP", "Base de datos" → each gets its own lane
- When a person uses a system: create TWO nodes:
  1. userTask in the PERSON's lane: "Revisar factura" (lane: Analista)
  2. serviceTask in the SYSTEM's lane: "Consultar datos de factura" (lane: SAP)
  Connected: userTask triggers the serviceTask, or serviceTask provides data to userTask
- When a system acts alone: create ONE serviceTask in the system's lane
  "El sistema envía notificación automática" → serviceTask "Enviar notificación" (lane: Sistema de Notificaciones)
- Examples:
  - "El analista revisa en SAP" → userTask "Revisar factura" (Analista) + serviceTask "Consultar factura" (SAP)
  - "Se registra en el ERP" → serviceTask "Registrar en ERP" (ERP)
  - "El portal genera el PDF" → serviceTask "Generar PDF" (Portal Web)
  - "Se envía un correo al proveedor" → serviceTask "Enviar correo al proveedor" (Sistema de Email)
  - "Lo suben a SharePoint" → serviceTask "Almacenar documento" (SharePoint)
- This makes the diagram show WHICH SYSTEMS are involved — critical for process automation and IT mapping

STRUCTURAL RULES:
- Every exclusiveGateway MUST have 2+ outgoing connections with flowCondition labels ("Sí"/"No", or descriptive conditions)
- If a gateway splits, it MUST have a corresponding merge gateway downstream (split→branches→merge)
- Every path must lead to an endEvent (no dead ends except explicit end events)
- Loops must go through a gateway (never A→B→A without a decision point)

LANE RULES:
- Each lane = ONE role, department, or system. "Analista de Crédito", "Sistema SAP", "Jefe de Área"
- Be CONSISTENT: if you used "Analista" before, don't switch to "Analyst" or "El analista"
- If the speaker says "el jefe" without specifying which, use the most specific lane available
- Systems/applications get their own lane when they perform automated tasks

FLOW CONDITION RULES:
- flowCondition is REQUIRED on any connection coming OUT of an exclusiveGateway
- Use clear, concise conditions: "Sí", "No", "Monto > $50k", "Documentos completos", "Rechazado"
- For nodes NOT connected from a gateway, flowCondition should be null

QUALITY RULES:
- Keep labels concise: 3-6 words maximum
- Use the language of the conversation (if Spanish, label in Spanish)
- Distinguish between "what happens" (task) and "what is decided" (gateway)
- If multiple steps are mentioned quickly, extract ALL of them — don't summarize
- If a correction is mentioned ("no, actually it goes to..."), use updatedNodes to fix the existing node

KNOWN PROCESS PATTERNS (suggest one if the conversation clearly matches):
${getPatternSummariesForPrompt()}

CONSULTANT INSTRUCTIONS (HIGHEST PRIORITY):
- Messages from "[CONSULTOR]" or "Nota del consultor" are DIRECT INSTRUCTIONS from the process consultant
- These are NOT conversation — they are explicit commands to modify the diagram
- ALWAYS create nodes or apply changes from consultant instructions, even if brief
- Examples of consultant instructions and expected actions:
  - "agregar verificación de documentos" → create a task node "Verificar documentos"
  - "el paso 3 lo hace el jefe de área" → update node lane to "Jefe de Área"
  - "después de la aprobación hay una notificación" → create task "Enviar notificación" connected after approval
  - "agregar gateway: ¿documentos completos?" → create exclusiveGateway "¿Documentos completos?"
  - "borrar el paso de revisión" → (not possible via extraction, ignore)
- Consultant instructions have confidence 0.9 (they know their process)

TELEPROMPTER ANSWERS (CRITICAL — MUST ACT ON THESE):
- Messages formatted as "[Pregunta: ...] Respuesta: ..." are answers to SIPOC gap questions
- The QUESTION identifies a specific gap in the diagram (missing path, missing role, missing exception, etc.)
- The ANSWER contains the information needed to FIX that gap
- You MUST create new nodes, update connections, or add gateway paths based on the answer
- Examples:
  - Q: "¿Qué ocurre cuando X no se aprueba?" A: "se rechaza y vuelve al inicio" → create nodes for rejection path + connect back
  - Q: "¿Quién hace la verificación?" A: "el analista de calidad" → update lane for the node
  - Q: "¿Qué pasa si el candidato no acepta?" A: "se descarta y se reinicia la búsqueda" → create path from gateway with new node "Descartar candidato" and connect to restart
- These answers are VERIFIED FACTS about the process — always act on them with confidence 0.85
- If the answer describes a new path from an existing gateway, create the missing nodes AND connect them

PROPERTY EXTRACTION RULES — Fill properties when information is mentioned:
- "esto tarda como 2 días" → slaValue: 2, slaUnit: "days"
- "lo hacen en SAP" → systems: ["SAP"]
- "necesitan la orden de compra y la factura" → inputs: ["Orden de compra", "Factura"]
- "de ahí sale el comprobante de pago" → outputs: ["Comprobante de pago"]
- "eso lo hace la María de Contabilidad" → responsable: "María (Contabilidad)"
- "se hace cada vez que llega una factura" → frequency: "per_event"
- "lo revisan mensualmente" → frequency: "monthly"
- "toma como 30 minutos" → estimatedDuration: 30
- "cuesta como 500 pesos por factura" → costPerExecution: 500, costCurrency: "MXN"
- "primero verifican que el RFC coincida, luego revisan los montos" → description: "Verificar que el RFC coincida con el proveedor registrado, luego revisar que los montos sean correctos"
- ONLY include properties that were ACTUALLY MENTIONED — do not guess
- properties is OPTIONAL — omit entirely if no relevant info was mentioned for that node

EXTRACTION RULES:
- ONLY output nodes for process steps that are NOT already in the current diagram
- If no new steps are mentioned AND no consultant instructions, return {"newNodes": [], "updatedNodes": [], "outOfScope": []}
- If the conversation is off-topic (small talk, introductions), return empty arrays — BUT consultant instructions are NEVER off-topic
- Do NOT hallucinate steps that weren't discussed (except when following consultant instructions)
- If a topic is mentioned that belongs to a different process (sibling), add it to outOfScope
- confidence: High (>0.7) = explicitly described or consultant instruction. Medium (0.4-0.7) = implied. Low (<0.4) = inferred
- suggestedPattern: suggest when confidence >= 0.6 and diagram has <4 nodes

NODE QUALITY RULES (STRICT):
- NEVER create a node without a meaningful label. "Sí", "No", "Si", "No aplica" are NOT valid node labels — these are gateway condition labels, use connectTo with the correct target instead
- Every node MUST have a label that describes an ACTION (verb + noun) for tasks, or a QUESTION for gateways
- Do NOT duplicate existing nodes — check the current diagram carefully before creating new ones
- If a step already exists with a similar name, update it instead of creating a new one
- Gateway paths ("Sí"/"No") are connection labels, NOT separate nodes`;

/**
 * Build the context-enhanced system prompt.
 * Appends business context to the base system prompt when available.
 */
export function buildExtractionSystemPrompt(
  context?: SessionContext,
): string {
  return PROCESS_EXTRACTION_SYSTEM + buildContextBlock(context);
}

export const PROCESS_EXTRACTION_USER = (
  currentNodes: Array<{
    id: string;
    type: string;
    label: string;
    lane?: string;
  }>,
  recentTranscript: string,
  context?: SessionContext,
) => {
  const nodesDescription =
    currentNodes.length > 0
      ? `Current diagram nodes:\n${currentNodes.map((n) => `- ${n.id}: [${n.type}] "${n.label}" (${n.lane || "unassigned"})`).join("\n")}`
      : "Current diagram: empty (no nodes yet)";

  let contextHint = "";
  if (context?.targetProcess) {
    contextHint = `\nFocus: Extract steps for the "${context.targetProcess.name}" process only.`;
  }

  return `${nodesDescription}

Recent transcript:
${recentTranscript}

Extract any NEW process steps from this transcript that are not already in the diagram.${contextHint}`;
};
