import { db } from "@repo/database";
import { config } from "../config";
import { getPlanIdByProviderPriceId } from "./provider-price-ids";
import { getPlanLimits } from "./plans";
import type { PlanLimits } from "../types";

export interface UsageMetric {
	used: number;
	limit: number | null;
}

export interface UsageResponse {
	evaluations: UsageMetric;
	evaluators: UsageMetric;
	processes: UsageMetric;
	sessions: UsageMetric;
	reports: UsageMetric;
	billingCycleAnchor: string | null;
}

/**
 * Compute the start of the current billing cycle.
 * Uses the organization's billingCycleAnchor day-of-month if available,
 * otherwise falls back to the 1st of the current month.
 */
function getBillingCycleStart(billingCycleAnchor: Date | null): Date {
	const now = new Date();

	if (billingCycleAnchor) {
		const anchorDay = billingCycleAnchor.getDate();
		const start = new Date(now.getFullYear(), now.getMonth(), anchorDay);
		// If the anchor day hasn't occurred yet this month, use last month's anchor
		if (start > now) {
			start.setMonth(start.getMonth() - 1);
		}
		return start;
	}

	// Default: start of current month
	return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get the plan limits for an organization based on its active purchase.
 * Returns null for all limits if no active plan is found (enterprise or no purchase).
 */
async function getOrgPlanLimits(
	organizationId: string,
): Promise<PlanLimits | null> {
	const subscriptionPurchase = await db.purchase.findFirst({
		where: {
			organizationId,
			type: "SUBSCRIPTION",
		},
		orderBy: { createdAt: "desc" },
	});

	if (subscriptionPurchase) {
		const planId = getPlanIdByProviderPriceId(subscriptionPurchase.priceId);
		if (planId && planId in config.plans) {
			return getPlanLimits(planId);
		}
	}

	// Check for one-time purchase
	const oneTimePurchase = await db.purchase.findFirst({
		where: {
			organizationId,
			type: "ONE_TIME",
		},
		orderBy: { createdAt: "desc" },
	});

	if (oneTimePurchase) {
		const planId = getPlanIdByProviderPriceId(oneTimePurchase.priceId);
		if (planId && planId in config.plans) {
			return getPlanLimits(planId);
		}
	}

	return null;
}

/**
 * Compute usage statistics for an organization across all plan metrics.
 */
export async function getOrganizationUsage(
	organizationId: string,
): Promise<UsageResponse> {
	// Get organization data for billing cycle and session credits
	const organization = await db.organization.findUnique({
		where: { id: organizationId },
		select: {
			billingCycleAnchor: true,
			sessionCreditsUsed: true,
			sessionCreditsLimit: true,
		},
	});

	if (!organization) {
		return {
			evaluations: { used: 0, limit: null },
			evaluators: { used: 0, limit: null },
			processes: { used: 0, limit: null },
			sessions: { used: 0, limit: null },
			reports: { used: 0, limit: null },
			billingCycleAnchor: null,
		};
	}

	const billingCycleStart = getBillingCycleStart(
		organization.billingCycleAnchor,
	);

	// Get plan limits
	const limits = await getOrgPlanLimits(organizationId);

	// Evaluations: count completed SimulationRuns within billing cycle
	const evaluationsUsed = await db.simulationRun.count({
		where: {
			scenario: {
				template: {
					organizationId,
				},
			},
			status: "COMPLETED",
			createdAt: { gte: billingCycleStart },
		},
	});

	// Evaluators: count distinct users who ran simulations within billing cycle
	const evaluatorRows = await db.simulationRun.findMany({
		where: {
			scenario: {
				template: {
					organizationId,
				},
			},
			createdAt: { gte: billingCycleStart },
		},
		select: { userId: true },
		distinct: ["userId"],
	});

	// Processes: count top-level ProcessDefinitions (no parent)
	const processesUsed = await db.processDefinition.count({
		where: {
			architecture: {
				organizationId,
			},
			parentId: null,
		},
	});

	// Sessions: from organization's sessionCreditsUsed
	const sessionsUsed = organization.sessionCreditsUsed;

	// Reports: not yet built
	const reportsUsed = 0;

	return {
		evaluations: {
			used: evaluationsUsed,
			limit: limits?.evaluations ?? null,
		},
		evaluators: {
			used: evaluatorRows.length,
			limit: limits?.evaluators ?? null,
		},
		processes: {
			used: processesUsed,
			limit: limits?.processes ?? null,
		},
		sessions: {
			used: sessionsUsed,
			limit: limits?.sessions ?? organization.sessionCreditsLimit ?? null,
		},
		reports: {
			used: reportsUsed,
			limit: limits?.reports ?? null,
		},
		billingCycleAnchor: organization.billingCycleAnchor?.toISOString() ?? null,
	};
}
