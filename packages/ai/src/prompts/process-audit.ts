/**
 * Process Audit Prompts
 *
 * Used by the Process Intelligence system to audit process knowledge,
 * identify gaps, contradictions, and generate prioritized questions.
 * Supports initial (full) and incremental (delta) modes.
 *
 * Pipeline flow:
 *   KNOWLEDGE SNAPSHOT + NEW DATA -> LLM -> DELTA (gaps, resolutions, patch)
 */

export const PROCESS_AUDIT_SYSTEM = `Eres un auditor experto en BPM (Business Process Management). Tu trabajo es analizar todo lo que se sabe sobre un proceso de negocio y encontrar:

1. GAPS de lógica: pasos sin caminos de excepción, decisiones sin criterios, triggers indefinidos
2. CONTRADICCIONES: información conflictiva entre sesiones o fuentes
3. INFORMACIÓN FALTANTE: roles sin responsabilidades, actividades sin sistema/aplicación, pasos sin tiempos o volúmenes
4. CONEXIONES INTER-PROCESO: outputs que son triggers de otros procesos, sistemas compartidos

Recibes:
- KNOWLEDGE SNAPSHOT: lo que ya sabemos del proceso (estructura compacta)
- NEW DATA: información nueva desde la última auditoría
- OPEN ITEMS: preguntas abiertas que podrían haberse resuelto con la nueva data

Tu respuesta debe ser un JSON con SOLO los cambios (DELTA):
{
  "snapshotPatch": {
    // Solo las dimensiones que cambiaron. Merge con el snapshot existente.
    // Dimensiones: roles, triggers, steps, decisions, exceptions, outputs, systems, formats, slas, volumetrics, costs, interProcessLinks, contradictions
  },
  "updatedScores": {
    // Scores de confianza actualizados (0.0-1.0) por dimensión
    "roles": 0.7, "triggers": 0.9, "steps": 0.6, "decisions": 0.3,
    "exceptions": 0.1, "outputs": 0.8, "systems": 0.2, "formats": 0.1,
    "slas": 0.0, "volumetrics": 0.0, "costs": 0.0, "interProcessLinks": 0.3
  },
  "completenessScore": 47,  // 0-100 overall
  "newGaps": [
    {
      "category": "MISSING_EXCEPTION",  // MUST be one of: MISSING_PATH, MISSING_ROLE, MISSING_EXCEPTION, MISSING_DECISION, MISSING_TRIGGER, MISSING_OUTPUT, CONTRADICTION, UNCLEAR_HANDOFF, MISSING_SLA, MISSING_SYSTEM, GENERAL_GAP
      "question": "¿Qué pasa cuando el pedido es rechazado por calidad?",
      "context": "Los pasos 4-5 mencionan revisión de calidad pero no hay camino de rechazo definido",
      "priority": 85,
      "dependsOn": ["steps"]  // categorías de las que depende esta pregunta
    }
  ],
  "resolvedGapIds": ["item_id_1", "item_id_2"],  // IDs de items abiertos que la nueva data resuelve
  "crossProcessGaps": [
    {
      "pattern": "Falta manejo de excepciones para rechazos",
      "affectedProcesses": ["Compras", "Ventas", "Calidad"],
      "suggestedAction": "Definir política organizacional de manejo de rechazos"
    }
  ],
  "contradictions": [
    {
      "topic": "Aprobador de gastos >$10K",
      "existingClaim": "El gerente aprueba (sesión #1)",
      "newClaim": "El director aprueba (respuesta del cliente)",
      "source": "client_answer"
    }
  ],
  "followUpSuggestion": {
    "shouldSchedule": true,
    "focusAreas": ["Exception handling", "Roles y responsabilidades"],
    "estimatedDuration": "30 min",
    "unresolved": 8
  }
}

Reglas:
- Para procesos con >30% completeness: SOLO reporta gaps donde hay EVIDENCIA de que algo falta. No inventes escenarios hipotéticos.
- Para procesos con <=30% completeness o con dimensiones completamente vacías: genera preguntas fundamentales sobre las dimensiones faltantes. La AUSENCIA total de información en una dimensión ES evidencia suficiente para preguntar.
- Para cada gap, indica el CONTEXTO: qué evidencia sugiere que falta información.
- Ordena gaps por DEPENDENCIA lógica: triggers antes que excepciones, roles antes que handoffs, steps antes que SLAs.
- Los scores de confianza reflejan qué tan completa está cada dimensión, NO qué tan seguros estamos.
- Para SISTEMAS y FORMATOS: pregunta específicamente qué sistema/app se usa en cada actividad y qué documentos se producen o consumen.
- Para VOLUMETRÍA y COSTOS: solo pregunta si la estructura del proceso ya está >50% completa.
- Las preguntas deben ser en ESPAÑOL, específicas y respondibles en una oración.
- Si el snapshot está vacío y el proceso tiene nombre reconocible, sugiere estructura estándar de la industria.
- followUpSuggestion.shouldSchedule = true cuando hay >5 gaps de alta prioridad después de 2+ auditorías.
- Si se proporciona un MAPA DE ELEMENTOS BPMN, asocia cada gap a un elementRef específico cuando sea posible.
  El elementRef es una referencia estable con formato "nombre|tipo|lane" (ej: "Revisar pedido|bpmn:Task|Ventas").
  Incluye el campo "elementRef" en cada gap del array newGaps.
  Si un gap es de nivel proceso (no asociable a un elemento específico), deja elementRef como null.`;

