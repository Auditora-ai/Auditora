"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	ArrowRightIcon,
	Building2Icon,
	PlayIcon,
	GitBranchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const steps = [
	{ key: "step1", icon: Building2Icon },
	{ key: "step2", icon: PlayIcon },
	{ key: "step3", icon: GitBranchIcon },
] as const;

export function DashboardWelcome({
	basePath,
	onDismiss,
}: {
	basePath: string;
	onDismiss: () => void;
}) {
	const t = useTranslations("onboarding.welcome");

	return (
		<div className="flex flex-col items-center py-12">
			<h1 className="font-serif text-3xl font-bold tracking-tight">
				{t("title")}
			</h1>
			<p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

			<div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
				{steps.map(({ key, icon: Icon }, i) => (
					<Card key={key} className="relative p-5">
						<div className="mb-3 flex items-center gap-2">
							<span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								{i + 1}
							</span>
							<Icon className="size-4 text-muted-foreground" />
						</div>
						<p className="text-sm font-medium">{t(key)}</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t(`${key}Desc`)}
						</p>
						{i < steps.length - 1 && (
							<ArrowRightIcon className="absolute -right-3 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground/50 sm:block" />
						)}
					</Card>
				))}
			</div>

			<div className="mt-8 flex flex-col items-center gap-3">
				<Button asChild size="lg">
					<Link href={`${basePath}/sessions/new`}>
						<PlayIcon className="mr-2 size-4" />
						{t("cta")}
					</Link>
				</Button>
				<button
					type="button"
					onClick={onDismiss}
					className="text-sm text-muted-foreground underline-offset-4 hover:underline"
				>
					{t("explore")}
				</button>
			</div>
		</div>
	);
}
