/**
 * Session Summary Pipeline
 *
 * Generates post-session executive summaries from the full transcript
 * and confirmed BPMN nodes. Triggered when a session ends.
 *
 * Pipeline:
 *   TRANSCRIPT + CONFIRMED NODES → [This Pipeline] → SUMMARY + ACTION ITEMS → [DB]
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
	SESSION_SUMMARY_SYSTEM,
	SESSION_SUMMARY_USER,
} from "../prompts/session-summary";
import { parseLlmJson } from "../utils/parse-llm-json";

const SummaryResultSchema = z.object({
	summary: z.string().min(1),
	actionItems: z.array(z.string()).catch([]),
});

export interface SummaryResult {
	summary: string;
	actionItems: string[];
}

interface TranscriptEntry {
	speaker: string;
	text: string;
	timestamp: number;
}

interface ProcessNode {
	id: string;
	type: string;
	label: string;
	lane?: string;
}

function formatFullTranscript(entries: TranscriptEntry[]): string {
	if (entries.length === 0) return "(empty transcript)";

	return entries
		.map((e) => {
			const mins = Math.floor(e.timestamp / 60);
			const secs = Math.floor(e.timestamp % 60);
			return `[${mins}:${secs.toString().padStart(2, "0")}] ${e.speaker}: ${e.text}`;
		})
		.join("\n");
}

/**
 * Generate a session summary from the full transcript and confirmed nodes.
 */
export async function generateSessionSummary(
	sessionType: string,
	nodes: ProcessNode[],
	transcript: TranscriptEntry[],
): Promise<SummaryResult> {
	const transcriptText = formatFullTranscript(transcript);

	if (transcriptText === "(empty transcript)") {
		return {
			summary: "No transcript was captured during this session.",
			actionItems: [],
		};
	}

	const { text } = await generateText({
		model: anthropic("claude-sonnet-4-6"),
		system: SESSION_SUMMARY_SYSTEM,
		prompt: SESSION_SUMMARY_USER(
			sessionType,
			nodes.map((n) => ({
				id: n.id,
				type: n.type,
				label: n.label,
				lane: n.lane,
			})),
			transcriptText,
		),
		maxOutputTokens: 2048,
		temperature: 0.3,
	});

	const result = parseLlmJson(text, SummaryResultSchema, "SessionSummary");
	if (!result) {
		return {
			summary:
				"Summary generation failed. Please review the transcript manually.",
			actionItems: [],
		};
	}
	return result;
}
