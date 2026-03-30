/**
 * Model Router
 *
 * Resolves the AI model for an organization based on its tier.
 * Supports BYOK (Bring Your Own Key) — when an org has a custom API key,
 * it creates a provider instance with that key instead of the platform key.
 *
 * Uses in-memory cache (60s TTL) to avoid per-call DB lookups.
 *
 * Tier mapping:
 *   "budget"   → DeepSeek Chat (via OpenAI-compatible API)
 *   "standard" → Claude Opus 4.6  (default)
 *   "premium"  → Claude Opus 4.6
 *
 * Fallback: If Anthropic fails, instrumentedGenerateText retries with DeepSeek.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { db, decryptApiKey } from "@repo/database";

export type AiTier = "budget" | "standard" | "premium";

const TIER_MODEL_MAP: Record<AiTier, () => LanguageModel> = {
	budget: () => {
		const deepseek = createOpenAI({
			baseURL: "https://api.deepseek.com",
			apiKey: process.env.DEEPSEEK_API_KEY,
		});
		return deepseek.chat("deepseek-chat");
	},
	standard: () => anthropic("claude-opus-4-6"),
	premium: () => anthropic("claude-opus-4-6"),
};

const MODEL_DISPLAY_NAME: Record<AiTier, string> = {
	budget: "deepseek-chat",
	standard: "claude-opus-4-6",
	premium: "claude-opus-4-6",
};

// In-memory cache: orgId → { tier, encrypted keys, expiresAt }
interface OrgCacheEntry {
	tier: AiTier;
	encryptedAnthropicKey: string | null;
	encryptedDeepseekKey: string | null;
	expiresAt: number;
}

const tierCache = new Map<string, OrgCacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function isValidTier(value: string | null | undefined): value is AiTier {
	return value === "budget" || value === "standard" || value === "premium";
}

async function getOrgConfig(organizationId: string): Promise<OrgCacheEntry> {
	const cached = tierCache.get(organizationId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached;
	}

	const org = await db.organization.findUnique({
		where: { id: organizationId },
		select: {
			aiTier: true,
			aiAnthropicKey: true,
			aiDeepseekKey: true,
		},
	});

	const entry: OrgCacheEntry = {
		tier: isValidTier(org?.aiTier) ? org.aiTier : "standard",
		encryptedAnthropicKey: org?.aiAnthropicKey ?? null,
		encryptedDeepseekKey: org?.aiDeepseekKey ?? null,
		expiresAt: Date.now() + CACHE_TTL_MS,
	};

	tierCache.set(organizationId, entry);
	return entry;
}

/** Build a model using the org's BYOK key if available, otherwise platform key */
function buildModelForTier(
	tier: AiTier,
	encryptedAnthropicKey: string | null,
	encryptedDeepseekKey: string | null,
): LanguageModel {
	if (tier === "budget") {
		const apiKey = encryptedDeepseekKey
			? decryptApiKey(encryptedDeepseekKey)
			: process.env.DEEPSEEK_API_KEY;
		const deepseek = createOpenAI({
			baseURL: "https://api.deepseek.com",
			apiKey,
		});
		return deepseek("deepseek-chat");
	}

	// standard or premium — Anthropic
	if (encryptedAnthropicKey) {
		const customAnthropic = createAnthropic({
			apiKey: decryptApiKey(encryptedAnthropicKey),
		});
		return customAnthropic("claude-opus-4-6");
	}

	return TIER_MODEL_MAP[tier]();
}

export async function getModelForOrg(
	organizationId: string,
): Promise<{ model: LanguageModel; modelName: string; tier: AiTier }> {
	const config = await getOrgConfig(organizationId);
	return {
		model: buildModelForTier(
			config.tier,
			config.encryptedAnthropicKey,
			config.encryptedDeepseekKey,
		),
		modelName: MODEL_DISPLAY_NAME[config.tier],
		tier: config.tier,
	};
}

/** Pre-load an org's tier into cache (call at session start for real-time pipelines) */
export async function preloadOrgTier(organizationId: string): Promise<void> {
	await getOrgConfig(organizationId);
}

/** Invalidate cache for an org (call when admin changes tier or BYOK keys) */
export function invalidateOrgTierCache(organizationId: string): void {
	tierCache.delete(organizationId);
}
