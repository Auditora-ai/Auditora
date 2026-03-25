/**
 * Multi-Stakeholder Consolidation Pipeline
 *
 * Merges 2-3 session perspectives of the same process into
 * a consolidated view with conflict detection.
 *
 * Pipeline:
 *   SESSIONS[] -> [This Pipeline] -> Consolidated BPMN + Conflicts[]
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import { z } from "zod";
import { parseLlmJson } from "../utils/parse-llm-json";

const ConflictSchema = z.object({
	nodeLabel: z.string().min(1),
	conflictType: z.enum([
		"sequence_order",
		"duration",
		"naming",
		"existence",
		"responsibility",
	]),
	perspectives: z.array(
		z.object({
			sessionId: z.string(),
			stakeholder: z.string(),
			claim: z.string(),
		}),
	),
});

const ConsolidationResultSchema = z.object({
	conflicts: z.array(ConflictSchema).catch([]),
	consolidatedSteps: z
		.array(
			z.object({
				label: z.string(),
				lane: z.string().optional(),
				order: z.number(),
				hasConflict: z.boolean().catch(false),
			}),
		)
		.catch([]),
});

export interface StakeholderConflict {
	nodeLabel: string;
	conflictType:
		| "sequence_order"
		| "duration"
		| "naming"
		| "existence"
		| "responsibility";
	perspectives: Array<{
		sessionId: string;
		stakeholder: string;
		claim: string;
	}>;
}

export interface ConsolidationResult {
	conflicts: StakeholderConflict[];
	consolidatedSteps: Array<{
		label: string;
		lane?: string;
		order: number;
		hasConflict: boolean;
	}>;
}

interface SessionPerspective {
	sessionId: string;
	stakeholder: string;
	steps: Array<{ label: string; lane?: string; connections: string[] }>;
	transcriptExcerpt: string;
}

export async function consolidateStakeholders(
	perspectives: SessionPerspective[],
	organizationId: string,
): Promise<ConsolidationResult> {
	if (perspectives.length < 2) {
		return { conflicts: [], consolidatedSteps: [] };
	}

	const perspectivesText = perspectives
		.map(
			(p, i) =>
				`Session ${i + 1} (${p.stakeholder}, ID: ${p.sessionId}):
Steps: ${p.steps.map((s) => `${s.label} [${s.lane || "General"}]`).join(" -> ")}
Key quotes: ${p.transcriptExcerpt.slice(0, 2000)}`,
		)
		.join("\n\n---\n\n");

	const { text } = await instrumentedGenerateText({
		organizationId,
		pipeline: "stakeholder-consolidation",
		system: `You are a BPM consultant consolidating multiple stakeholder perspectives of the same business process.

Compare the perspectives and:
1. Identify conflicts: where stakeholders disagree on sequence, duration, naming, whether a step exists, or who is responsible
2. Produce a consolidated step list that represents the merged view

Conflict types:
- sequence_order: stakeholders disagree on the order of steps
- duration: stakeholders give different time estimates
- naming: same step called different things
- existence: one stakeholder mentions a step the other doesn't
- responsibility: stakeholders disagree on who performs a step

Return JSON:
{
  "conflicts": [
    {
      "nodeLabel": "Step name in conflict",
      "conflictType": "sequence_order" | "duration" | "naming" | "existence" | "responsibility",
      "perspectives": [
        { "sessionId": "session_id", "stakeholder": "Name", "claim": "What they said" }
      ]
    }
  ],
  "consolidatedSteps": [
    { "label": "Step name", "lane": "Department", "order": 1, "hasConflict": false }
  ]
}

Rules:
- Cite specific session IDs and stakeholder names in conflicts
- Be conservative: only flag genuine disagreements, not differences in detail level
- The consolidated steps should represent the most complete view`,
		prompt: perspectivesText,
		maxOutputTokens: 4096,
		temperature: 0.2,
	});

	const result = parseLlmJson(text, ConsolidationResultSchema, "StakeholderConsolidation");
	if (!result) {
		return { conflicts: [], consolidatedSteps: [] };
	}
	return result;
}
