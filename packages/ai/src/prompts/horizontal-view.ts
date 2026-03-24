/**
 * Horizontal View (End-to-End Cross-Departmental) Prompts
 *
 * Generates a horizontal process flow showing how a process crosses
 * department boundaries from trigger to completion. Shows handoffs,
 * pain points, and departmental responsibilities.
 */

export const HORIZONTAL_VIEW_SYSTEM = `You are a senior BPM consultant generating a Horizontal View (Vista Horizontal) — an end-to-end cross-departmental process flow.

The horizontal view shows how a process flows from LEFT to RIGHT across organizational departments (shown as horizontal swimlanes). Each department has steps, and HANDOFFS between departments are the critical points.

This deliverable answers: "How does work flow across the organization for this process? Where are the handoffs? Where are the bottlenecks?"

Return JSON:
{
  "flowName": "End-to-end flow name",
  "flowDescription": "What this flow achieves",
  "triggerEvent": "What starts this flow",
  "endEvent": "What marks completion",
  "departments": [
    {
      "name": "Department name",
      "role": "Primary role in this department for this flow",
      "stepsInLane": [0, 3, 7]
    }
  ],
  "steps": [
    {
      "processName": "Which L1 process this step belongs to",
      "department": "Department that executes this step",
      "action": "What happens in this step",
      "inputs": ["What this step receives"],
      "outputs": ["What this step produces"],
      "systems": ["Systems/tools used"],
      "orderIndex": 0
    }
  ],
  "handoffs": [
    {
      "fromStep": 0,
      "toStep": 1,
      "description": "What gets passed between departments",
      "handoffType": "document|system|verbal|approval",
      "painPoint": "Known issue with this handoff (optional)"
    }
  ],
  "totalDepartments": count,
  "totalHandoffs": count of cross-department handoffs,
  "criticalPath": [0, 1, 3, 5, 7],
  "painPoints": ["Cross-cutting issues identified"],
  "recommendations": ["How to improve cross-departmental flow"],
  "overallConfidence": 0.0-1.0
}

Rules:
- Steps must flow LEFT to RIGHT chronologically (orderIndex 0, 1, 2...)
- Each department appears as a horizontal lane
- HANDOFFS only when work crosses department boundaries
- Identify pain points at handoff points (delays, lost information, manual re-entry)
- criticalPath is the sequence of steps that determines total throughput time
- Systems should be specific (not "the system" but "SAP MM", "email", etc.)
- Output in the SAME LANGUAGE as the input context`;

export const HORIZONTAL_VIEW_USER = (context: {
  orgName: string;
  targetFlow?: string; // Specific flow to visualize, or auto-detect
  processLinks: Array<{
    fromProcess: string;
    toProcess: string;
    linkType: string;
    description?: string;
  }>;
  processDefinitions: Array<{
    name: string;
    description?: string;
    owner?: string;
    triggers: string[];
    outputs: string[];
  }>;
  roles?: Array<{ name: string; department?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  transcriptExcerpts?: string[];
}) => {
  const parts: string[] = [];

  parts.push(`ORGANIZATION: ${context.orgName}`);

  if (context.targetFlow) {
    parts.push(`\nTARGET FLOW: Generate the horizontal view for "${context.targetFlow}"`);
  } else {
    parts.push(`\nTARGET: Generate the horizontal view for the MAIN value stream (the core end-to-end flow that delivers value to the customer)`);
  }

  if (context.processLinks.length > 0) {
    parts.push(`\nPROCESS LINKS (how processes connect):\n${context.processLinks.map((l) => `- ${l.fromProcess} --[${l.linkType}]--> ${l.toProcess}${l.description ? `: ${l.description}` : ""}`).join("\n")}`);
  }

  if (context.processDefinitions.length > 0) {
    parts.push(`\nPROCESSES:\n${context.processDefinitions.map((p) => {
      const parts: string[] = [`- ${p.name}`];
      if (p.owner) parts.push(`  Owner: ${p.owner}`);
      if (p.triggers.length) parts.push(`  Triggers: ${p.triggers.join(", ")}`);
      if (p.outputs.length) parts.push(`  Outputs: ${p.outputs.join(", ")}`);
      if (p.description) parts.push(`  ${p.description}`);
      return parts.join("\n");
    }).join("\n")}`);
  }

  if (context.roles && context.roles.length > 0) {
    parts.push(`\nROLES:\n${context.roles.map((r) => `- ${r.name}${r.department ? ` (${r.department})` : ""}`).join("\n")}`);
  }

  if (context.systems && context.systems.length > 0) {
    parts.push(`\nSYSTEMS:\n${context.systems.map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`).join("\n")}`);
  }

  if (context.transcriptExcerpts && context.transcriptExcerpts.length > 0) {
    parts.push(`\nRELEVANT EXCERPTS:\n${context.transcriptExcerpts.join("\n---\n")}`);
  }

  return `${parts.join("\n")}

Generate a detailed Horizontal View showing the end-to-end cross-departmental flow with handoffs, pain points, and recommendations.`;
};
