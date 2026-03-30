"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightIcon, XIcon } from "lucide-react";
import Link from "next/link";

interface CreditStatus {
	used: number;
	limit: number | null;
	remaining: number | null;
	resetDate: string | null;
}

export function UpgradeBanner({
	organizationId,
	organizationSlug,
}: {
	organizationId: string;
	organizationSlug: string;
}) {
	const [credits, setCredits] = useState<CreditStatus | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		async function fetchCredits() {
			try {
				const res = await fetch(
					`/api/organizations/session-credits?organizationId=${organizationId}`,
				);
				if (res.ok) {
					setCredits(await res.json());
				}
			} catch {
				// Silent fail
			}
		}
		fetchCredits();
	}, [organizationId]);

	if (dismissed || !credits || credits.limit === null) {
		return null;
	}

	const usagePercent = credits.limit > 0
		? Math.round((credits.used / credits.limit) * 100)
		: 0;

	// Only show at >= 80% usage
	if (usagePercent < 80) {
		return null;
	}

	const isExhausted = usagePercent >= 100;

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
					? "Has alcanzado el límite de sesiones IA este mes."
					: `Te quedan ${credits.remaining} sesiones IA este mes.`}
			</p>

			<Link
				href={`/${organizationSlug}/settings/billing`}
				className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
			>
				Actualizar plan
				<ArrowUpRightIcon className="size-3" />
			</Link>
		</div>
	);
}
