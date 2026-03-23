/**
 * Teleprompter Prompts
 *
 * Generates contextual guided questions for the consultant based on
 * the conversation transcript and current BPMN diagram state.
 *
 * Pipeline: TRANSCRIPT + BPMN STATE → LLM → NEXT QUESTION
 * Runs on separate pipeline from process extraction (parallel).
 * Latency tolerance: 15-20s (higher than extraction's 8s).
 */

import type { SessionContext } from "../context/session-context";

/**
 * Build context-specific teleprompter instructions based on session type.
 */
function buildTeleprompterContextBlock(context?: SessionContext): string {
  if (!context) return "";

  const parts: string[] = [];

  // Company context
  if (context.company.name) {
    const companyLine = `Company: ${context.company.name}${context.company.industry ? ` (${context.company.industry})` : ""}`;
    parts.push(companyLine);
  }
  if (context.company.operationsProfile) {
    parts.push(
      `Operations profile: ${context.company.operationsProfile.substring(0, 500)}`,
    );
  }

  // Business model context
  if (context.company.businessModel) {
    parts.push(`Business model: ${context.company.businessModel.substring(0, 500)}`);
  }

  // Document context (brief)
  if (context.company.documentContext) {
    parts.push(
      `Key company info:\n${context.company.documentContext.substring(0, 800)}`,
    );
  }

  // Target process
  if (context.targetProcess) {
    const tp = context.targetProcess;
    const tpParts: string[] = [];
    tpParts.push(`Target process: "${tp.name}" (${tp.level})`);
    if (tp.description) tpParts.push(`Description: ${tp.description}`);
    if (tp.triggers.length > 0)
      tpParts.push(`Known triggers: ${tp.triggers.join(", ")}`);
    if (tp.outputs.length > 0)
      tpParts.push(`Expected outputs: ${tp.outputs.join(", ")}`);
    if (tp.goals.length > 0)
      tpParts.push(`Process goals: ${tp.goals.join(", ")}`);
    if (tp.siblings.length > 0)
      tpParts.push(`Sibling processes: ${tp.siblings.join(", ")}`);
    parts.push(tpParts.join("\n"));
  }

  // Architecture overview
  if (context.architecture.processes.length > 0) {
    const archSummary = context.architecture.processes
      .slice(0, 10)
      .map((p) => `${p.name} (${p.status})`)
      .join(", ");
    parts.push(`Known processes: ${archSummary}`);
  }

  // Continuation context
  if (
    context.sessionType === "CONTINUATION" &&
    context.targetProcess?.previousTranscriptSummary
  ) {
    parts.push(
      `Previous session notes:\n${context.targetProcess.previousTranscriptSummary.substring(0, 800)}`,
    );
  }

  // Intelligence gaps (from Process Intelligence system)
  if (context.intelligence && context.intelligence.openItems.length > 0) {
    const gapLines = context.intelligence.openItems
      .map((item) => {
        const priorityLabel =
          item.priority >= 70 ? "HIGH" : item.priority >= 40 ? "MED" : "LOW";
        return `- [${priorityLabel}] ${item.category}: ${item.question}`;
      })
      .join("\n");
    parts.push(
      `KNOWN INTELLIGENCE GAPS (prioritize these — identified from previous sessions):\n${gapLines}\nProcess completeness: ${context.intelligence.completenessScore}%`,
    );
  }

  return parts.length > 0
    ? `\n\nBUSINESS CONTEXT:\n${parts.join("\n\n")}`
    : "";
}

/**
 * Build session-type-specific question guidance.
 */
