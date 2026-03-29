/**
 * Estimates USD cost from token counts and model name.
 * Pricing per 1M tokens — update when provider prices change.
 */

const COST_PER_1M: Record<string, { input: number; output: number }> = {
	"claude-opus-4-6": { input: 15, output: 75 },
	"claude-sonnet-4-6": { input: 3, output: 15 },
	"deepseek-chat": { input: 0.14, output: 0.28 },
};

export function estimateTokenCostUsd(
	model: string,
	inputTokens: number,
	outputTokens: number,
): number {
	const rates = COST_PER_1M[model];
	if (!rates) return 0;
	return (
		(inputTokens / 1_000_000) * rates.input +
		(outputTokens / 1_000_000) * rates.output
	);
}

/** Rates for external services (per minute) */
export const EXTERNAL_COST_RATES = {
	"deepgram-stt": 0.0043, // Deepgram Nova-2 per audio minute
	"recall-bot": 0.02, // Recall.ai per bot minute
} as const;
