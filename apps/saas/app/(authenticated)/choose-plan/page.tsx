import { getOrganizationList, getSession } from "@auth/lib/server";
import { PricingTable } from "@payments/components/PricingTable";
import { listPurchases } from "@payments/lib/server";
import { config as authConfig } from "@repo/auth/config";
import { config as paymentsConfig } from "@repo/payments/config";
import { createPurchasesHelper } from "@repo/payments/lib/helper";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("choosePlan");

	return {
		title: t("title"),
	};
}

export default async function ChoosePlanPage() {
	const t = await getTranslations("choosePlan");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	let organizationId: string | undefined;
	if (
		authConfig.organizations.enable &&
		paymentsConfig.billingAttachedTo === "organization"
	) {
		const organization = (await getOrganizationList()).at(0);

		if (!organization) {
			redirect("/new-organization");
		}

		organizationId = organization.id;
	}

	const purchases = await listPurchases(organizationId);

	const { activePlan } = createPurchasesHelper(purchases);

	// Check if this is an expired trial — don't redirect to /
	let trialExpired = false;
	if (activePlan?.status === "trialing") {
		const trialPurchase = purchases.find(
			(p) => p.type === "SUBSCRIPTION" && p.status === "trialing",
		);
		if (trialPurchase) {
			const TRIAL_DAYS = 14;
			const trialEnd = new Date(trialPurchase.createdAt);
			trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
			trialExpired = new Date() > trialEnd;
		}
	}

	if (activePlan && !trialExpired) {
		redirect("/");
	}

	return (
		<AuthWrapper contentClass="max-w-5xl">
			<div className="mb-4 text-center">
				<h1 className="text-center font-bold text-2xl lg:text-3xl">
					{trialExpired ? t("trialExpiredTitle") : t("title")}
				</h1>
				<p className="text-muted-foreground text-sm lg:text-base">
					{trialExpired ? t("trialExpiredDescription") : t("description")}
				</p>
			</div>

			<div>
				<PricingTable
					{...(organizationId
						? {
								organizationId,
							}
						: {
								userId: session.user.id,
							})}
				/>
			</div>
		</AuthWrapper>
	);
}
