/**
 * Diagram Repair Prompts
 *
 * System and user prompts for AI-powered BPMN diagram repair.
 * Takes corrupted/nonsensical diagram nodes and produces a cleaned-up version.
 */

export const DIAGRAM_REPAIR_SYSTEM = `You are a BPMN process modeling expert. Your job is to repair broken or nonsensical BPMN diagrams.

You will receive a list of BPMN diagram nodes with their types, labels, lanes, and connections. The diagram has structural or logical problems that need to be fixed.

## Common problems to fix:
1. **Duplicate nodes**: Multiple nodes with the same or very similar labels doing the same thing. Merge them.
2. **Orphaned nodes**: Nodes with no incoming or outgoing connections (disconnected from the flow). Either connect them logically or remove them.
3. **Circular flows without gateways**: A→B→A without an exclusive gateway controlling the loop. Add a gateway or break the cycle.
4. **Missing connections**: Obvious flow gaps where step A should connect to step B but doesn't.
5. **Wrong node types**: A decision point modeled as a task instead of an exclusive gateway.
6. **Nonsensical labels**: Node labels that don't describe a process step (e.g., random text, speaker names, off-topic content).
7. **Duplicate lanes**: Multiple lanes that are the same role with slight spelling variations.
8. **Dead ends**: Non-terminal nodes that lead nowhere and aren't end events.

## Rules:
- Preserve the original node IDs when keeping a node (important for database sync).
- When merging duplicates, keep the node with more connections and the clearer label.
- Connections should flow logically: start → activities → decisions → activities → end.
- Every non-start node should be reachable from the start.
- Every non-end node should eventually reach the end.
- Maintain lane assignments — don't move nodes between lanes unless the lane assignment is clearly wrong.
- Output ONLY valid JSON, no explanation or markdown.

## Valid node types:
task, userTask, serviceTask, manualTask, businessRuleTask, subProcess,
exclusiveGateway, parallelGateway, timerEvent, messageEvent

Do NOT include startEvent or endEvent in your output — those are added automatically.`;

export function DIAGRAM_REPAIR_USER(
	nodes: Array<{
		id: string;
		type: string;
		label: string;
		lane?: string;
		connections: string[];
		confidence?: number | null;
	}>,
	transcript?: string,
): string {
	const nodesDesc = nodes
		.map((n) => {
			const conn = n.connections.length > 0 ? ` → [${n.connections.join(", ")}]` : " (no connections)";
			const lane = n.lane ? ` [lane: ${n.lane}]` : "";
			const conf = n.confidence != null ? ` (confidence: ${n.confidence.toFixed(2)})` : "";
			return `  ${n.id}: ${n.type} "${n.label}"${lane}${conn}${conf}`;
		})
		.join("\n");

	let prompt = `## Current diagram nodes (${nodes.length} total):\n${nodesDesc}\n\n`;

	if (transcript) {
		// Limit transcript to last ~3000 chars to stay within token budget
		const trimmed = transcript.length > 3000 ? "..." + transcript.slice(-3000) : transcript;
		prompt += `## Meeting transcript context:\n${trimmed}\n\n`;
	}

	prompt += `## Task:
Analyze the diagram above. Fix structural and logical problems.
Return a JSON object with a single key "repairedNodes" containing an array of corrected nodes.

Each node must have: { "id": string, "type": string, "label": string, "lane": string, "connections": string[] }

Also include a "changes" array describing what you fixed: { "action": "merged"|"removed"|"reconnected"|"relabeled"|"retyped", "nodeId": string, "detail": string }

Example output:
{
  "repairedNodes": [
    { "id": "node_1", "type": "task", "label": "Receive order", "lane": "Sales", "connections": ["node_2"] }
  ],
  "changes": [
    { "action": "removed", "nodeId": "node_5", "detail": "Duplicate of node_1 (same label and lane)" }
  ]
}`;

	return prompt;
}
