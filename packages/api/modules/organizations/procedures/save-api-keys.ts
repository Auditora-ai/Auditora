import { ORPCError } from "@orpc/server";
import { db, encryptApiKey } from "@repo/database";
import { invalidateOrgTierCache } from "@repo/ai";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const saveApiKeys = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/ai/keys",
		tags: ["Organizations"],
		summary: "Save custom API keys (BYOK)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			anthropicKey: z.string().nullish(),
			deepseekKey: z.string().nullish(),
		}),
	)
	.handler(
		async ({
			context: { user },
			input: { organizationId, anthropicKey, deepseekKey },
		}) => {
			const membership = await verifyOrganizationMembership(
				organizationId,
				user.id,
			);
			if (!membership || membership.role !== "admin") {
				throw new ORPCError("FORBIDDEN");
			}

			const data: Record<string, unknown> = {
				aiKeysUpdatedAt: new Date(),
			};

			if (anthropicKey !== undefined) {
				data.aiAnthropicKey = anthropicKey
					? encryptApiKey(anthropicKey)
					: null;
			}
			if (deepseekKey !== undefined) {
				data.aiDeepseekKey = deepseekKey
					? encryptApiKey(deepseekKey)
					: null;
			}

			await db.organization.update({
				where: { id: organizationId },
				data,
			});

			// Invalidate model router cache so next AI call picks up the new key
			invalidateOrgTierCache(organizationId);

			const updated = await db.organization.findUnique({
				where: { id: organizationId },
				select: {
					aiAnthropicKey: true,
					aiDeepseekKey: true,
					aiKeysUpdatedAt: true,
				},
			});

			return {
				hasAnthropicKey: !!updated?.aiAnthropicKey,
				hasDeepseekKey: !!updated?.aiDeepseekKey,
				updatedAt: updated?.aiKeysUpdatedAt?.toISOString() ?? null,
			};
		},
	);
