import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { invalidateOrgTierCache } from "@repo/ai";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const deleteApiKey = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/ai/delete-key",
		tags: ["Organizations"],
		summary: "Remove a custom API key",
	})
	.input(
		z.object({
			organizationId: z.string(),
			provider: z.enum(["anthropic", "deepseek"]),
		}),
	)
	.handler(
		async ({ context: { user }, input: { organizationId, provider } }) => {
			const membership = await verifyOrganizationMembership(
				organizationId,
				user.id,
			);
			if (!membership || membership.role !== "admin") {
				throw new ORPCError("FORBIDDEN");
			}

			const field =
				provider === "anthropic" ? "aiAnthropicKey" : "aiDeepseekKey";

			await db.organization.update({
				where: { id: organizationId },
				data: {
					[field]: null,
					aiKeysUpdatedAt: new Date(),
				},
			});

			// Invalidate model router cache
			invalidateOrgTierCache(organizationId);

			return { ok: true };
		},
	);
