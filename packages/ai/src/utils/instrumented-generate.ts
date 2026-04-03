/**
 * Instrumented Generate
 *
 * Wraps AI SDK's generateText with:
 *   1. Automatic model resolution from org tier
 *   2. Token usage logging to AiUsageLog
 *   3. Duration tracking
 *   4. Error logging (logs failure before re-throwing)
 *   5. Circuit breaker: after one Anthropic failure, route to GLM then DeepSeek
 *
 * Fallback chain: Primary → GLM (Z.AI) → DeepSeek
 * Logging is fire-and-forget — never blocks the pipeline.
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@repo/database";
import { getModelForOrg, getGlmModel } from "./model-router";

type GenerateTextParams = Parameters<typeof generateText>[0];

export interface InstrumentedGenerateOptions
	extends Omit<GenerateTextParams, "model"> {
	organizationId: string;
	pipeline: string;
	/** Override model resolution — skip tier lookup */
	model?: GenerateTextParams["model"];
}

// Circuit breaker: skip Anthropic entirely after a failure (resets after 5 min)
let anthropicCircuitOpen = false;
let anthropicCircuitOpenedAt = 0;
const CIRCUIT_RESET_MS = 5 * 60 * 1000;

function isAnthropicCircuitOpen(): boolean {
	if (!anthropicCircuitOpen) return false;
	if (Date.now() - anthropicCircuitOpenedAt > CIRCUIT_RESET_MS) {
		anthropicCircuitOpen = false;
		return false;
	}
	return true;
}

function openAnthropicCircuit(): void {
	anthropicCircuitOpen = true;
	anthropicCircuitOpenedAt = Date.now();
	console.warn("[ai] Circuit breaker opened — skipping Anthropic for 5 minutes");
}

function getDeepSeekModel() {
	const deepseek = createOpenAI({
		baseURL: "https://api.deepseek.com",
		apiKey: process.env.DEEPSEEK_API_KEY,
	});
	return deepseek.chat("deepseek-chat");
}

export async function instrumentedGenerateText(
	opts: InstrumentedGenerateOptions,
) {
	const { organizationId, pipeline, model: modelOverride, ...generateOpts } = opts;

	// Resolve model from org tier (unless explicitly overridden)
	let modelName: string;
	let model: GenerateTextParams["model"];

	if (modelOverride) {
		model = modelOverride;
		modelName = "custom-override";
	} else {
		const resolved = await getModelForOrg(organizationId);
		model = resolved.model;
		modelName = resolved.modelName;
	}

	// If Anthropic circuit is open, go straight to fallback chain (GLM → DeepSeek)
	const shouldSkipPrimary =
		isAnthropicCircuitOpen() &&
		(process.env.GLM_API_KEY || process.env.DEEPSEEK_API_KEY) &&
		!modelName.includes("deepseek") &&
		!modelName.includes("glm");

	if (shouldSkipPrimary) {
		return executeFallbackChain(organizationId, pipeline, generateOpts);
	}

	const startTime = Date.now();

	try {
		const result = await generateText({
			...generateOpts,
			model,
		} as GenerateTextParams);

		const durationMs = Date.now() - startTime;

		// Fire-and-forget log
		db.aiUsageLog
			.create({
				data: {
					organizationId,
					pipeline,
					model: modelName,
					inputTokens: result.usage?.inputTokens ?? 0,
					outputTokens: result.usage?.outputTokens ?? 0,
					durationMs,
					success: true,
				},
			})
			.catch(() => {});

		return result;
	} catch (error) {
		const durationMs = Date.now() - startTime;

		// Log the primary failure
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

		// Fallback chain: GLM → DeepSeek (if primary wasn't already one of them)
		if (
			(process.env.GLM_API_KEY || process.env.DEEPSEEK_API_KEY) &&
			!modelName.includes("deepseek") &&
			!modelName.includes("glm")
		) {
			// Open circuit breaker so subsequent calls skip Anthropic
			openAnthropicCircuit();

			try {
				return await executeFallbackChain(organizationId, pipeline, generateOpts);
			} catch (fallbackError) {
				console.error(
					`[ai] All fallbacks failed for ${pipeline}:`,
					fallbackError,
				);
			}
		}

		throw error;
	}
}

/**
 * Fallback chain: tries GLM first, then DeepSeek.
 * If GLM key is not set, goes straight to DeepSeek.
 */
async function executeFallbackChain(
	organizationId: string,
	pipeline: string,
	generateOpts: Omit<GenerateTextParams, "model">,
) {
	// Try GLM first
	if (process.env.GLM_API_KEY) {
		try {
			return await executeWithGlm(organizationId, pipeline, generateOpts);
		} catch (glmError) {
			console.warn(
				`[ai] GLM fallback failed for ${pipeline}, trying DeepSeek:`,
				glmError,
			);
		}
	}

	// Then DeepSeek
	if (process.env.DEEPSEEK_API_KEY) {
		return await executeWithDeepSeek(organizationId, pipeline, generateOpts);
	}

	throw new Error(`[ai] No fallback providers available for ${pipeline}`);
}

async function executeWithGlm(
	organizationId: string,
	pipeline: string,
	generateOpts: Omit<GenerateTextParams, "model">,
) {
	const fallbackModel = getGlmModel();
	const fallbackStart = Date.now();

	const result = await generateText({
		...generateOpts,
		model: fallbackModel,
	} as GenerateTextParams);

	const fallbackDuration = Date.now() - fallbackStart;

	db.aiUsageLog
		.create({
			data: {
				organizationId,
				pipeline,
				model: "glm-5.1-fallback",
				inputTokens: result.usage?.inputTokens ?? 0,
				outputTokens: result.usage?.outputTokens ?? 0,
				durationMs: fallbackDuration,
				success: true,
			},
		})
		.catch(() => {});

	return result;
}

const DEEPSEEK_MAX_TOKENS = 8192;

async function executeWithDeepSeek(
	organizationId: string,
	pipeline: string,
	generateOpts: Omit<GenerateTextParams, "model">,
) {
	const fallbackModel = getDeepSeekModel();
	const fallbackStart = Date.now();

	// Clamp maxOutputTokens to DeepSeek's limit
	const opts = { ...generateOpts };
	if ("maxOutputTokens" in opts && typeof opts.maxOutputTokens === "number" && opts.maxOutputTokens > DEEPSEEK_MAX_TOKENS) {
		opts.maxOutputTokens = DEEPSEEK_MAX_TOKENS;
	}
	// Also handle legacy max_tokens if present
	const optsAny = opts as Record<string, unknown>;
	if (typeof optsAny.max_tokens === "number" && optsAny.max_tokens > DEEPSEEK_MAX_TOKENS) {
		optsAny.max_tokens = DEEPSEEK_MAX_TOKENS;
	}

	const result = await generateText({
		...opts,
		model: fallbackModel,
	} as GenerateTextParams);

	const fallbackDuration = Date.now() - fallbackStart;

	db.aiUsageLog
		.create({
			data: {
				organizationId,
				pipeline,
				model: "deepseek-chat-fallback",
				inputTokens: result.usage?.inputTokens ?? 0,
				outputTokens: result.usage?.outputTokens ?? 0,
				durationMs: fallbackDuration,
				success: true,
			},
		})
		.catch(() => {});

	return result;
}