function buildSessionTypeGuidance(context?: SessionContext): string {
  if (!context) return "";

  const tp = context.targetProcess;

  switch (context.sessionType) {
    case "DISCOVERY":
      return `\n\nDISCOVERY MODE GUIDANCE:
- Ask about business model, departments, process ownership
- "What are the main departments in your organization?"
- "Who owns the [process] process?"
- Probe for L1 processes: core operations, support functions, management processes
- Seek to understand organizational structure and key roles${context.company.documentContext ? "\n- Use insights from uploaded company documents to ask informed questions" : ""}`;

    case "DEEP_DIVE":
      return `\n\nDEEP DIVE MODE GUIDANCE:
- Ask questions specific to the target process${tp ? ` ("${tp.name}")` : ""}
- Probe for: triggers, steps, decisions, exceptions, roles, outputs
- "What triggers ${tp ? `the ${tp.name} process` : "this process"}?"
- "What happens when [node] fails?"
- "Who is responsible for this step?"${tp?.siblings.length ? `\n- SCOPE AWARENESS: If conversation drifts to sibling processes (${tp.siblings.join(", ")}), gently redirect: "I noticed we started talking about [sibling] — should we stay focused on ${tp.name}?"` : ""}
- Focus on uncovered exception paths and edge cases
- Ask about SLAs, timing, and performance expectations`;

    case "CONTINUATION":
      return `\n\nCONTINUATION MODE GUIDANCE:
- This is a follow-up session — verify and extend previous mapping
${tp?.previousBpmn ? "- Reference what was mapped previously" : ""}
- "Last time we mapped [nodes]. Are there any steps we missed?"
- "Let's verify the [node] step — is this still accurate?"
- Focus on gaps, corrections, and deeper detail on previously identified steps
- Ask about changes since the last session`;

    default:
      return "";
  }
}

export const TELEPROMPTER_SYSTEM = `You are a BPM process elicitation coach for Prozea. You help consultants ask the right questions during live meetings.

You receive:
1. The session type (DISCOVERY, DEEP_DIVE, or CONTINUATION)
2. The current BPMN diagram state (what has been mapped so far)
3. Recent transcript (last ~5 minutes)

Your job: Suggest the SINGLE most important question the consultant should ask next.

Output ONLY valid JSON:
{
  "nextQuestion": "string (the question to ask, phrased naturally)",
  "reasoning": "string (1 sentence explaining why this question matters)",
  "gapType": "missing_path" | "missing_role" | "missing_exception" | "missing_decision" | "missing_trigger" | "missing_output" | "general_exploration",
  "confidence": 0.0-1.0
}

Rules:
- Focus on GAPS in the process: uncovered paths, missing exception handling, undefined roles, unclear triggers
- For DISCOVERY sessions: focus on broad exploration — "What are your main business areas?"
- For DEEP_DIVE sessions: focus on specific process details — "What happens if the order is rejected?"
- For CONTINUATION sessions: focus on verification and gaps — "Last time we identified X. Is this still accurate?"
- If the diagram has an exclusive gateway with only one outgoing path, ASK ABOUT THE OTHER PATH
- If a task has no clear role/lane, ask who is responsible
- If no exception handling has been discussed, ask "What happens when things go wrong?"
- Phrase questions naturally, as if a senior consultant is speaking
- If the conversation is going well and covering gaps naturally, suggest a validation question: "Let me confirm — [summary of what I understood]"`;

/**
 * Build the context-enhanced system prompt for the teleprompter.
 */
export function buildTeleprompterSystemPrompt(
  context?: SessionContext,
): string {
  return (
    TELEPROMPTER_SYSTEM +
    buildTeleprompterContextBlock(context) +
    buildSessionTypeGuidance(context)
  );
}

export const TELEPROMPTER_USER = (
  sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
  currentNodes: Array<{
    id: string;
    type: string;
    label: string;
    lane?: string;
    connections: string[];
  }>,
  recentTranscript: string,
  processName?: string,
  context?: SessionContext,
) => {
  const nodesDescription =
    currentNodes.length > 0
      ? `Current diagram (${currentNodes.length} nodes):\n${currentNodes
          .map((n) => {
            const conns =
              n.connections.length > 0
                ? ` -> ${n.connections.join(", ")}`
                : "";
            return `- ${n.id}: [${n.type}] "${n.label}" (${n.lane || "??"})${conns}`;
          })
          .join("\n")}`
      : "Current diagram: empty";

  let contextHint = "";
  if (context?.targetProcess && sessionType === "DEEP_DIVE") {
    const tp = context.targetProcess;
    const uncoveredTriggers = tp.triggers.filter(
      (t) =>
        !currentNodes.some(
          (n) =>
            n.type === "startEvent" &&
            n.label.toLowerCase().includes(t.toLowerCase()),
        ),
    );
    if (uncoveredTriggers.length > 0) {
      contextHint = `\nNote: These known triggers haven't been mapped yet: ${uncoveredTriggers.join(", ")}`;
    }
  }

  return `Session type: ${sessionType}${processName ? ` — Process: "${processName}"` : ""}

${nodesDescription}

Recent transcript:
${recentTranscript}
${contextHint}
What should the consultant ask next?`;
};
