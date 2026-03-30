"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@repo/ui/components/progress";
import { useEffect, useState } from "react";
import { SettingsItem } from "@shared/components/SettingsItem";
import { BarChart3Icon, ZapIcon } from "lucide-react";

interface CreditStatus {
	used: number;
	limit: number | null;
	remaining: number | null;
	resetDate: string | null;
}

export function UsageDashboard({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [credits, setCredits] = useState<CreditStatus | null>(null);
	const [loading, setLoading] = useState(true);

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
				// Silently fail — credits will show as loading
			} finally {
				setLoading(false);
			}
		}
		fetchCredits();
	}, [organizationId]);

	if (loading || !credits) {
		return null;
	}

	// Unlimited plan (Enterprise or BYOK)
	if (credits.limit === null) {
		return (
			<SettingsItem title="Sesiones IA">
				<div className="rounded-lg border p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<ZapIcon className="size-4" />
						<span>Sesiones ilimitadas</span>
					</div>
				</div>
			</SettingsItem>
		);
	}

	const usagePercent = credits.limit > 0
		? Math.min(100, Math.round((credits.used / credits.limit) * 100))
		: 0;

	const isWarning = usagePercent >= 80;
	const isExhausted = usagePercent >= 100;

	const resetDate = credits.resetDate
		? new Date(credits.resetDate).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			})
		: null;

	return (
		<SettingsItem title="Sesiones IA">
			<div className="rounded-lg border p-4 space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BarChart3Icon className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">
							{credits.used} / {credits.limit} sesiones usadas
						</span>
					</div>
					{resetDate && (
						<span className="text-xs text-muted-foreground">
							Se reinicia el {resetDate}
						</span>
					)}
				</div>

				<Progress
					value={usagePercent}
					className={
						isExhausted
							? "[&>div]:bg-destructive"
							: isWarning
								? "[&>div]:bg-amber-500"
								: ""
					}
				/>

				{credits.remaining !== null && (
					<p className="text-xs text-muted-foreground">
						{isExhausted
							? "Has alcanzado tu límite de sesiones este mes."
							: isWarning
								? `Te quedan ${credits.remaining} sesiones este mes.`
								: `${credits.remaining} sesiones disponibles.`}
					</p>
				)}
			</div>
		</SettingsItem>
	);
}
