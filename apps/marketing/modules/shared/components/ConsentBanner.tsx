"use client";

import { Button } from "@repo/ui/components/button";
import { useCookieConsent } from "@shared/hooks/cookie-consent";
import { COOKIE_INVENTORY } from "@shared/lib/consent-types";
import { Settings2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Tiny toggle – unchanged from original                             */
/* ------------------------------------------------------------------ */
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
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B8FE8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1428] disabled:cursor-not-allowed disabled:opacity-50 ${
				checked ? "bg-[#3B8FE8]" : "bg-white/20"
			}`}
		>
			<span
				className={`pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
					checked ? "translate-x-4" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  ConsentBanner – minimal bottom bar                                */
/* ------------------------------------------------------------------ */
export function ConsentBanner() {
	const {
		showBanner,
		acceptAll,
		rejectAll,
		savePreferences,
		preferences,
	} = useCookieConsent();

	const t = useTranslations("consent");
	const [mounted, setMounted] = useState(false);
	const [showCustomize, setShowCustomize] = useState(false);
	const [analyticsEnabled, setAnalyticsEnabled] = useState(
		preferences?.analytics ?? false,
	);
	const [marketingEnabled, setMarketingEnabled] = useState(
		preferences?.marketing ?? false,
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || !showBanner) {
		return null;
	}

	const handleSaveCustom = () => {
		savePreferences(analyticsEnabled, marketingEnabled);
	};

	const analyticsCookies = COOKIE_INVENTORY.filter(
		(c) => c.category === "analytics",
	);
	const essentialCookies = COOKIE_INVENTORY.filter(
		(c) => c.category === "essential",
	);

	return (
		<AnimatePresence>
			{showBanner && (
				<motion.div
					key="consent-banner"
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					exit={{ y: "100%" }}
					transition={{ type: "spring", stiffness: 400, damping: 35 }}
					className="fixed inset-x-0 bottom-0 z-50"
				>
					{/* ---- Customize drawer (expands above the bar) ---- */}
					<AnimatePresence>
						{showCustomize && (
							<motion.div
								key="customize-panel"
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
								className="overflow-hidden border-b border-white/10 bg-[#0A1428]/95 backdrop-blur-md"
							>
								<div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
									{/* Close row */}
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold uppercase tracking-wider text-white/60">
											{t("customize")}
										</span>
										<button
											type="button"
											onClick={() => setShowCustomize(false)}
											className="rounded-md p-1 text-white/50 transition-colors hover:text-white"
										>
											<XIcon className="size-4" />
										</button>
									</div>

									{/* Cookie categories in a row on desktop, stacked on mobile */}
									<div className="grid gap-4 sm:grid-cols-3">
										{/* Essential */}
										<div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-white">
													{t("essential.title")}
												</p>
												<p className="mt-0.5 text-[11px] leading-snug text-white/50">
													{t("essential.description")}
												</p>
												<p className="mt-1 text-[10px] text-white/30">
													{essentialCookies
														.map((c) => c.name)
														.join(", ")}
												</p>
											</div>
											<Toggle checked disabled />
										</div>

										{/* Analytics */}
										<div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-white">
													{t("analytics.title")}
												</p>
												<p className="mt-0.5 text-[11px] leading-snug text-white/50">
													{t("analytics.description")}
												</p>
												<p className="mt-1 text-[10px] text-white/30">
													{analyticsCookies
														.map((c) => c.name)
														.join(", ")}
												</p>
											</div>
											<Toggle
												checked={analyticsEnabled}
												onChange={setAnalyticsEnabled}
											/>
										</div>

										{/* Marketing */}
										<div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-white">
													{t("marketing.title")}
												</p>
												<p className="mt-0.5 text-[11px] leading-snug text-white/50">
													{t("marketing.description")}
												</p>
											</div>
											<Toggle
												checked={marketingEnabled}
												onChange={setMarketingEnabled}
											/>
										</div>
									</div>

									{/* Save button */}
									<div className="flex justify-end">
										<Button
											size="sm"
											onClick={handleSaveCustom}
											className="bg-[#3B8FE8] text-[#0A1428] hover:bg-[#3B8FE8]/90"
										>
											{t("savePreferences")}
										</Button>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* ---- Main thin bar ---- */}
					<div className="border-t border-white/10 bg-[#0A1428]/95 backdrop-blur-md">
						<div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
							{/* Left: text + customize link */}
							<div className="flex min-w-0 flex-1 items-center gap-3">
								<p className="truncate text-sm text-white/80">
									{t("description")}
								</p>
								{!showCustomize && (
									<button
										type="button"
										onClick={() => setShowCustomize(true)}
										className="inline-flex shrink-0 items-center gap-1 text-xs text-[#3B8FE8] transition-colors hover:text-[#3B8FE8]/80"
									>
										<Settings2Icon className="size-3" />
										<span className="hidden sm:inline">
											{t("customize")}
										</span>
									</button>
								)}
							</div>

							{/* Right: action buttons */}
							<div className="flex shrink-0 items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={rejectAll}
									className="h-8 border-white/20 bg-transparent text-xs text-white hover:bg-white/10 hover:text-white"
								>
									{t("rejectAll")}
								</Button>
								<Button
									size="sm"
									onClick={acceptAll}
									className="h-8 bg-[#3B8FE8] text-xs text-[#0A1428] hover:bg-[#3B8FE8]/90"
								>
									{t("acceptAll")}
								</Button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