export const PROCESS_AUDIT_INITIAL_ADDENDUM = `
MODO INICIAL: Esta es la PRIMERA auditoría de este proceso. Analiza TODA la información disponible y genera el knowledge snapshot completo.

Si el proceso NO tiene datos (sin sesiones, sin BPMN, sin chat):
- Basándote en el nombre del proceso y la industria, propone una estructura estándar
- Genera preguntas iniciales básicas para empezar a descubrir el proceso
- Incluye un "initialDesign" en tu respuesta:
  {
    "initialDesign": {
      "templateName": "Nombre de la plantilla industrial",
      "suggestedSteps": [
        {"label": "Recibir solicitud", "type": "startEvent", "lane": "Solicitante"},
        {"label": "Revisar requisitos", "type": "task", "lane": "Analista"}
      ],
      "starterQuestions": [
        {"question": "¿Quién inicia este proceso?", "category": "MISSING_TRIGGER", "priority": 90},
        {"question": "¿Cuál es el resultado final esperado?", "category": "MISSING_OUTPUT", "priority": 85}
      ]
    }
  }`;

export const PROCESS_AUDIT_INCREMENTAL_ADDENDUM = `
MODO INCREMENTAL: Ya existe un knowledge snapshot. Analiza SOLO la nueva información y retorna los CAMBIOS:
- snapshotPatch: solo las dimensiones que necesitan actualizarse
- newGaps: solo gaps NUEVOS que la información nueva revela
- resolvedGapIds: IDs de gaps abiertos que la nueva información resuelve
- NO repitas gaps que ya existen como items abiertos`;

