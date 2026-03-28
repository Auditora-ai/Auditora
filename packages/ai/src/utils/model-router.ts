/**
 * Model Router
 *
 * Resolves the AI model for an organization based on its tier.
 * Uses in-memory cache (60s TTL) to avoid per-call DB lookups.
 *
 * Tier mapping:
 *   "budget"   → DeepSeek Chat (via OpenAI-compatible API)
 *   "standard" → Claude Sonnet 4.6  (default)
 *   "premium"  → Claude Opus 4.6
 */

import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { db } from "@repo/database";

export type AiTier = "budget" | "standard" | "premium";

const TIER_MODEL_MAP: Record<AiTier, () => LanguageModel> = {
	budget: () => {
		const deepseek = createOpenAI({
			baseURL: "https://api.deepseek.com",
			apiKey: process.env.DEEPSEEK_API_KEY,
		});
		return deepseek("deepseek-chat");
	},
	standard: () => anthropic("claude-opus-4-6"),
	premium: () => anthropic("claude-opus-4-6"),
};

const MODEL_DISPLAY_NAME: Record<AiTier, string> = {
	budget: "deepseek-chat",
	standard: "claude-opus-4-6",
	premium: "claude-opus-4-6",
};

// In-memory cache: orgId → { tier, expiresAt }
const tierCache = new Map<string, { tier: AiTier; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function isValidTier(value: string | null | undefined): value is AiTier {
	return value === "budget" || value === "standard" || value === "premium";
}

async function getOrgTier(organizationId: string): Promise<AiTier> {
	const cached = tierCache.get(organizationId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.tier;
	}

	const org = await db.organization.findUnique({
		where: { id: organizationId },
		select: { aiTier: true },
	});

	const tier = isValidTier(org?.aiTier) ? org.aiTier : "standard";

	tierCache.set(organizationId, {
		tier,
		expiresAt: Date.now() + CACHE_TTL_MS,
	});

	return tier;
}

export async function getModelForOrg(
	organizationId: string,
): Promise<{ model: LanguageModel; modelName: string; tier: AiTier }> {
	const tier = await getOrgTier(organizationId);
	return {
		model: TIER_MODEL_MAP[tier](),
		modelName: MODEL_DISPLAY_NAME[tier],
		tier,
	};
}

/** Pre-load an org's tier into cache (call at session start for real-time pipelines) */
export async function preloadOrgTier(organizationId: string): Promise<void> {
	await getOrgTier(organizationId);
}

/** Invalidate cache for an org (call when admin changes tier) */
export function invalidateOrgTierCache(organizationId: string): void {
	tierCache.delete(organizationId);
}
