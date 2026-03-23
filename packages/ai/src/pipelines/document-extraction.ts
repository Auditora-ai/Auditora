/**
 * Document Extraction Pipeline
 *
 * Extracts L1 process definitions from uploaded documents.
 * Used for pre-call intelligence and document-based discovery.
 *
 * Pipeline:
 *   DOCUMENT TEXT -> [This Pipeline] -> ProcessDefinition drafts
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
	buildDocumentExtractionPrompt,
	DOCUMENT_EXTRACTION_USER,
} from "../prompts/document-extraction";
import type { SessionContext } from "../context/session-context";

const ProcessSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	category: z.enum(["core", "support", "strategic"]).catch("core"),
	owner: z.string().optional(),
	triggers: z.array(z.string()).catch([]),
	outputs: z.array(z.string()).catch([]),
	goals: z.array(z.string()).catch([]),
});

const DocumentExtractionResultSchema = z.object({
	processes: z.array(ProcessSchema).catch([]),
});

export interface DocumentExtractionResult {
	processes: Array<{
		name: string;
		description?: string;
		category: "core" | "support" | "strategic";
		owner?: string;
		triggers: string[];
		outputs: string[];
		goals: string[];
	}>;
}

export async function extractFromDocument(
	documentText: string,
	existingProcessNames: string[],
	context?: SessionContext,
): Promise<DocumentExtractionResult> {
	if (!documentText || documentText.trim().length < 50) {
		return { processes: [] };
	}

	// Truncate very long documents to avoid token limits
	const truncated = documentText.slice(0, 15000);

	const { text } = await generateText({
		model: anthropic("claude-sonnet-4-6"),
		system: buildDocumentExtractionPrompt(existingProcessNames, context),
		prompt: DOCUMENT_EXTRACTION_USER(truncated),
		maxOutputTokens: 2048,
		temperature: 0.1,
	});

	try {
		const cleaned = text
			.replace(/^```json\s*/i, "")
			.replace(/```\s*$/i, "")
			.trim();
		const raw = JSON.parse(cleaned);
		const result = DocumentExtractionResultSchema.parse(raw);

		// Filter out any processes that match existing names (case-insensitive)
		const existingLower = new Set(
			existingProcessNames.map((n) => n.toLowerCase()),
		);
		const filtered = result.processes.filter(
			(p) => !existingLower.has(p.name.toLowerCase()),
		);

		return { processes: filtered };
	} catch (error) {
		console.error(
			"[DocumentExtraction] Invalid LLM output:",
			text.substring(0, 200),
			error instanceof Error ? error.message : "",
		);
		return { processes: [] };
	}
}
