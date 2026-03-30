import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getSessionCredits = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/session-credits",
		tags: ["Organizations"],
		summary: "Get session credit status for the organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input: { organizationId } }) => {
		await verifyOrganizationMembership(organizationId, user.id);

		const org = await db.organization.findUnique({
			where: { id: organizationId },
			select: {
				sessionCreditsUsed: true,
				sessionCreditsLimit: true,
				billingCycleAnchor: true,
			},
		});

		if (!org) {
			return {
				used: 0,
				limit: null,
				remaining: null,
				resetDate: null,
			};
		}

		const { sessionCreditsUsed: used, sessionCreditsLimit: limit, billingCycleAnchor } = org;

		// Calculate next reset date
		let resetDate: string | null = null;
		if (billingCycleAnchor) {
			const anchor = new Date(billingCycleAnchor);
			const now = new Date();
			const nextReset = new Date(now.getFullYear(), now.getMonth(), anchor.getDate());
			if (nextReset <= now) {
				nextReset.setMonth(nextReset.getMonth() + 1);
			}
			resetDate = nextReset.toISOString();
		}

		return {
			used,
			limit,
			remaining: limit !== null ? Math.max(0, limit - used) : null,
			resetDate,
		};
	});
