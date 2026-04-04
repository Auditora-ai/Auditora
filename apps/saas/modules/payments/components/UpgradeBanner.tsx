"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface UsageMetric {
	used: number;
	limit: number | null;
}

interface UsageData {
	evaluations: UsageMetric;
	evaluators: UsageMetric;
	processes: UsageMetric;
	sessions: UsageMetric;
	reports: UsageMetric;
	billingCycleAnchor: string | null;
}

export function UpgradeBanner({
	organizationId,
	organizationSlug,
}: {
	organizationId: string;
	organizationSlug: string;
}) {
	const t = useTranslations();
	const [usage, setUsage] = useState<UsageData | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		async function fetchUsage() {
			try {
				const res = await fetch(
					`/api/organizations/${organizationId}/usage`,
				);
				if (res.ok) {
					const data = await res.json();
					if (
						data &&
						typeof data === "object" &&
						"evaluations" in data
					) {
						setUsage(data as UsageData);
					}
				}
			} catch {
				// Silent fail
			}
		}
		fetchUsage();
	}, [organizationId]);

	if (dismissed || !usage) {
		return null;
	}

	// Check evaluations usage (primary unit of value)
	const evalLimit = usage.evaluations.limit;
	if (evalLimit === null) {
		return null;
	}

	const usagePercent =
		evalLimit > 0
			? Math.round((usage.evaluations.used / evalLimit) * 100)
			: 0;

	// Only show at >= 80% usage
	if (usagePercent < 80) {
		return null;
	}

	const isExhausted = usagePercent >= 100;
	const remaining = Math.max(0, evalLimit - usage.evaluations.used);

	return (
		<div
			className={`relative mx-4 mb-3 rounded-lg border px-4 py-3 text-sm ${
				isExhausted
					? "border-destructive/30 bg-destructive/5 text-destructive"
					: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
			}`}
		>
			<button
				type="button"
				onClick={() => setDismissed(true)}
				className="absolute right-2 top-2 rounded p-1 opacity-60 hover:opacity-100"
			>
				<XIcon className="size-3.5" />
			</button>

			<p className="pr-6">
				{isExhausted
					? t("pricing.evaluationsExhausted")
					: t("pricing.evaluationsRemaining", { count: remaining })}
			</p>

			<Link
				href={`/${organizationSlug}/settings/billing`}
				className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
			>
				{t("settings.billing.changePlan.title")}
				<ArrowUpRightIcon className="size-3" />
			</Link>
		</div>
	);
}
