/**
 * Discovery Extraction Prompts
 *
 * Used during DISCOVERY sessions to extract high-level (L1)
 * process definitions and business model insights from
 * initial conversations with stakeholders.
 *
 * Unlike process-extraction prompts which produce BPMN nodes,
 * these produce process definitions for the architecture.
 */

import type { SessionContext } from "../context/session-context";

export const DISCOVERY_EXTRACTION_SYSTEM = `You are a Business Process Management (BPM) consultant analyzing a discovery conversation.
Your job is to identify the organization's main business processes from the discussion.

Extract PROCESSES mentioned or implied in the conversation. Each process should be a major business function (L1 level).

Return JSON:
{
  "processes": [
    {
      "name": "Process Name",
      "description": "Brief description of what this process does",
      "owner": "Department or role that owns this process",
      "triggers": ["What starts this process"],
      "outputs": ["What this process produces"]
    }
  ],
  "businessInsights": {
    "industry": "Detected industry if mentioned",
    "businessModel": "Observed business model details",
    "keyRoles": ["Roles/departments mentioned"]
  }
}

Rules:
- Only include processes with enough evidence from the conversation
- Use clear, standard BPM terminology
- Don't duplicate processes with slightly different names
- Focus on L1 (top-level) processes only
- If no new processes are mentioned, return {"processes": [], "businessInsights": {}}`;

export const DISCOVERY_EXTRACTION_USER = (
  recentTranscript: string,
  existingProcesses: Array<{ name: string; description?: string }>,
  context?: SessionContext,
) => {
  let contextBlock = "";
  if (context) {
    const parts: string[] = [];
    if (context.company.name) {
      parts.push(
        `Company: ${context.company.name}${context.company.industry ? ` (${context.company.industry})` : ""}`,
      );
    }
    if (context.company.operationsProfile) {
      parts.push(`Operations: ${context.company.operationsProfile}`);
    }
    if (context.company.businessModel) {
      parts.push(`Business Model: ${context.company.businessModel}`);
    }
    if (context.company.documentContext) {
      parts.push(
        `Company documents excerpt:\n${context.company.documentContext.substring(0, 1000)}`,
      );
    }
    if (parts.length > 0) {
      contextBlock = `BUSINESS CONTEXT:\n${parts.join("\n")}\n\n`;
    }
  }

  const existingBlock =
    existingProcesses.length > 0
      ? `Already identified processes (do NOT duplicate):\n${existingProcesses.map((p) => `- ${p.name}${p.description ? `: ${p.description}` : ""}`).join("\n")}\n\n`
      : "";

  return `${contextBlock}${existingBlock}Recent transcript:
${recentTranscript}

Extract any NEW L1 business processes mentioned in this transcript.`;
};
