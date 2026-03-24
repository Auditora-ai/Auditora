/**
 * Mission/Vision/Values Generation Prompts
 *
 * Generates strategic foundation documents from Company Brain data.
 * Produces content at the level of a senior BPM consultant — not generic
 * MBA templates, but specific to what was discussed and documented.
 */

export const MISSION_VISION_SYSTEM = `You are a senior BPM and strategy consultant generating a Mission, Vision, and Values document for a client organization.

Your output must be:
- SPECIFIC to this organization (no generic templates)
- Based ONLY on evidence from the provided context
- Written in professional consulting language
- Actionable and measurable where possible

Return JSON:
{
  "mission": {
    "statement": "One clear sentence defining the organization's purpose",
    "rationale": "Why this mission statement was chosen based on the evidence",
    "confidence": 0.0-1.0
  },
  "vision": {
    "statement": "One clear sentence defining where the organization is heading",
    "timeHorizon": "e.g., '3-5 years'",
    "rationale": "Why this vision was chosen based on the evidence",
    "confidence": 0.0-1.0
  },
  "values": [
    {
      "name": "Value name",
      "description": "What this value means for this specific organization",
      "behavioralIndicators": ["Observable behavior that demonstrates this value"]
    }
  ],
  "strategicObjectives": [
    {
      "objective": "Specific strategic objective identified from conversations",
      "perspective": "financial|customer|internal|learning"
    }
  ],
  "overallConfidence": 0.0-1.0,
  "gaps": ["Information gaps that would improve this document"]
}

Rules:
- Confidence 0.9+: explicitly stated by leadership
- Confidence 0.5-0.9: inferred from multiple data points
- Confidence <0.5: educated guess — mark clearly in rationale
- If mission/vision was never discussed, still generate a DRAFT based on what you know, but set confidence < 0.5
- Values should be derived from observed behaviors and priorities, not generic lists
- Strategic objectives should map to Balanced Scorecard perspectives when possible
- Output in the SAME LANGUAGE as the input context`;

export const MISSION_VISION_USER = (context: {
  orgName: string;
  industry?: string;
  businessModel?: string;
  existingMission?: string;
  existingVision?: string;
  existingValues?: Array<{ name: string; description?: string }>;
  departments?: Array<{ name: string; head?: string }>;
  processNames?: string[];
  transcriptExcerpts?: string[];
  documentExcerpts?: string[];
}) => {
  const parts: string[] = [];

  parts.push(`ORGANIZATION: ${context.orgName}`);
  if (context.industry) parts.push(`INDUSTRY: ${context.industry}`);
  if (context.businessModel) parts.push(`BUSINESS MODEL: ${context.businessModel}`);

  if (context.existingMission) {
    parts.push(`\nCURRENT MISSION DRAFT (from previous extraction):\n${context.existingMission}`);
  }
  if (context.existingVision) {
    parts.push(`\nCURRENT VISION DRAFT:\n${context.existingVision}`);
  }
  if (context.existingValues && context.existingValues.length > 0) {
    parts.push(`\nCURRENT VALUES:\n${context.existingValues.map((v) => `- ${v.name}${v.description ? `: ${v.description}` : ""}`).join("\n")}`);
  }

  if (context.departments && context.departments.length > 0) {
    parts.push(`\nDEPARTMENTS:\n${context.departments.map((d) => `- ${d.name}${d.head ? ` (${d.head})` : ""}`).join("\n")}`);
  }

  if (context.processNames && context.processNames.length > 0) {
    parts.push(`\nDOCUMENTED PROCESSES:\n${context.processNames.map((p) => `- ${p}`).join("\n")}`);
  }

  if (context.transcriptExcerpts && context.transcriptExcerpts.length > 0) {
    parts.push(`\nRELEVANT TRANSCRIPT EXCERPTS:\n${context.transcriptExcerpts.join("\n---\n")}`);
  }

  if (context.documentExcerpts && context.documentExcerpts.length > 0) {
    parts.push(`\nRELEVANT DOCUMENT EXCERPTS:\n${context.documentExcerpts.join("\n---\n")}`);
  }

  return `${parts.join("\n")}

Generate a professional Mission, Vision, and Values document for this organization based on ALL available evidence.`;
};
