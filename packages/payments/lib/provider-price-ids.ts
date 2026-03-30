import { config } from "../config";
import type { PaidPlan, PlanPrice } from "../types";
import {
	findPriceByPlanId,
	type PlanId,
	type RecurringInterval,
} from "./plans";

interface ProviderPriceMappingEntry {
	planId: PlanId;
	type: PlanPrice["type"];
	interval?: RecurringInterval;
	priceId?: string;
}

function getProviderPriceMappings(): ProviderPriceMappingEntry[] {
	return Object.entries(config.plans).flatMap(([planId, plan]) => {
		if (!("prices" in plan)) {
			return [];
		}

		return (plan as PaidPlan).prices.map((price) => ({
			planId: planId as PlanId,
			type: price.type,
			interval:
				price.type === "subscription" ? price.interval : undefined,
			priceId: price.priceId,
		}));
	});
}

export function getProviderPriceIdByPlanId(
	planId: PlanId,
	selection: {
		type: PlanPrice["type"];
		interval?: RecurringInterval;
	},
) {
	const price = findPriceByPlanId(planId, selection);

	if (!price) {
		return null;
	}

	return (
		getProviderPriceMappings().find(
			(entry) =>
				entry.planId === planId &&
				entry.type === selection.type &&
				entry.interval === selection.interval,
		)?.priceId ?? null
	);
}

export function getPlanIdByProviderPriceId(priceId: string) {
	// Handle trial sentinel priceIds (e.g., "trial:starter:monthly" → "starter")
	if (priceId.startsWith("trial:")) {
		const planId = priceId.split(":")[1] as PlanId;
		return planId in config.plans ? planId : null;
	}

	return (
		getProviderPriceMappings().find((entry) => entry.priceId === priceId)
			?.planId ?? null
	);
}

export function getPlanPriceByProviderPriceId(priceId: string) {
	// Handle trial sentinel priceIds (e.g., "trial:starter:monthly")
	if (priceId.startsWith("trial:")) {
		const parts = priceId.split(":");
		const planId = parts[1] as PlanId;
		const interval = parts[2] === "yearly" ? "year" : "month";

		const price = findPriceByPlanId(planId, {
			type: "subscription",
			interval: interval as RecurringInterval,
		});

		if (!price) {
			return null;
		}

		return { planId, price };
	}

	const mapping = getProviderPriceMappings().find(
		(entry) => entry.priceId === priceId,
	);

	if (!mapping) {
		return null;
	}

	const price = findPriceByPlanId(mapping.planId, {
		type: mapping.type,
		interval: mapping.interval,
	});

	if (!price) {
		return null;
	}

	return {
		planId: mapping.planId,
		price,
	};
}
