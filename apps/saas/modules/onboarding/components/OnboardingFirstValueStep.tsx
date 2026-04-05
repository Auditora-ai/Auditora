"use client";

import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { CompassIcon, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@shared/hooks/router";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";

interface OnboardingFirstValueStepProps {
	onCompleted: () => void;
}

export function OnboardingFirstValueStep({
	onCompleted,
}: OnboardingFirstValueStepProps) {
	const t = useTranslations();
	const router = useRouter();
	const { activeOrganization } = useActiveOrganization();

	const orgSlug = activeOrganization?.slug ?? "";

	const handleStartDiscovery = () => {
		onCompleted();
		router.push(`/${orgSlug}/discovery`);
	};

	return (
		<div className="flex flex-col items-center gap-6">
			<div className="text-center space-y-2">
				<h2 className="text-lg font-semibold">
					{t("onboarding.firstValue.title")}
				</h2>
				<p className="text-sm text-muted-foreground max-w-md">
					{t("onboarding.firstValue.recommendation")}
				</p>
			</div>

			<Card className="w-full max-w-md rounded-2xl">
				<CardHeader className="text-center pb-2">
					<div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
						<CompassIcon className="size-6 text-primary" />
					</div>
					<CardTitle className="text-base">
						{t("onboarding.firstValue.chatInterview")}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center gap-4">
					<CardDescription className="text-center text-sm">
						{t("onboarding.firstValue.chatInterviewDesc")}
					</CardDescription>
					<Badge variant="secondary" className="text-xs">
						{t("onboarding.firstValue.exploreDashboard")}
					</Badge>
					<Button
						type="button"
						onClick={handleStartDiscovery}
						className="w-full min-h-[48px] active:scale-95"
						size="lg"
					>
						{t("onboarding.firstValue.documentProcess")}
						<ArrowRightIcon className="ml-2 size-4" />
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
