import type { PaymentsConfig } from "./types";

export const config: PaymentsConfig = {
	billingAttachedTo: "organization",
	requireActiveSubscription: true,
	plans: {
		pro: {
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_MONTHLY as string,
					interval: "month",
					amount: 29,
					currency: "USD",
					seatBased: true,
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_YEARLY as string,
					interval: "year",
					amount: 290,
					currency: "USD",
					seatBased: true,
					trialPeriodDays: 14,
				},
			],
		},
		team: {
			recommended: true,
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_TEAM_MONTHLY as string,
					interval: "month",
					amount: 79,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_TEAM_YEARLY as string,
					interval: "year",
					amount: 790,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
		},
		enterprise: {
			isEnterprise: true,
		},
	},
};
