/**
 * Document Extraction Prompts
 *
 * Extracts L1 process definitions from uploaded documents
 * (SOPs, org charts, manuals, etc.) without a live conversation.
 */

import type { SessionContext } from "../context/session-context";

export function buildDocumentExtractionPrompt(
	existingProcessNames: string[],
	context?: SessionContext,
): string {
	const industryHint = context?.businessContext?.industry
		? `\nThe client operates in the ${context.businessContext.industry} industry.`
		: "";

	const existingList =
		existingProcessNames.length > 0
			? `\n\nExisting processes (DO NOT duplicate these):\n${existingProcessNames.map((n) => `- ${n}`).join("\n")}`
			: "";

	return `You are a senior BPM consultant extracting process information from a document.
Analyze the document text and identify business processes described or implied.

Extract L1 (top-level) process definitions. If the document describes detailed sub-steps (L2/L3),
create a single L1 process whose name matches the document topic and store the detail in the description.
Do NOT create multiple L1 records for sub-steps.${industryHint}${existingList}

Return JSON:
{
  "processes": [
    {
      "name": "Process Name",
      "description": "What this process does, including any detailed steps found",
      "category": "core" | "support" | "strategic",
      "owner": "Department or role if detectable",
      "triggers": ["What starts this process"],
      "outputs": ["What this process produces"],
      "goals": ["Objectives of this process"]
    }
  ]
}

Rules:
- Only extract processes with clear evidence in the document
- Use standard BPM terminology
- Assign category: "core" for value-creating, "support" for enabling, "strategic" for governance
- If owner is not detectable, omit the field
- Return empty processes array if document contains no process information`;
}

export const DOCUMENT_EXTRACTION_USER = (documentText: string): string =>
	`Analyze this document and extract business processes:\n\n${documentText}`;
