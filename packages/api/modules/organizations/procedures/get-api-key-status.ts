import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getApiKeyStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/ai/key-status",
		tags: ["Organizations"],
		summary: "Check which custom API keys are configured",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId } }) => {
		const membership = await verifyOrganizationMembership(
			organizationId,
			user.id,
		);
		if (!membership || membership.role !== "admin") {
			throw new ORPCError("FORBIDDEN");
		}

		const org = await db.organization.findUnique({
			where: { id: organizationId },
			select: {
				aiAnthropicKey: true,
				aiDeepseekKey: true,
				aiKeysUpdatedAt: true,
			},
		});

		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		return {
			hasAnthropicKey: !!org.aiAnthropicKey,
			hasDeepseekKey: !!org.aiDeepseekKey,
			updatedAt: org.aiKeysUpdatedAt?.toISOString() ?? null,
		};
	});
