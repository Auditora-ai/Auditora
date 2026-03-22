import { getOrganizationList, getSession } from "@auth/lib/server";
import { listPurchases } from "@repo/api/modules/payments/procedures/list-purchases";
import { config as authConfig } from "@repo/auth/config";
import { config as paymentsConfig } from "@repo/payments/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function MainLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	if (authConfig.users.enableOnboarding && !session.user.onboardingComplete) {
		redirect("/onboarding");
	}

	const organizations = await getOrganizationList();

	if (
		authConfig.organizations.enable &&
		authConfig.organizations.requireOrganization
	) {
		const organization =
			organizations.find(
				(org) => org.id === session?.session.activeOrganizationId,
			) || organizations[0];

		if (!organization) {
			redirect("/new-organization");
		}
	}

	if (paymentsConfig.requireActiveSubscription) {
		const organizationId = authConfig.organizations.enable
			? session?.session.activeOrganizationId || organizations?.at(0)?.id
			: undefined;

		const purchases = await listPurchases.callable({
			context: { headers: await headers() },
		})({
			organizationId,
		});

		const { activePlan } = createPurchasesHelper(purchases);

		if (!activePlan) {
			redirect("/choose-plan");
		}

		// Check if trial has expired (createdAt + 14 days)
		if (activePlan.status === "trialing") {
			const trialPurchase = purchases.find(
				(p) => p.type === "SUBSCRIPTION" && p.status === "trialing",
			);
			if (trialPurchase) {
				const TRIAL_DAYS = 14;
				const trialEnd = new Date(trialPurchase.createdAt);
				trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
				if (new Date() > trialEnd) {
					redirect("/choose-plan");
				}
			}
		}
	}

	return children;
}
