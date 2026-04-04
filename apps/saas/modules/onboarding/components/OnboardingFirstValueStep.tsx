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
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";

interface OnboardingFirstValueStepProps {
	onCompleted: () => void;
}

const ACTION_CARDS = [
	{
		key: "chatInterview",
		icon: MessageSquareIcon,
		path: "/descubrir/interview",
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	{
		key: "exploreDashboard",
		icon: BarChart3Icon,
		path: "/panorama",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	{
		key: "documentProcess",
		icon: FileTextIcon,
		path: "/descubrir/new",
		color: "text-purple-500",
		bgColor: "bg-purple-500/10",
	},
] as const;

export function OnboardingFirstValueStep({
	onCompleted,
}: OnboardingFirstValueStepProps) {
	const t = useTranslations();
	const router = useRouter();
	const { activeOrganization } = useActiveOrganization();

	const orgSlug = activeOrganization?.slug ?? "";

	const handleCardClick = (path: string) => {
		onCompleted();
		router.push(`/${orgSlug}${path}`);
	};

	return (
		<div className="flex flex-col items-center gap-8">
			<div className="text-center space-y-2">
				<h2 className="text-lg font-semibold">
					{t("onboarding.firstValue.title")}
				</h2>
				<p className="text-sm text-muted-foreground max-w-md">
					{t("onboarding.firstValue.recommendation")}
				</p>
			</div>

			<div className="grid w-full max-w-2xl gap-4 grid-cols-1 sm:grid-cols-3">
				{ACTION_CARDS.map(({ key, icon: Icon, path, color, bgColor }) => (
					<Card
						key={key}
						role="button"
						tabIndex={0}
						className="cursor-pointer rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						onClick={() => handleCardClick(path)}
						onKeyDown={(e: React.KeyboardEvent) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleCardClick(path);
							}
						}}
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
