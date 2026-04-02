"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { Button } from "@repo/ui/components/button";
import { CheckCircle2Icon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface OnboardingSetupCompleteStepProps {
	onCompleted: () => void;
}

export function OnboardingSetupCompleteStep({
	onCompleted,
}: OnboardingSetupCompleteStepProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();

	const handleGoToDashboard = () => {
		onCompleted();
	};

	return (
		<div className="flex flex-col items-center gap-8 py-8">
			<div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
				<CheckCircle2Icon className="size-10 text-emerald-500" />
			</div>

			<div className="text-center space-y-2">
				<h2 className="text-xl font-semibold">
					{t("onboarding.setupComplete.title")}
				</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					{t("onboarding.setupComplete.subtitle")}
				</p>
			</div>

			<div className="w-full max-w-sm space-y-3">
				<Button
					type="button"
					onClick={handleGoToDashboard}
					className="w-full"
					size="lg"
				>
					{t("onboarding.setupComplete.goToDashboard")}
				</Button>

				<Button variant="outline" className="w-full" asChild>
					<Link href={`/${activeOrganization?.slug ?? ""}/settings/members`}>
						<UsersIcon className="mr-2 size-4" />
						{t("onboarding.setupComplete.inviteMembers")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
