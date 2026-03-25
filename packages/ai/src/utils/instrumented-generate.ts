/**
 * Instrumented Generate
 *
 * Wraps AI SDK's generateText with:
 *   1. Automatic model resolution from org tier
 *   2. Token usage logging to AiUsageLog
 *   3. Duration tracking
 *   4. Error logging (logs failure before re-throwing)
 *
 * Logging is fire-and-forget — never blocks the pipeline.
 */

import { generateText } from "ai";
import { db } from "@repo/database";
import { getModelForOrg } from "./model-router";

type GenerateTextParams = Parameters<typeof generateText>[0];

export interface InstrumentedGenerateOptions
	extends Omit<GenerateTextParams, "model"> {
	organizationId: string;
	pipeline: string;
	/** Override model resolution — skip tier lookup */
	model?: GenerateTextParams["model"];
}

export async function instrumentedGenerateText(
	opts: InstrumentedGenerateOptions,
) {
	const { organizationId, pipeline, ...generateOpts } = opts;

	// Resolve model from org tier (unless explicitly overridden)
	let modelName: string;
	let model: GenerateTextParams["model"];

	if (opts.model) {
		model = opts.model;
		modelName = "custom-override";
	} else {
		const resolved = await getModelForOrg(organizationId);
		model = resolved.model;
		modelName = resolved.modelName;
	}

	const startTime = Date.now();

	try {
		const result = await generateText({
			...generateOpts,
			model,
		} as GenerateTextParams);

		const durationMs = Date.now() - startTime;

		// Fire-and-forget log
		const inputTokens = result.usage?.inputTokens ?? 0;
		const outputTokens = result.usage?.outputTokens ?? 0;

		db.aiUsageLog
			.create({
				data: {
					organizationId,
					pipeline,
					model: modelName,
					inputTokens,
					outputTokens,
					durationMs,
					success: true,
				},
			})
			.catch(() => {});

		return result;
	} catch (error) {
		const durationMs = Date.now() - startTime;

		// Log the failure before re-throwing
		db.aiUsageLog
			.create({
				data: {
					organizationId,
					pipeline,
					model: modelName,
					inputTokens: 0,
					outputTokens: 0,
					durationMs,
					success: false,
					error:
						error instanceof Error
							? error.message
							: String(error),
				},
			})
			.catch(() => {});

		throw error;
	}
}
