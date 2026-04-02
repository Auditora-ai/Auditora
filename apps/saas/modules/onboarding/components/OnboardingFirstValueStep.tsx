"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { BarChart3Icon, FileTextIcon, MessageSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@shared/hooks/router";

interface OnboardingFirstValueStepProps {
	onCompleted: () => void;
}

const ACTION_CARDS = [
	{
		key: "chatInterview",
		icon: MessageSquareIcon,
		href: "/scan",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	{
		key: "exploreDashboard",
		icon: BarChart3Icon,
		href: "/",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	{
		key: "documentProcess",
		icon: FileTextIcon,
		href: "/processes",
		color: "text-purple-500",
		bgColor: "bg-purple-500/10",
	},
] as const;

export function OnboardingFirstValueStep({
	onCompleted,
}: OnboardingFirstValueStepProps) {
	const t = useTranslations();
	const router = useRouter();

	const handleCardClick = (href: string) => {
		onCompleted();
		router.push(href);
	};

	return (
		<div className="flex flex-col items-center gap-8">
			<div className="text-center space-y-2">
				<p className="text-sm text-muted-foreground max-w-md">
					{t("onboarding.firstValue.recommendation")}
				</p>
			</div>

			<div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
				{ACTION_CARDS.map(({ key, icon: Icon, href, color, bgColor }) => (
					<Card
						key={key}
						className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
						onClick={() => handleCardClick(href)}
					>
						<CardHeader>
							<div
								className={`mb-2 flex size-10 items-center justify-center rounded-lg ${bgColor}`}
							>
								<Icon className={`size-5 ${color}`} />
							</div>
							<CardTitle className="text-sm">
								{t(`onboarding.firstValue.${key}`)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription className="text-xs">
								{t(`onboarding.firstValue.${key}Desc`)}
							</CardDescription>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