export const PROCESS_AUDIT_USER = (
  processDefinition: {
    name: string;
    description?: string;
    level: string;
    goals: string[];
    triggers: string[];
    outputs: string[];
    owner?: string;
    bpmnNodeCount: number;
    confirmedNodeCount: number;
  },
  knowledgeSnapshot: Record<string, unknown>,
  newData: Record<string, unknown>,
  organizationContext?: {
    industry?: string;
    siblingProcessNames: string[];
    siblingGapSummary?: Array<{ processName: string; topGaps: string[] }>;
  },
  existingOpenItems?: Array<{ id: string; question: string; category: string }>,
  elementMap?: Array<{ elementRef: string; label: string; type: string; lane?: string }>,
  bpmnSummary?: string,
  isSparseProcess?: boolean,
) => {
  const parts: string[] = [];

  // Process definition
  const defParts: string[] = [
    `Nombre: ${processDefinition.name}`,
    `Nivel: ${processDefinition.level}`,
  ];
  if (processDefinition.description) {
    defParts.push(`Descripción: ${processDefinition.description}`);
  }
  if (processDefinition.owner) {
    defParts.push(`Dueño: ${processDefinition.owner}`);
  }
  if (processDefinition.goals.length > 0) {
    defParts.push(`Objetivos: ${processDefinition.goals.join(", ")}`);
  }
  if (processDefinition.triggers.length > 0) {
    defParts.push(`Triggers: ${processDefinition.triggers.join(", ")}`);
  }
  if (processDefinition.outputs.length > 0) {
    defParts.push(`Outputs: ${processDefinition.outputs.join(", ")}`);
  }
  defParts.push(
    `Nodos BPMN: ${processDefinition.bpmnNodeCount} total, ${processDefinition.confirmedNodeCount} confirmados`,
  );
  parts.push(`PROCESO:\n${defParts.join("\n")}`);

  // BPMN diagram summary
  if (bpmnSummary) {
    parts.push(`DIAGRAMA BPMN ACTUAL:\n${bpmnSummary}`);
  }

  // Organization context
  if (organizationContext) {
    const orgParts: string[] = [];
    if (organizationContext.industry) {
      orgParts.push(`Industria: ${organizationContext.industry}`);
    }
    if (organizationContext.siblingProcessNames.length > 0) {
      orgParts.push(
        `Procesos hermanos: ${organizationContext.siblingProcessNames.join(", ")}`,
      );
    }
    if (
      organizationContext.siblingGapSummary &&
      organizationContext.siblingGapSummary.length > 0
    ) {
      const siblingGaps = organizationContext.siblingGapSummary
        .slice(0, 10)
        .map(
          (s) =>
            `  - ${s.processName}: ${s.topGaps.slice(0, 3).join("; ")}`,
        )
        .join("\n");
      orgParts.push(
        `Gaps de procesos hermanos (para correlación cruzada):\n${siblingGaps}`,
      );
    }
    if (orgParts.length > 0) {
      parts.push(`CONTEXTO ORGANIZACIONAL:\n${orgParts.join("\n")}`);
    }
  }

  // Knowledge snapshot
  const snapshotStr = JSON.stringify(knowledgeSnapshot);
  if (snapshotStr !== "{}" && snapshotStr !== "null") {
    parts.push(`KNOWLEDGE SNAPSHOT (lo que ya sabemos):\n${snapshotStr}`);
  } else {
    parts.push("KNOWLEDGE SNAPSHOT: (vacío — primera auditoría)");
  }

  // New data
  const newDataStr = JSON.stringify(newData);
  if (newDataStr !== "{}" && newDataStr !== "null") {
    parts.push(`NUEVA INFORMACIÓN:\n${newDataStr}`);
  }

  // Existing open items
  if (existingOpenItems && existingOpenItems.length > 0) {
    const itemsList = existingOpenItems
      .map((item) => `  - [${item.id}] (${item.category}) ${item.question}`)
      .join("\n");
    parts.push(
      `PREGUNTAS ABIERTAS (verifica si la nueva información las resuelve):\n${itemsList}`,
    );
  }

  // Element map for element-level insights
  if (elementMap && elementMap.length > 0) {
    const mapList = elementMap
      .map((el) => `  - ${el.elementRef} → "${el.label}" (${el.type}${el.lane ? `, lane: ${el.lane}` : ""})`)
      .join("\n");
    parts.push(
      `MAPA DE ELEMENTOS BPMN (usa elementRef para asociar gaps a elementos específicos):\n${mapList}`,
    );
  }

  if (isSparseProcess) {
    parts.push(
      `INSTRUCCIÓN ESPECIAL — PROCESO ESCASO:
Este proceso tiene muy poca información documentada. Genera preguntas fundamentales para las dimensiones que están completamente vacías.
Para cada dimensión del knowledge snapshot que esté vacía (roles, triggers, steps, decisions, exceptions, outputs, systems, formats), genera al menos 1 pregunta específica en "newGaps".
Incluye también un "initialDesign" con "starterQuestions" que cubran las dimensiones faltantes.
No necesitas evidencia adicional — la ausencia total de información en una dimensión ES la evidencia.`,
    );
  }

  return parts.join("\n\n");
};
