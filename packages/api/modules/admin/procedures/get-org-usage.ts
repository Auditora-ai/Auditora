import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";
import { queryOrgUsage } from "../../organizations/lib/usage-query";

export const getOrgUsage = adminProcedure
	.route({
		method: "GET",
		path: "/admin/organizations/{id}/usage",
		tags: ["Administration"],
		summary: "Get AI usage for an organization",
	})
	.input(
		z.object({
			id: z.string(),
			days: z.number().int().min(1).max(90).default(30),
		}),
	)
	.handler(async ({ input: { id, days } }) => {
		const org = await db.organization.findUnique({
			where: { id },
			select: { id: true, name: true, aiTier: true, aiTokenBudget: true },
		});
		if (!org) {
			throw new ORPCError("NOT_FOUND");
		}

		const usage = await queryOrgUsage(id, days);

		return {
			organization: org,
			...usage,
		};
	});
