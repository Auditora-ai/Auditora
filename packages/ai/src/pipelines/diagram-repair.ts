/**
 * Diagram Repair Pipeline
 *
 * Takes corrupted/nonsensical BPMN diagram nodes and uses AI to produce
 * a cleaned-up, logically correct version.
 *
 * Pipeline:
 *   DiagramNode[] + Transcript → [Claude] → Repaired DiagramNode[] + Changes
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import { DIAGRAM_REPAIR_SYSTEM, DIAGRAM_REPAIR_USER } from "../prompts/diagram-repair";
import { parseLlmJson } from "../utils/parse-llm-json";

const RepairedNodeSchema = z.object({
	id: z.string().min(1),
	type: z.string().catch("task"),
	label: z.string().min(1),
	lane: z.string().optional().default("General"),
	connections: z.array(z.string()).catch([]),
});

const RepairChangeSchema = z.object({
	action: z.enum(["merged", "removed", "reconnected", "relabeled", "retyped"]),
	nodeId: z.string(),
	detail: z.string(),
});

const RepairResultSchema = z.object({
	repairedNodes: z.array(RepairedNodeSchema).catch([]),
	changes: z.array(RepairChangeSchema).catch([]),
});

export interface RepairInput {
	organizationId: string;
	nodes: Array<{
		id: string;
		type: string;
		label: string;
		lane?: string;
		connections: string[];
		confidence?: number | null;
	}>;
	transcript?: string;
}

export interface RepairChange {
	action: "merged" | "removed" | "reconnected" | "relabeled" | "retyped";
	nodeId: string;
	detail: string;
}

export interface RepairResult {
	repairedNodes: Array<{
		id: string;
		type: string;
		label: string;
		lane: string;
		connections: string[];
	}>;
	changes: RepairChange[];
}

/**
 * Repair a corrupted BPMN diagram using AI.
 *
 * @param input - Current diagram nodes and optional transcript context
 * @returns Repaired nodes and a list of changes made
 */
export async function repairDiagram(input: RepairInput): Promise<RepairResult> {
	if (input.nodes.length === 0) {
		return { repairedNodes: [], changes: [] };
	}

	const { text } = await instrumentedGenerateText({
		organizationId: input.organizationId,
		pipeline: "diagram-repair",
		system: DIAGRAM_REPAIR_SYSTEM,
		prompt: DIAGRAM_REPAIR_USER(input.nodes, input.transcript),
		maxOutputTokens: 4096,
		temperature: 0.1,
	});

	const result = parseLlmJson(text, RepairResultSchema, "DiagramRepair");

	if (!result) {
		console.error("[DiagramRepair] Failed to parse LLM response, returning original nodes");
		return {
			repairedNodes: input.nodes.map((n) => ({
				id: n.id,
				type: n.type,
				label: n.label,
				lane: n.lane || "General",
				connections: n.connections,
			})),
			changes: [],
		};
	}

	// Validate that repaired nodes only reference IDs that exist in the result
	const validIds = new Set(result.repairedNodes.map((n) => n.id));
	const cleanedNodes = result.repairedNodes.map((n) => ({
		...n,
		connections: n.connections.filter((c) => validIds.has(c)),
	}));

	return {
		repairedNodes: cleanedNodes,
		changes: result.changes,
	};
}
