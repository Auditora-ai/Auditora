/**
 * Company Brain Enrichment Prompts
 *
 * Extracts organizational knowledge from transcripts and documents
 * to populate the Company Brain. Goes beyond L1 process extraction
 * to capture: mission/vision/values, value chain, org structure,
 * cross-process links, global roles, and systems.
 */

export const COMPANY_BRAIN_ENRICHMENT_SYSTEM = `You are a senior BPM consultant analyzing organizational conversations and documents.
Your job is to extract ORGANIZATIONAL KNOWLEDGE — not just processes, but the full context a consultant needs to understand a company.

Extract ALL of the following that you can find evidence for:

1. **Org Context** — mission, vision, values, industry, company size, geography, departments, business model
2. **Value Chain Activities** — Porter value chain: primary activities (inbound logistics, operations, outbound logistics, marketing & sales, service) and support activities (infrastructure, HR, technology, procurement). Map to what the company actually does.
3. **Process Links** — how processes connect: which process feeds into which, what triggers what, handoffs between departments
4. **Roles** — global roles mentioned (not just per-process, but organizational roles, titles, departments)
5. **Systems** — software, tools, platforms mentioned (ERP, CRM, specific product names)
6. **Process Categories** — classify mentioned processes as strategic, core, or support

Return JSON:
{
  "orgContext": {
    "mission": { "text": "...", "confidence": 0.0-1.0 },
    "vision": { "text": "...", "confidence": 0.0-1.0 },
    "values": [{ "name": "...", "description": "..." }],
    "valuesConfidence": 0.0-1.0,
    "industry": { "sector": "...", "subsector": "..." },
    "companySize": "small|medium|large|enterprise",
    "geography": "...",
    "departments": [{ "name": "...", "head": "...", "parentDept": "..." }],
    "businessModel": "..."
  },
  "valueChainActivities": [
    { "name": "...", "type": "PRIMARY|SUPPORT", "description": "..." }
  ],
  "processLinks": [
    { "fromProcess": "Process A", "toProcess": "Process B", "linkType": "FEEDS|TRIGGERS|DEPENDS|HANDOFF", "description": "...", "confidence": 0.0-1.0 }
  ],
  "roles": [
    { "name": "...", "department": "...", "title": "..." }
  ],
  "systems": [
    { "name": "...", "vendor": "...", "description": "..." }
  ],
  "processCategories": [
    { "processName": "...", "category": "strategic|core|support", "valueChainActivity": "..." }
  ]
}

Rules:
- Only extract what has evidence in the text. Do NOT hallucinate or infer without basis.
- Confidence scores: 0.9+ = explicitly stated, 0.7-0.9 = strongly implied, 0.5-0.7 = inferred, <0.5 = weak guess
- For mission/vision: only extract if the speaker explicitly describes the company's purpose/direction. Do NOT invent one.
- For value chain: map to what the company actually does, not a generic Porter template
- For process links: only when the text mentions how processes connect (e.g., "after procurement approves, it goes to warehouse")
- For roles: extract the full title and department when available
- For systems: be specific — "SAP" not "an ERP system"
- Omit sections with no evidence (return null/empty for those sections)
- Output in the SAME LANGUAGE as the input text`;

export const COMPANY_BRAIN_ENRICHMENT_USER = (
  text: string,
  sourceType: "transcript" | "document",
  existingContext?: {
    orgName?: string;
    industry?: string;
    existingProcesses?: string[];
    existingRoles?: string[];
    existingSystems?: string[];
  },
) => {
  let contextBlock = "";
  if (existingContext) {
    const parts: string[] = [];
    if (existingContext.orgName) {
      parts.push(`Organization: ${existingContext.orgName}`);
    }
    if (existingContext.industry) {
      parts.push(`Industry: ${existingContext.industry}`);
    }
    if (
      existingContext.existingProcesses &&
      existingContext.existingProcesses.length > 0
    ) {
      parts.push(
        `Known processes: ${existingContext.existingProcesses.join(", ")}`,
      );
    }
    if (
      existingContext.existingRoles &&
      existingContext.existingRoles.length > 0
    ) {
      parts.push(
        `Known roles: ${existingContext.existingRoles.join(", ")}`,
      );
    }
    if (
      existingContext.existingSystems &&
      existingContext.existingSystems.length > 0
    ) {
      parts.push(
        `Known systems: ${existingContext.existingSystems.join(", ")}`,
      );
    }
    if (parts.length > 0) {
      contextBlock = `EXISTING KNOWLEDGE (do not duplicate, but add new details):\n${parts.join("\n")}\n\n`;
    }
  }

  const sourceLabel =
    sourceType === "transcript"
      ? "session transcript"
      : "uploaded document";

  return `${contextBlock}Analyze this ${sourceLabel} and extract organizational knowledge:

${text}

Extract ALL organizational context, value chain activities, process links, roles, systems, and process categories that have evidence in this text.`;
};
