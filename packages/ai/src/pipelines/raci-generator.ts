/**
 * RACI Auto-Generator Pipeline
 *
 * Generates RACI matrix from session transcripts and swimlane roles.
 * Normalizes role names from DiagramNode.lane + TranscriptEntry data.
 *
 * Pipeline:
 *   LANES + TRANSCRIPTS -> [This Pipeline] -> RaciEntry[]
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const RaciAssignmentSchema = z.object({
	activityName: z.string().min(1),
	role: z.string().min(1),
	assignment: z.enum(["R", "A", "C", "I"]),
});

const RaciResultSchema = z.object({
	assignments: z.array(RaciAssignmentSchema).catch([]),
});

export interface RaciAssignment {
	activityName: string;
	role: string;
	assignment: "R" | "A" | "C" | "I";
}

export interface RaciGeneratorResult {
	assignments: RaciAssignment[];
}

export async function generateRaci(
	lanes: string[],
	taskLabels: string[],
	transcriptExcerpts: string,
): Promise<RaciGeneratorResult> {
	if (lanes.length === 0 || taskLabels.length === 0) {
		return { assignments: [] };
	}

	const { text } = await generateText({
		model: anthropic("claude-sonnet-4-6"),
		system: `You are a BPM consultant generating a RACI matrix.
Given the roles (from swimlanes) and activities (from BPMN tasks), assign RACI responsibilities.

R = Responsible (does the work)
A = Accountable (ultimately answerable)
C = Consulted (provides input)
I = Informed (kept in the loop)

Rules:
- Each activity MUST have exactly one A (Accountable)
- Each activity should have at least one R (Responsible)
- Only assign C or I when there is evidence from the transcript
- If uncertain about an assignment, omit it rather than guessing
- Normalize role names (e.g., "Gerente de Compras" -> "Gerente de Compras", don't translate)

Return JSON:
{
  "assignments": [
    { "activityName": "Task name", "role": "Role name", "assignment": "R" | "A" | "C" | "I" }
  ]
}`,
		prompt: `Roles (from swimlanes): ${lanes.join(", ")}

Activities (from BPMN tasks): ${taskLabels.join(", ")}

Transcript context:
${transcriptExcerpts.slice(0, 5000)}

Generate the RACI matrix assignments.`,
		maxOutputTokens: 2048,
		temperature: 0.1,
	});

	try {
		const cleaned = text
			.replace(/^```json\s*/i, "")
			.replace(/```\s*$/i, "")
			.trim();
		const raw = JSON.parse(cleaned);
		return RaciResultSchema.parse(raw);
	} catch (error) {
		console.error(
			"[RaciGenerator] Invalid LLM output:",
			text.substring(0, 200),
			error instanceof Error ? error.message : "",
		);
		return { assignments: [] };
	}
}
