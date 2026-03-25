/**
 * Mission/Vision/Values Generation Pipeline
 *
 * Generates strategic foundation documents from Company Brain + session data.
 * Produces content at senior BPM consultant level.
 *
 * Pipeline:
 *   COMPANY BRAIN + TRANSCRIPTS + DOCS → [This Pipeline] → MISSION/VISION/VALUES DOC
 */

import { instrumentedGenerateText } from "../utils/instrumented-generate";
import {
  MissionVisionResultSchema,
  type MissionVisionResult,
} from "../schemas/mission-vision";
import {
  MISSION_VISION_SYSTEM,
  MISSION_VISION_USER,
} from "../prompts/mission-vision";
import { parseLlmJson } from "../utils/parse-llm-json";

export interface MissionVisionInput {
  organizationId: string;
  orgName: string;
  industry?: string;
  businessModel?: string;
  existingMission?: string;
  existingVision?: string;
  existingValues?: Array<{ name: string; description?: string }>;
  departments?: Array<{ name: string; head?: string }>;
  processNames?: string[];
  transcriptExcerpts?: string[];
  documentExcerpts?: string[];
}

export async function generateMissionVision(
  input: MissionVisionInput,
): Promise<MissionVisionResult> {
  const { text, usage } = await instrumentedGenerateText({
    organizationId: input.organizationId,
    pipeline: "mission-vision",
    system: MISSION_VISION_SYSTEM,
    prompt: MISSION_VISION_USER(input),
    maxOutputTokens: 4096,
    temperature: 0.2,
  });

  const result = parseLlmJson(
    text,
    MissionVisionResultSchema,
    "MissionVision",
  );

  if (!result) {
    throw new Error("Failed to parse mission/vision output from LLM");
  }

  console.log(
    `[MissionVision] Generated for ${input.orgName}: confidence=${result.overallConfidence}, values=${result.values.length}, gaps=${result.gaps.length}, tokens=${usage?.totalTokens ?? 0}`,
  );

  return result;
}
