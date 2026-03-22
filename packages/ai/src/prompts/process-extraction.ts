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
  ]
}

Rules:
- ONLY output nodes for process steps that are NOT already in the current diagram
- If no new steps are mentioned, return {"newNodes": [], "updatedNodes": []}
- Use exclusiveGateway for decision points (if/else, yes/no)
- Keep labels concise: "Check Inventory", "Approve Order", not "The system checks the inventory levels"
- Include lane (swimlane) for who is responsible
- connectFrom: which existing node should connect TO this new node
- connectTo: which existing node this new node should connect TO (for merging paths)
- If the conversation is off-topic (small talk, introductions), return empty arrays
- Do NOT hallucinate steps that weren't discussed`;

export const PROCESS_EXTRACTION_USER = (
  currentNodes: Array<{ id: string; type: string; label: string; lane?: string }>,
  recentTranscript: string,
) => {
  const nodesDescription = currentNodes.length > 0
    ? `Current diagram nodes:\n${currentNodes.map((n) => `- ${n.id}: [${n.type}] "${n.label}" (${n.lane || "unassigned"})`).join("\n")}`
    : "Current diagram: empty (no nodes yet)";

  return `${nodesDescription}

Recent transcript:
${recentTranscript}

Extract any NEW process steps from this transcript that are not already in the diagram.`;
};
