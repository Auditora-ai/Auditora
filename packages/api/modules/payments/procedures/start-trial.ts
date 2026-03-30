import { ORPCError } from "@orpc/client";
import {
	createPurchase,
	db,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import { config } from "@repo/payments/config";
import { getPlanLimits, type PlanId } from "@repo/payments/lib/plans";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const TRIAL_PERIOD_DAYS = 14;

export const startTrial = protectedProcedure
	.route({
		method: "POST",
		path: "/payments/start-trial",
		tags: ["Payments"],
		summary: "Start free trial",
		description:
			"Starts a 14-day free trial without requiring payment information",
	})
	.input(
		z.object({
			planId: z.string(),
			organizationId: z.string().optional(),
		}),
	)
	.handler(
		async ({
			input: { planId, organizationId },
			context: { user },
		}) => {
			if (!(planId in config.plans)) {
				throw new ORPCError("NOT_FOUND", {
					message: "Plan not found",
				});
			}

			const existingPurchases = organizationId
				? await getPurchasesByOrganizationId(organizationId)
				: await getPurchasesByUserId(user.id);

			const hasActivePaidSubscription = existingPurchases.some(
				(p) => p.status === "active",
			);

			if (hasActivePaidSubscription) {
				throw new ORPCError("CONFLICT", {
					message: "A subscription or trial already exists",
				});
			}

			// Clean up expired or stale trial records so a new trial can start
			const staleTrials = existingPurchases.filter(
				(p) => p.status === "trialing",
			);
			if (staleTrials.length > 0) {
				await db.purchase.deleteMany({
					where: { id: { in: staleTrials.map((p) => p.id) } },
				});
			}

			await createPurchase({
				type: "SUBSCRIPTION",
				customerId: `trial_${organizationId ?? user.id}`,
				priceId: `trial:${planId}:monthly`,
				status: "trialing",
				...(organizationId
					? { organizationId }
					: { userId: user.id }),
			});

			// Set session credit limits from plan config
			if (organizationId) {
				const limits = getPlanLimits(planId as PlanId);
				if (limits) {
					await db.organization.update({
						where: { id: organizationId },
						data: {
							sessionCreditsLimit: limits.sessions,
							billingCycleAnchor: new Date(),
						},
					});
				}
			}

			return { success: true };
		},
	);
