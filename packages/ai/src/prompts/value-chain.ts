/**
 * Value Chain (Porter) Generation Prompts
 *
 * Generates a Michael Porter value chain analysis from Company Brain data.
 * Maps the organization's actual activities to primary and support categories.
 */

export const VALUE_CHAIN_SYSTEM = `You are a senior strategy consultant generating a Porter Value Chain analysis for a client organization.

The value chain must be SPECIFIC to this organization — not a generic Porter template. Map their actual business activities.

**Primary Activities** (in order of value flow):
1. Inbound Logistics — receiving, warehousing, inventory of inputs
2. Operations — transforming inputs into the final product/service
3. Outbound Logistics — delivering the product/service to customers
4. Marketing & Sales — channels, pricing, promotion, customer acquisition
5. Service — after-sale support, maintenance, customer success

**Support Activities** (enabling primary activities):
1. Firm Infrastructure — management, planning, finance, legal, quality
2. Human Resource Management — recruiting, training, compensation
3. Technology Development — R&D, IT, process automation, digital tools
4. Procurement — purchasing policies, supplier management

Adapt categories to the company's reality. A service company's "Operations" looks different from a manufacturer's.

Return JSON:
{
  "companyName": "...",
  "industryContext": "Brief industry context that shapes this value chain",
  "primaryActivities": [
    {
      "name": "Activity name (adapted to this company)",
      "type": "PRIMARY",
      "description": "What this company specifically does here",
      "subActivities": ["Specific sub-activities observed"],
      "linkedProcesses": ["Process names from architecture that map here"],
      "keyMetrics": ["KPIs that matter for this activity"],
      "orderIndex": 0
    }
  ],
  "supportActivities": [same structure with type "SUPPORT"],
  "marginDescription": "How this company creates margin/value",
  "competitiveAdvantage": "Where the company's competitive advantage lies in the chain",
  "gaps": ["Areas where data is insufficient"],
  "overallConfidence": 0.0-1.0
}

Rules:
- Adapt activity NAMES to the company (e.g., for a hospital: "Patient Intake" not "Inbound Logistics")
- linkedProcesses must reference actual documented processes by name
- If a primary/support category has no evidence, still include it but mark as a gap
- Order primaryActivities by value flow (left to right)
- Order supportActivities from top to bottom (infrastructure first)
- Output in the SAME LANGUAGE as the input context`;

export const VALUE_CHAIN_USER = (context: {
  orgName: string;
  industry?: string;
  businessModel?: string;
  processNames: Array<{ name: string; category?: string; description?: string }>;
  valueChainActivities?: Array<{ name: string; type: string; description?: string }>;
  roles?: Array<{ name: string; department?: string }>;
  systems?: Array<{ name: string; description?: string }>;
  transcriptExcerpts?: string[];
  documentExcerpts?: string[];
}) => {
  const parts: string[] = [];

  parts.push(`ORGANIZATION: ${context.orgName}`);
  if (context.industry) parts.push(`INDUSTRY: ${context.industry}`);
  if (context.businessModel) parts.push(`BUSINESS MODEL: ${context.businessModel}`);

  if (context.processNames.length > 0) {
    parts.push(`\nDOCUMENTED PROCESSES:\n${context.processNames.map((p) => `- ${p.name}${p.category ? ` [${p.category}]` : ""}${p.description ? `: ${p.description}` : ""}`).join("\n")}`);
  }

  if (context.valueChainActivities && context.valueChainActivities.length > 0) {
    parts.push(`\nEXISTING VALUE CHAIN ACTIVITIES (from previous extraction):\n${context.valueChainActivities.map((a) => `- ${a.name} (${a.type})${a.description ? `: ${a.description}` : ""}`).join("\n")}`);
  }

  if (context.roles && context.roles.length > 0) {
    parts.push(`\nKNOWN ROLES:\n${context.roles.map((r) => `- ${r.name}${r.department ? ` (${r.department})` : ""}`).join("\n")}`);
  }

  if (context.systems && context.systems.length > 0) {
    parts.push(`\nSYSTEMS/TOOLS USED:\n${context.systems.map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`).join("\n")}`);
  }

  if (context.transcriptExcerpts && context.transcriptExcerpts.length > 0) {
    parts.push(`\nRELEVANT EXCERPTS:\n${context.transcriptExcerpts.join("\n---\n")}`);
  }

  if (context.documentExcerpts && context.documentExcerpts.length > 0) {
    parts.push(`\nDOCUMENT EXCERPTS:\n${context.documentExcerpts.join("\n---\n")}`);
  }

  return `${parts.join("\n")}

Generate a detailed Porter Value Chain analysis for this organization. Map their actual activities and processes to the value chain framework.`;
};
