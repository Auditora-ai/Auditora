"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { BrainIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface AiInsightCardProps {
	insight: string;
}

export function AiInsightCard({ insight }: AiInsightCardProps) {
	const t = useTranslations("dashboard");

	return (
		<Card className="border-primary/20 bg-primary/[0.02]">
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<div className="rounded-lg bg-primary/10 p-2 shrink-0">
						<BrainIcon className="size-5 text-primary" />
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 mb-1">
							<p className="text-sm font-medium">{t("insight.title")}</p>
							<SparklesIcon className="size-3 text-primary" />
						</div>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{insight}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
