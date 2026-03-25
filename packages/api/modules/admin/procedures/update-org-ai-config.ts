import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { invalidateOrgTierCache } from "@repo/ai";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

const AI_TIERS = ["budget", "standard", "premium"] as const;

export const updateOrgAiConfig = adminProcedure
	.route({
		method: "POST",
		path: "/admin/organizations/{id}/ai-config",
		tags: ["Administration"],
		summary: "Update organization AI configuration",
	})
	.input(
		z.object({
			id: z.string(),
			aiTier: z.enum(AI_TIERS),
			aiTokenBudget: z.number().int().positive().nullable(),
		}),
	)
	.handler(async ({ input: { id, aiTier, aiTokenBudget } }) => {
		const org = await db.organization.findUnique({ where: { id } });
		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		const updated = await db.organization.update({
			where: { id },
			data: { aiTier, aiTokenBudget },
		});

		// Invalidate cached tier so next AI call picks up the change
		invalidateOrgTierCache(id);

		return {
			id: updated.id,
			name: updated.name,
			aiTier: updated.aiTier,
			aiTokenBudget: updated.aiTokenBudget,
		};
	});
