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
				processes: 3,
				evaluations: 10,
				evaluators: 5,
				sessions: 3,
				reports: 1,
				adminUsers: 2,
			},
		},
		growth: {
			recommended: true,
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_GROWTH_MONTHLY as string,
					interval: "month",
					amount: 199,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_GROWTH_YEARLY as string,
					interval: "year",
					amount: 1910,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
			limits: {
				processes: 15,
				evaluations: 50,
				evaluators: 30,
				sessions: 10,
				reports: 10,
				adminUsers: 5,
			},
		},
		scale: {
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_SCALE_MONTHLY as string,
					interval: "month",
					amount: 499,
					currency: "USD",
					trialPeriodDays: 14,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_SCALE_YEARLY as string,
					interval: "year",
					amount: 4790,
					currency: "USD",
					trialPeriodDays: 14,
				},
			],
			limits: {
				processes: null,
				evaluations: 250,
				evaluators: 150,
				sessions: null,
				reports: null,
				adminUsers: 15,
			},
		},
		enterprise: {
			isEnterprise: true,
		},
	},
};
