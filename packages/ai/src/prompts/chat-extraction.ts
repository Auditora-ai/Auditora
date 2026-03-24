/**
 * Chat Extraction Prompts
 *
 * Used during conversational discovery to extract process definitions
 * from chat messages (text or transcribed audio). Unlike discovery-extraction
 * (which works with real-time transcript streams), this works with
 * user-initiated chat messages.
 */

import type { ProcessChatContext } from "../pipelines/chat-extraction";

export const CHAT_EXTRACTION_SYSTEM = `You are a Business Process Management (BPM) expert helping a consultant discover and document business processes through conversation.

Your job is to:
1. Extract any business processes mentioned or implied in the conversation
2. Classify each process by level and category
3. Suggest a follow-up question to discover more processes

Return JSON:
{
  "extractedProcesses": [
    {
      "name": "Process Name",
      "description": "Brief description",
      "suggestedLevel": "PROCESS|SUBPROCESS|TASK|PROCEDURE",
      "suggestedCategory": "strategic|core|support",
      "owner": "Department or role (optional)",
      "triggers": ["What starts this process"],
      "outputs": ["What this process produces"]
    }
  ],
  "followUpQuestion": "A specific follow-up question to discover more processes or details",
  "conversationalResponse": "A brief, natural response to the user acknowledging what was understood and presenting the extracted processes"
}

Rules:
- Only extract processes with enough evidence from the conversation
- Use clear, standard BPM terminology in Spanish (the user is a Spanish-speaking BPM consultant)
- Don't duplicate processes already known (listed in context)
- Don't re-suggest processes that were previously rejected by the user
- suggestedLevel: PROCESS for top-level, SUBPROCESS for sub-processes, TASK for individual tasks, PROCEDURE for detailed procedures
- suggestedCategory: "strategic" for planning/governance, "core" for value-chain processes, "support" for enabling processes (HR, IT, finance)
- The conversationalResponse should be in the same language as the user's message
- If no processes are found, still provide a helpful conversationalResponse and followUpQuestion
- When a target process is provided, focus your questions and extraction on that specific process and its sub-processes
- Use intelligence gaps (if provided) to guide your follow-up questions — prioritize HIGH gaps
- Reference the process completeness score to motivate deeper exploration when it's low
- followUpQuestion should be specific and targeted to uncover gaps in the process architecture`;

export const CHAT_EXTRACTION_USER = (
	messages: Array<{ role: string; content: string }>,
	existingProcesses: Array<{
		name: string;
		level: string;
		category?: string;
	}>,
	projectContext?: {
		clientName?: string;
		clientIndustry?: string;
		projectGoals?: string;
		liveTranscript?: string;
	},
	processContext?: ProcessChatContext,
	currentDiagramNodes?: Array<{
		id: string;
		type: string;
		label: string;
		state: string;
		lane?: string | null;
	}>,
) => {
	let contextBlock = "";
	if (projectContext) {
		const parts: string[] = [];
		if (projectContext.clientName) {
			parts.push(`Client: ${projectContext.clientName}`);
		}
		if (projectContext.clientIndustry) {
			parts.push(`Industry: ${projectContext.clientIndustry}`);
		}
		if (projectContext.projectGoals) {
			parts.push(`Project goals: ${projectContext.projectGoals}`);
		}
		if (parts.length > 0) {
			contextBlock = `PROJECT CONTEXT:\n${parts.join("\n")}\n\n`;
		}
	}

	let transcriptBlock = "";
	if (projectContext?.liveTranscript) {
		transcriptBlock = `LIVE MEETING TRANSCRIPT (most recent):\n${projectContext.liveTranscript}\n\nUse this transcript to inform your process extraction. The consultant is in a live meeting and may reference things just discussed.\n\n`;
	}

	// Process-specific context block
	let processBlock = "";
	if (processContext?.targetProcess) {
		const tp = processContext.targetProcess;
		const tpParts: string[] = [];
		tpParts.push(`Process: "${tp.name}" (${tp.level})`);
		if (tp.description) {
			tpParts.push(
				`Description: ${tp.description.substring(0, 500)}`,
			);
		}
		if (tp.triggers.length > 0) {
			tpParts.push(`Known triggers: ${tp.triggers.join(", ")}`);
		}
		if (tp.outputs.length > 0) {
			tpParts.push(`Expected outputs: ${tp.outputs.join(", ")}`);
		}
		if (tp.goals.length > 0) {
			tpParts.push(`Goals: ${tp.goals.join(", ")}`);
		}
		if (tp.owner) {
			tpParts.push(`Owner: ${tp.owner}`);
		}
		if (tp.siblings.length > 0) {
			tpParts.push(`Sibling processes: ${tp.siblings.join(", ")}`);
		}
		processBlock = `TARGET PROCESS CONTEXT:\n${tpParts.join("\n")}\n\n`;
	}

	// Intelligence gaps block
	let gapsBlock = "";
	if (
		processContext?.intelligenceGaps &&
		processContext.intelligenceGaps.length > 0
	) {
		const gapLines = processContext.intelligenceGaps
			.slice(0, 5)
			.map((g) => {
				const label =
					g.priority >= 70
						? "HIGH"
						: g.priority >= 40
							? "MED"
							: "LOW";
				return `- [${label}] ${g.category}: ${g.question}`;
			})
			.join("\n");
		const scoreNote =
			processContext.completenessScore != null
				? `\nProcess completeness: ${processContext.completenessScore}%`
				: "";
		gapsBlock = `INTELLIGENCE GAPS (questions still unanswered about this process — prioritize these):\n${gapLines}${scoreNote}\n\n`;
	}

	// Rejected processes block
	let rejectedBlock = "";
	if (
		processContext?.rejectedNames &&
		processContext.rejectedNames.length > 0
	) {
		rejectedBlock = `REJECTED SUGGESTIONS (do NOT re-suggest these):\n- ${processContext.rejectedNames.join(", ")}\n\n`;
	}

	const existingBlock =
		existingProcesses.length > 0
			? `EXISTING PROCESSES (do NOT duplicate):\n${existingProcesses
					.map(
						(p) =>
							`- ${p.name} [${p.level}${p.category ? `, ${p.category}` : ""}]`,
					)
					.join("\n")}\n\n`
			: "";

	// Current diagram nodes context
	let diagramBlock = "";
	if (currentDiagramNodes && currentDiagramNodes.length > 0) {
		const nodeLines = currentDiagramNodes
			.filter((n) => n.state !== "rejected")
			.map((n) => `- [${n.type}] "${n.label}"${n.lane ? ` (lane: ${n.lane})` : ""} — ${n.state}`)
			.join("\n");
		diagramBlock = `CURRENT BPMN DIAGRAM (these steps already exist on the canvas — reference them when relevant, don't duplicate):\n${nodeLines}\n\n`;
	}

	// Format recent messages (last 20 for sliding window)
	const recentMessages = messages.slice(-20);
	const conversationBlock = recentMessages
		.map(
			(m) =>
				`${m.role === "user" ? "CONSULTANT" : "ASSISTANT"}: ${m.content}`,
		)
		.join("\n\n");

	return `${contextBlock}${processBlock}${gapsBlock}${transcriptBlock}${diagramBlock}${existingBlock}${rejectedBlock}CONVERSATION:\n${conversationBlock}\n\nExtract any NEW business processes from the latest messages. Respond in the same language as the consultant.`;
};
