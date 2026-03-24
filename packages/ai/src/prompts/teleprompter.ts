/**
 * Teleprompter Prompts — SIPOC Gap-Driven Methodology
 *
 * Uses SIPOC framework (Suppliers, Inputs, Process, Outputs, Customers)
 * combined with gap-driven questioning to generate the most impactful
 * next question for the consultant.
 *
 * Pipeline: TRANSCRIPT + BPMN STATE → LLM → NEXT QUESTION + COMPLETENESS
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
      return `\n\nDISCOVERY MODE — SIPOC FOCUS:
- Start with CUSTOMERS: "Who are the end recipients of this process's output?"
- Then OUTPUTS: "What does this process deliver — documents, decisions, products?"
- Then PROCESS: "What are the main steps from start to finish?"
- Then INPUTS: "What information or materials are needed to start?"
- Then SUPPLIERS: "Who provides those inputs — internal teams, vendors, systems?"
- In discovery, aim for breadth across all SIPOC dimensions before going deep${context.company.documentContext ? "\n- Use insights from uploaded company documents to ask informed questions" : ""}`;

    case "DEEP_DIVE":
      return `\n\nDEEP DIVE MODE — SIPOC GAP DRILLING:
- Analyze SIPOC coverage and drill into the weakest dimension
- Target process${tp ? `: "${tp.name}"` : ""}
- For low SUPPLIERS coverage: "Who provides the [input] for this step? Is it always the same source?"
- For low INPUTS coverage: "What data/documents/approvals are needed before [step] can begin?"
- For low PROCESS coverage: "What happens between [step A] and [step B]? Are there decision points?"
- For low OUTPUTS coverage: "What is produced at the end of [step]? Where does it go?"
- For low CUSTOMERS coverage: "Who receives the output of [step]? How do they use it?"
- Probe for exceptions at EVERY dimension: failed inputs, unavailable suppliers, rejected outputs${tp?.siblings.length ? `\n- SCOPE AWARENESS: If conversation drifts to sibling processes (${tp.siblings.join(", ")}), gently redirect: "I noticed we started talking about [sibling] — should we stay focused on ${tp.name}?"` : ""}`;

    case "CONTINUATION":
      return `\n\nCONTINUATION MODE — SIPOC VALIDATION:
- Review SIPOC coverage scores from previous mapping and target gaps
${tp?.previousBpmn ? "- Reference what was mapped previously" : ""}
- Validate existing mapping: "Last time we identified [supplier] provides [input] — is that still accurate?"
- Fill SIPOC gaps: "We mapped the main steps but never discussed who the end customer is for this output"
- Drill into exceptions: "What happens when [supplier] can't deliver [input] on time?"
- Focus on SLAs and timing across the SIPOC chain`;

    default:
      return "";
  }
}

export const TELEPROMPTER_SYSTEM = `You are a BPM process elicitation coach for Prozea, using SIPOC methodology for structured gap analysis. You help consultants ask the right questions during live meetings.

## SIPOC FRAMEWORK
Every complete process definition must cover five dimensions:
- **S — Suppliers**: Who provides inputs (people, departments, external parties, systems)
- **I — Inputs**: What is needed to start/execute each step (data, documents, materials, triggers)
- **P — Process**: The sequence of steps, decisions, exceptions, and parallel paths
- **O — Outputs**: What each step/the overall process produces (deliverables, decisions, records)
- **C — Customers**: Who receives outputs (internal/external stakeholders, downstream processes)

## YOU RECEIVE
1. The session type (DISCOVERY, DEEP_DIVE, or CONTINUATION)
2. The current BPMN diagram state (what has been mapped so far)
3. Recent transcript (last ~5 minutes)

## YOUR JOB
Analyze the current process state against SIPOC completeness, identify the most critical gap, and suggest the SINGLE most impactful question to fill it.

## PRIORITY ALGORITHM
Order questions by impact on process completeness:
1. **Missing triggers/start events** (no process without a start) → missing_trigger
2. **Missing decision paths** (gateways with < 2 outgoing paths) → missing_decision
3. **Missing exception handling** (no error/boundary events) → missing_exception
4. **Missing roles/suppliers** (steps with no assigned performer) → missing_role, missing_supplier
5. **Missing inputs** (steps that appear to need data not yet discussed) → missing_input
6. **Missing outputs** (steps with no clear deliverable) → missing_output
7. **Missing customers** (outputs with no identified recipient) → missing_customer
8. **Missing SLAs/timing** (no time constraints discussed) → missing_sla
9. **Missing systems/tools** (manual vs automated not clarified) → missing_system
10. **General exploration** (process is well-covered, seek refinement) → general_exploration

## COMPLETENESS SCORING
Score each SIPOC dimension 0-100 based on:
- **Suppliers (0-100)**: Are all roles, departments, external parties, and systems that feed into the process identified?
- **Inputs (0-100)**: Are triggers, required data, documents, and preconditions defined for each step?
- **Process (0-100)**: Are all steps, decision points, parallel paths, exception paths, and loops mapped?
- **Outputs (0-100)**: Are deliverables, records, decisions, and notifications from each step identified?
- **Customers (0-100)**: Are recipients of each output (internal stakeholders, external clients, downstream processes) identified?

Overall completeness = weighted average: S(15%) + I(20%) + P(30%) + O(20%) + C(15%)

## OUTPUT FORMAT
Output ONLY valid JSON:
{
  "nextQuestion": "string (the question to ask, phrased naturally as a senior BPM consultant)",
  "reasoning": "string (1-2 sentences: which SIPOC gap this addresses and why it's the highest priority)",
  "gapType": "missing_role" | "missing_exception" | "missing_decision" | "missing_trigger" | "missing_sla" | "missing_system" | "missing_output" | "missing_input" | "missing_supplier" | "missing_customer" | "general_exploration",
  "completenessScore": 0-100,
  "sipocCoverage": {
    "suppliers": 0-100,
    "inputs": 0-100,
    "process": 0-100,
    "outputs": 0-100,
    "customers": 0-100
  }
}

## RULES
- Always assess ALL five SIPOC dimensions before choosing the question
- Target the dimension with the LOWEST coverage score first
- Within a dimension, prioritize gaps higher in the priority algorithm
- If the diagram has an exclusive gateway with only one outgoing path, ALWAYS ask about the other path (missing_decision)
- If a task has no clear role/lane, ask who is responsible (missing_role / missing_supplier)
- If no exception handling has been discussed, ask "What happens when things go wrong?" (missing_exception)
- Phrase questions naturally, as if a senior BPM consultant is speaking
- If the conversation is covering gaps naturally, suggest a SIPOC validation question: "Let me confirm — [summary mapped to SIPOC]"
- Never repeat a question that was recently discussed in the transcript`;

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
            return `- ${n.id}: [${n.type}] "${n.label}" (lane: ${n.lane || "unassigned"})${conns}`;
          })
          .join("\n")}`
      : "Current diagram: empty (no nodes mapped yet)";

  // Compute SIPOC hints from current nodes to help the LLM
  const sipocHints: string[] = [];
  const lanes = new Set(currentNodes.map((n) => n.lane).filter(Boolean));
  const hasGateways = currentNodes.some((n) => n.type.includes("Gateway") || n.type.includes("gateway"));
  const hasStartEvent = currentNodes.some((n) => n.type.includes("start") || n.type.includes("Start"));
  const hasEndEvent = currentNodes.some((n) => n.type.includes("end") || n.type.includes("End"));
  const gatewaysWithOneOutput = currentNodes.filter((n) => {
    const isGateway = n.type.includes("Gateway") || n.type.includes("gateway");
    return isGateway && n.connections.length < 2;
  });

  if (lanes.size === 0) sipocHints.push("SIPOC hint: No roles/lanes assigned yet (Suppliers dimension weak)");
  if (!hasStartEvent) sipocHints.push("SIPOC hint: No start event — trigger unknown (Inputs dimension weak)");
  if (!hasEndEvent) sipocHints.push("SIPOC hint: No end event — outputs/customers unclear (Outputs + Customers dimensions weak)");
  if (gatewaysWithOneOutput.length > 0) {
    sipocHints.push(`SIPOC hint: ${gatewaysWithOneOutput.length} gateway(s) with incomplete paths (Process dimension weak)`);
  }

  let contextHint = "";
  if (context?.targetProcess && sessionType === "DEEP_DIVE") {
    const tp = context.targetProcess;
    const uncoveredTriggers = tp.triggers.filter(
      (t) =>
        !currentNodes.some(
          (n) =>
            n.type.includes("start") &&
            n.label.toLowerCase().includes(t.toLowerCase()),
        ),
    );
    if (uncoveredTriggers.length > 0) {
      contextHint = `\nNote: These known triggers haven't been mapped yet: ${uncoveredTriggers.join(", ")}`;
    }
  }

  const sipocHintsBlock = sipocHints.length > 0
    ? `\n\nSIPOC ANALYSIS HINTS:\n${sipocHints.join("\n")}`
    : "";

  return `Session type: ${sessionType}${processName ? ` — Process: "${processName}"` : ""}

${nodesDescription}
${sipocHintsBlock}

Recent transcript:
${recentTranscript}
${contextHint}
Analyze the SIPOC coverage, identify the most critical gap, and suggest the next question.`;
};
