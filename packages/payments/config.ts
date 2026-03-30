import type { PaymentsConfig } from "./types";

export const config: PaymentsConfig = {
	billingAttachedTo: "organization",
	requireActiveSubscription: true,
	plans: {
		starter: {
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_STARTER_MONTHLY as string,
					interval: "month",
					amount: 49,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_STARTER_YEARLY as string,
					interval: "year",
					amount: 470,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
			limits: {
				sessions: 10,
				users: 1,
				processes: 5,
			},
		},
		growth: {
			recommended: true,
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_GROWTH_MONTHLY as string,
					interval: "month",
					amount: 149,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_GROWTH_YEARLY as string,
					interval: "year",
					amount: 1430,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
			limits: {
				sessions: 40,
				users: 5,
				processes: null,
			},
		},
		scale: {
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_SCALE_MONTHLY as string,
					interval: "month",
					amount: 349,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_SCALE_YEARLY as string,
					interval: "year",
					amount: 3350,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
			limits: {
				sessions: 100,
				users: 15,
				processes: null,
				overagePerSession: 5,
			},
		},
		enterprise: {
			isEnterprise: true,
		},
	},
};
