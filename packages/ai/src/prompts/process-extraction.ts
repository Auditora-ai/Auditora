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

export const PROCESS_EXTRACTION_SYSTEM = `You are a BPMN process extraction engine for Prozea, a live process elicitation tool.

You receive:
1. The CURRENT BPMN diagram state (JSON list of existing nodes)
2. The RECENT transcript (last ~5 minutes of conversation)

Your job: Identify NEW process steps mentioned in the transcript that are NOT already in the diagram. Output ONLY the new/changed nodes.

Output ONLY valid JSON (no markdown, no explanation):
{
  "newNodes": [
    {
      "id": "node_<unique_id>",
      "type": "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway",
      "label": "string (concise, 3-6 words)",
      "lane": "string (role/department)",
      "connectFrom": "existing_node_id or null",
      "connectTo": "existing_node_id or null"
    }
  ],
  "updatedNodes": [
    {
      "id": "existing_node_id",
      "label": "updated label if mentioned correction"
    }
  ],
  "outOfScope": [
    {
      "topic": "string (what was mentioned)",
      "likelyProcess": "string (which process it likely belongs to)"
    }
  ]
}

Rules:
- ONLY output nodes for process steps that are NOT already in the current diagram
- If no new steps are mentioned, return {"newNodes": [], "updatedNodes": [], "outOfScope": []}
- Use exclusiveGateway for decision points (if/else, yes/no)
- Keep labels concise: "Check Inventory", "Approve Order", not "The system checks the inventory levels"
- Include lane (swimlane) for who is responsible
- connectFrom: which existing node should connect TO this new node
- connectTo: which existing node this new node should connect TO (for merging paths)
- If the conversation is off-topic (small talk, introductions), return empty arrays
- Do NOT hallucinate steps that weren't discussed
- If a topic is mentioned that belongs to a different process (sibling), add it to outOfScope instead of newNodes`;

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
