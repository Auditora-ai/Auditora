"use client";

import { Button } from "@repo/ui/components/button";
import { useCookieConsent } from "@shared/hooks/cookie-consent";
import { COOKIE_INVENTORY } from "@shared/lib/consent-types";
import { CookieIcon, Settings2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function Toggle({
	checked,
	onChange,
	disabled,
}: {
	checked: boolean;
	onChange?: (value: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange?.(!checked)}
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
				checked ? "bg-primary" : "bg-muted"
			}`}
		>
			<span
				className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
					checked ? "translate-x-4" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

export function ConsentBanner() {
	const {
		showBanner,
		acceptAll,
		rejectAll,
		savePreferences,
	} = useCookieConsent();

	const t = useTranslations("consent");
	const [mounted, setMounted] = useState(false);
	const [showCustomize, setShowCustomize] = useState(false);
	const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
	const [marketingEnabled, setMarketingEnabled] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || !showBanner) {
		return null;
	}

	const handleSaveCustom = () => {
		savePreferences(analyticsEnabled, marketingEnabled);
	};

	const analyticsCookies = COOKIE_INVENTORY.filter((c) => c.category === "analytics");
	const essentialCookies = COOKIE_INVENTORY.filter((c) => c.category === "essential");

	return (
		<div className="fixed left-4 bottom-4 z-50 max-w-md">
			<div className="rounded-2xl border bg-card p-5 text-card-foreground shadow-xl">
				{/* Header */}
				<div className="flex items-start gap-3">
					<CookieIcon className="mt-0.5 size-5 shrink-0 text-primary/60" />
					<div className="flex-1">
						<p className="text-sm font-medium">{t("title")}</p>
						<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
							{t("description")}
						</p>
					</div>
					{showCustomize && (
						<button
							type="button"
							onClick={() => setShowCustomize(false)}
							className="text-muted-foreground hover:text-foreground"
						>
							<XIcon className="size-4" />
						</button>
					)}
				</div>

				{/* Customize panel */}
				{showCustomize && (
					<div className="mt-4 space-y-3 border-t pt-4">
						{/* Essential — always on */}
						<div className="flex items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-sm font-medium">{t("essential.title")}</p>
								<p className="text-xs text-muted-foreground">
									{t("essential.description")}
								</p>
								<p className="mt-1 text-[10px] text-muted-foreground/70">
									{essentialCookies.map((c) => c.name).join(", ")}
								</p>
							</div>
							<Toggle checked disabled />
						</div>

						{/* Analytics */}
						<div className="flex items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-sm font-medium">{t("analytics.title")}</p>
								<p className="text-xs text-muted-foreground">
									{t("analytics.description")}
								</p>
								<p className="mt-1 text-[10px] text-muted-foreground/70">
									{analyticsCookies.map((c) => c.name).join(", ")}
								</p>
							</div>
							<Toggle
								checked={analyticsEnabled}
								onChange={setAnalyticsEnabled}
							/>
						</div>

						{/* Marketing */}
						<div className="flex items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-sm font-medium">{t("marketing.title")}</p>
								<p className="text-xs text-muted-foreground">
									{t("marketing.description")}
								</p>
							</div>
							<Toggle
								checked={marketingEnabled}
								onChange={setMarketingEnabled}
							/>
						</div>

						<Button
							className="w-full"
							size="sm"
							onClick={handleSaveCustom}
						>
							{t("savePreferences")}
						</Button>
					</div>
				)}

				{/* Action buttons — shown when not customizing */}
				{!showCustomize && (
					<div className="mt-4 flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="flex-1 text-xs"
							onClick={() => setShowCustomize(true)}
						>
							<Settings2Icon className="mr-1.5 size-3.5" />
							{t("customize")}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							className="flex-1"
							onClick={rejectAll}
						>
							{t("rejectAll")}
						</Button>
						<Button
							size="sm"
							className="flex-1"
							onClick={acceptAll}
						>
							{t("acceptAll")}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
