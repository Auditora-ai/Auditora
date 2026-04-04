"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { Button } from "@repo/ui/components/button";
import { CheckCircle2Icon, UsersIcon } from "lucide-react";
import { motion } from "framer-motion";
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
			<motion.div
				initial={{ scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
				className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10"
			>
				<CheckCircle2Icon className="size-10 text-emerald-500" />
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="text-center space-y-2"
			>
				<h2 className="text-xl font-semibold">
					{t("onboarding.setupComplete.title")}
				</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					{t("onboarding.setupComplete.subtitle")}
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.5 }}
				className="w-full max-w-sm space-y-3"
			>
				<Button
					type="button"
					onClick={handleGoToDashboard}
					className="w-full min-h-[44px]"
					size="lg"
				>
					{t("onboarding.setupComplete.goToDashboard")}
				</Button>

				<Button variant="outline" className="w-full min-h-[44px]" asChild>
					<Link href={`/${activeOrganization?.slug ?? ""}/settings/members`}>
						<UsersIcon className="mr-2 size-4" />
						{t("onboarding.setupComplete.inviteMembers")}
					</Link>
				</Button>
			</motion.div>
		</div>
	);
}
