/**
 * Process Landscape (Map) Generation Prompts
 *
 * Generates a 3-band process map: Strategic / Core / Support.
 * This is the "GPS of the organization" — the L1 view that shows
 * all major processes organized by category.
 */

export const PROCESS_LANDSCAPE_SYSTEM = `You are a senior BPM consultant generating a Process Landscape Map (Mapa de Procesos) for a client organization.

The landscape organizes ALL processes into three bands:
1. **Strategic (top):** Governance, planning, strategy, compliance — processes that steer the organization
2. **Core (middle):** The processes that directly create value for the customer — the main value stream
3. **Support (bottom):** HR, IT, finance, facilities — processes that enable core processes

For each process, determine:
- **status**: "documented" (has sessions/BPMN), "identified" (mentioned but not yet documented), "gap" (should exist based on industry but hasn't been mentioned)
- **maturityLevel**: 0=nonexistent, 1=initial/ad-hoc, 2=repeatable, 3=defined, 4=managed, 5=optimized
- **valueChainActivity**: which Porter value chain activity this process maps to

Return JSON:
{
  "companyName": "...",
  "strategicBand": {
    "label": "Procesos Estrategicos",
    "description": "Processes that define direction and governance",
    "processes": [
      {
        "name": "...",
        "category": "strategic",
        "owner": "Role/department that owns this",
        "maturityLevel": 0-5,
        "status": "documented|identified|gap",
        "valueChainActivity": "Firm Infrastructure",
        "description": "Brief description"
      }
    ]
  },
  "coreBand": { same structure with category "core" },
  "supportBand": { same structure with category "support" },
  "totalProcesses": total count,
  "documentedCount": count with status "documented",
  "gapCount": count with status "gap",
  "coveragePercentage": (documented / total) * 100,
  "recommendations": ["What to document next and why"],
  "overallConfidence": 0.0-1.0
}

Rules:
- Include ALL documented processes AND suggest gaps based on industry standards
- Processes already in the architecture go in with their existing category
- Suggest 3-5 gap processes per band for a typical company in this industry
- Core band should clearly show the main value stream left-to-right
- Each band should have 3-8 processes (L1 level only)
- Recommendations should prioritize which gaps to fill first
- Output in the SAME LANGUAGE as the input context`;

export const PROCESS_LANDSCAPE_USER = (context: {
  orgName: string;
  industry?: string;
  processDefinitions: Array<{
    name: string;
    category?: string;
    level: string;
    description?: string;
    hasBpmn: boolean;
    sessionsCount: number;
  }>;
  valueChainActivities?: Array<{ name: string; type: string }>;
  departments?: Array<{ name: string }>;
}) => {
  const parts: string[] = [];

  parts.push(`ORGANIZATION: ${context.orgName}`);
  if (context.industry) parts.push(`INDUSTRY: ${context.industry}`);

  if (context.processDefinitions.length > 0) {
    parts.push(`\nEXISTING PROCESSES (from architecture):\n${context.processDefinitions.map((p) => {
      const status = p.hasBpmn ? "documented" : p.sessionsCount > 0 ? "in-progress" : "identified";
      return `- ${p.name} [${p.level}] [${p.category || "uncategorized"}] [${status}]${p.description ? `: ${p.description}` : ""}`;
    }).join("\n")}`);
  }

  if (context.valueChainActivities && context.valueChainActivities.length > 0) {
    parts.push(`\nVALUE CHAIN ACTIVITIES:\n${context.valueChainActivities.map((a) => `- ${a.name} (${a.type})`).join("\n")}`);
  }

  if (context.departments && context.departments.length > 0) {
    parts.push(`\nDEPARTMENTS:\n${context.departments.map((d) => `- ${d.name}`).join("\n")}`);
  }

  return `${parts.join("\n")}

Generate a complete Process Landscape Map. Include all existing processes AND suggest gaps based on industry standards for a ${context.industry || "general"} organization.`;
};
