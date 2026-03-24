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
      "type": "startEvent" | "endEvent" | "task" | "userTask" | "serviceTask" | "exclusiveGateway" | "parallelGateway" | "intermediateEvent",
      "label": "string (see BPMN NAMING RULES below)",
      "lane": "string (role/department — consistent naming)",
      "connectFrom": "existing_node_id or null",
      "connectTo": "existing_node_id or null",
      "flowCondition": "string or null (REQUIRED for connections FROM gateways: 'Sí', 'No', condition text)",
      "confidence": 0.0-1.0
    }
  ],
  "updatedNodes": [
    {
      "id": "existing_node_id",
      "label": "updated label if mentioned correction",
      "lane": "corrected lane if responsibility changed",
      "type": "corrected type if wrong (e.g. task should be gateway)"
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

ELEMENT TYPE RULES:
- task: Generic work activity (when the system/tool is unknown)
- userTask: Activity performed by a person using a system/application
- serviceTask: Automated activity performed by a system without human intervention
- exclusiveGateway: Decision point with mutually exclusive paths (use when only ONE path is taken)
- parallelGateway: Fork/join where ALL paths execute simultaneously
- intermediateEvent: Waiting point, timer, or signal within the process
- NEVER use a task for a decision — if someone "decides", "verifies", "approves/rejects", it's a gateway

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

EXTRACTION RULES:
- ONLY output nodes for process steps that are NOT already in the current diagram
- If no new steps are mentioned, return {"newNodes": [], "updatedNodes": [], "outOfScope": []}
- If the conversation is off-topic (small talk, introductions), return empty arrays
- Do NOT hallucinate steps that weren't discussed
- If a topic is mentioned that belongs to a different process (sibling), add it to outOfScope
- confidence: High (>0.7) = explicitly described. Medium (0.4-0.7) = implied. Low (<0.4) = inferred
- suggestedPattern: suggest when confidence >= 0.6 and diagram has <4 nodes`;

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
