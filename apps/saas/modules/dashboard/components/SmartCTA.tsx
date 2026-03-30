"use client";

import { Button } from "@repo/ui/components/button";
import { SparklesIcon, PlayIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface SmartCTAProps {
	basePath: string;
	totalProcesses: number;
	latestProcessName: string | null;
	latestProcessId: string | null;
}

export function SmartCTA({
	basePath,
	totalProcesses,
	latestProcessName,
	latestProcessId,
}: SmartCTAProps) {
	const t = useTranslations("dashboard");

	// State machine for CTA
	if (totalProcesses === 0) {
		return (
			<Button asChild size="lg" className="gap-2">
				<Link href={`${basePath}/processes`}>
					<SparklesIcon className="size-4" />
					{t("cta.firstDiscovery")}
				</Link>
			</Button>
		);
	}

	if (latestProcessId && latestProcessName) {
		return (
			<div className="flex items-center gap-2">
				<Button asChild size="lg" className="gap-2">
					<Link href={`${basePath}/processes/${latestProcessId}`}>
						<PlayIcon className="size-4" />
						{t("cta.deepDive", { name: latestProcessName })}
					</Link>
				</Button>
				<Button asChild variant="outline" size="lg" className="gap-2">
					<Link href={`${basePath}/processes`}>
						<PlusIcon className="size-4" />
						{t("cta.newDiscovery")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<Button asChild size="lg" className="gap-2">
			<Link href={`${basePath}/processes`}>
				<PlusIcon className="size-4" />
				{t("cta.newDiscovery")}
			</Link>
		</Button>
	);
}
