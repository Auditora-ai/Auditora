import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";
import { queryOrgUsage } from "../lib/usage-query";

export const getAiUsage = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/ai/usage",
		tags: ["Organizations"],
		summary: "Get AI usage for the organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
			days: z.number().int().min(1).max(90).default(30),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId, days } }) => {
		const membership = await verifyOrganizationMembership(
			organizationId,
			user.id,
		);
		if (!membership || membership.role !== "admin") {
			throw new ORPCError("FORBIDDEN");
		}

		const org = await db.organization.findUnique({
			where: { id: organizationId },
			select: { id: true, name: true, aiTier: true, aiTokenBudget: true },
		});
		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		const usage = await queryOrgUsage(organizationId, days);

		return {
			organization: org,
			...usage,
		};
	});
