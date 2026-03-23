/**
 * Chat Extraction Prompts
 *
 * Used during conversational discovery to extract process definitions
 * from chat messages (text or transcribed audio). Unlike discovery-extraction
 * (which works with real-time transcript streams), this works with
 * user-initiated chat messages.
 */

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
- suggestedLevel: PROCESS for top-level, SUBPROCESS for sub-processes, TASK for individual tasks, PROCEDURE for detailed procedures
- suggestedCategory: "strategic" for planning/governance, "core" for value-chain processes, "support" for enabling processes (HR, IT, finance)
- The conversationalResponse should be in the same language as the user's message
- If no processes are found, still provide a helpful conversationalResponse and followUpQuestion
- followUpQuestion should be specific and targeted to uncover gaps in the process architecture`;

export const CHAT_EXTRACTION_USER = (
  messages: Array<{ role: string; content: string }>,
  existingProcesses: Array<{ name: string; level: string; category?: string }>,
  projectContext?: {
    clientName?: string;
    clientIndustry?: string;
    projectGoals?: string;
  },
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

  const existingBlock =
    existingProcesses.length > 0
      ? `EXISTING PROCESSES (do NOT duplicate):\n${existingProcesses
          .map(
            (p) =>
              `- ${p.name} [${p.level}${p.category ? `, ${p.category}` : ""}]`,
          )
          .join("\n")}\n\n`
      : "";

  // Format recent messages (last 20 for sliding window)
  const recentMessages = messages.slice(-20);
  const conversationBlock = recentMessages
    .map((m) => `${m.role === "user" ? "CONSULTANT" : "ASSISTANT"}: ${m.content}`)
    .join("\n\n");

  return `${contextBlock}${existingBlock}CONVERSATION:\n${conversationBlock}\n\nExtract any NEW business processes from the latest messages. Respond in the same language as the consultant.`;
};
