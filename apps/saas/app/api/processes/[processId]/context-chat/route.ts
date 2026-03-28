/**
 * Context Chat API
 *
 * POST /api/processes/{processId}/context-chat
 *
 * Accepts a natural-language message from the consultant and extracts
 * structured process context (description, goals, triggers, outputs,
 * owner, sub-processes). Updates the process definition with extracted data.
 *
 * Same pattern as CompanyBrain enrichment but at the process level.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

const SYSTEM_PROMPT = `You are a senior BPM consultant helping to define process context.
The user will describe a business process in natural language. Extract structured information.

IMPORTANT RULES:
- Only extract what is explicitly mentioned or clearly implied.
- If a field is not mentioned, return null for it (do not invent data).
- For arrays (goals, triggers, outputs), return empty array if not mentioned.
- Keep descriptions concise and professional.
- Respond in the same language the user writes in.

Return a JSON object with these fields:
{
  "description": string | null,     // Process description/summary
  "owner": string | null,           // Responsible person or department
  "goals": string[],                // Process objectives
  "triggers": string[],             // What initiates the process
  "outputs": string[],              // Process deliverables/results
  "subProcesses": string[],         // Sub-processes or main steps mentioned
  "summary": string                 // Brief confirmation of what you understood (1-2 sentences, in user's language)
}

Respond ONLY with the JSON object, no markdown fences or extra text.`;

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const authResult = await requireProcessAuth(processId);
		if (isAuthError(authResult)) return authResult;

		const body = await request.json();
		const { message } = body;

		if (!message || typeof message !== "string" || message.trim().length < 5) {
			return NextResponse.json(
				{ error: "Message is required (min 5 characters)" },
				{ status: 400 },
			);
		}

		// Get current process state for context
		const process = await db.processDefinition.findUnique({
			where: { id: processId },
			select: {
				name: true,
				description: true,
				owner: true,
				goals: true,
				triggers: true,
				outputs: true,
			},
		});

		if (!process) {
			return NextResponse.json({ error: "Process not found" }, { status: 404 });
		}

		const currentContext = [
			process.description && `Current description: ${process.description}`,
			process.owner && `Current owner: ${process.owner}`,
			process.goals.length > 0 && `Current goals: ${process.goals.join(", ")}`,
			process.triggers.length > 0 && `Current triggers: ${process.triggers.join(", ")}`,
			process.outputs.length > 0 && `Current outputs: ${process.outputs.join(", ")}`,
		]
			.filter(Boolean)
			.join("\n");

		const userPrompt = `Process name: "${process.name}"
${currentContext ? `\nExisting context:\n${currentContext}\n` : ""}
User message:
${message.trim()}`;

		const { text } = await generateText({
			model: anthropic("claude-opus-4-6"),
			system: SYSTEM_PROMPT,
			prompt: userPrompt,
			maxOutputTokens: 1000,
			temperature: 0.3,
		});

		// Parse extraction
		let extracted: {
			description?: string | null;
			owner?: string | null;
			goals?: string[];
			triggers?: string[];
			outputs?: string[];
			subProcesses?: string[];
			summary?: string;
		};

		try {
			// Strip markdown fences if present
			const jsonStr = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
			extracted = JSON.parse(jsonStr);
		} catch {
			return NextResponse.json({
				ok: true,
				extracted: null,
				summary: "No pude extraer información estructurada de tu mensaje. Intenta ser más específico sobre el proceso.",
				updated: {},
			});
		}

		// Build update object — only update fields that were extracted (non-null, non-empty)
		const update: Record<string, unknown> = {};
		const updatedFields: string[] = [];

		if (extracted.description && !process.description) {
			update.description = extracted.description;
			updatedFields.push("descripción");
		}
		if (extracted.owner && !process.owner) {
			update.owner = extracted.owner;
			updatedFields.push("owner");
		}
		if (extracted.goals && extracted.goals.length > 0) {
			// Merge with existing, deduplicate
			const merged = [...new Set([...process.goals, ...extracted.goals])];
			update.goals = merged;
			updatedFields.push(`${extracted.goals.length} objetivo${extracted.goals.length !== 1 ? "s" : ""}`);
		}
		if (extracted.triggers && extracted.triggers.length > 0) {
			const merged = [...new Set([...process.triggers, ...extracted.triggers])];
			update.triggers = merged;
			updatedFields.push(`${extracted.triggers.length} trigger${extracted.triggers.length !== 1 ? "s" : ""}`);
		}
		if (extracted.outputs && extracted.outputs.length > 0) {
			const merged = [...new Set([...process.outputs, ...extracted.outputs])];
			update.outputs = merged;
			updatedFields.push(`${extracted.outputs.length} output${extracted.outputs.length !== 1 ? "s" : ""}`);
		}

		// Apply updates to process
		if (Object.keys(update).length > 0) {
			await db.processDefinition.update({
				where: { id: processId },
				data: update,
			});
		}

		return NextResponse.json({
			ok: true,
			extracted: {
				description: extracted.description,
				owner: extracted.owner,
				goals: extracted.goals || [],
				triggers: extracted.triggers || [],
				outputs: extracted.outputs || [],
				subProcesses: extracted.subProcesses || [],
			},
			summary:
				extracted.summary ||
				(updatedFields.length > 0
					? `Actualicé: ${updatedFields.join(", ")}`
					: "No encontré información nueva para extraer."),
			updated: update,
			updatedFields,
		});
	} catch (error) {
		console.error("[ContextChat] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
