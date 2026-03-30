"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { MessageSquareIcon, MicIcon, VideoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface QuickActionsProps {
	basePath: string;
}

export function QuickActions({ basePath }: QuickActionsProps) {
	const t = useTranslations("dashboard");

	const actions = [
		{
			icon: MessageSquareIcon,
			title: t("quickActions.chat"),
			description: t("quickActions.chatDesc"),
			href: `${basePath}/processes`,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			icon: MicIcon,
			title: t("quickActions.audio"),
			description: t("quickActions.audioDesc"),
			href: `${basePath}/processes`,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
		{
			icon: VideoIcon,
			title: t("quickActions.call"),
			description: t("quickActions.callDesc"),
			href: `${basePath}/sessions/new`,
			color: "text-emerald-600",
			bg: "bg-emerald-50",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{actions.map((action) => (
				<Link key={action.title} href={action.href} className="block">
					<Card className="h-full transition-all hover:border-primary/30 hover:shadow-sm">
						<CardContent className="p-4 flex items-start gap-3">
							<div className={`rounded-lg p-2 ${action.bg}`}>
								<action.icon className={`size-5 ${action.color}`} />
							</div>
							<div className="min-w-0">
								<p className="font-medium text-sm">{action.title}</p>
								<p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
							</div>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}
