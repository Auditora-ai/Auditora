"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlertIcon, CheckIcon, ArrowRightIcon } from "lucide-react";
import { Spinner } from "@repo/ui";

interface ConversionGateProps {
	processName: string;
	risksCount: number;
}

export function ConversionGate({ processName, risksCount }: ConversionGateProps) {
	const t = useTranslations("scan");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [orgName, setOrgName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [existingUser, setExistingUser] = useState(false);

	const canSubmit = email.trim().includes("@") && name.trim().length > 1;

	async function handleSubmit() {
		if (!canSubmit || loading) return;
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/public/scan/convert", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					name: name.trim(),
					organizationName: orgName.trim() || undefined,
				}),
			});

			const data = await res.json();

			if (data.error === "existing_user") {
				setExistingUser(true);
				setError(t("existingUserError"));
				setLoading(false);
				return;
			}

			if (!res.ok) {
				setError(data.error || t("connectionError"));
				setLoading(false);
				return;
			}

			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
			}
		} catch {
			setError(t("connectionError"));
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen flex-col bg-background pb-[env(safe-area-inset-bottom)] lg:flex-row">
			{/* Left: Value proposition — dark chrome */}
			<div className="flex flex-col items-center justify-center bg-chrome-base px-8 py-12 lg:flex-1 lg:px-16">
				<div className="max-w-sm text-center">
					<ShieldAlertIcon className="mx-auto mb-6 size-12 text-destructive/80" />
					<p className="font-display text-6xl md:text-7xl font-bold text-destructive">
						{risksCount}
					</p>
					<p className="mt-2 text-lg font-medium text-chrome-text">
						{t("risksIdentified").toLowerCase()}
					</p>
					<p className="mt-1 font-display text-2xl text-chrome-text">
						{processName}
					</p>

					{/* Value bullets */}
					<div className="mt-8 space-y-3 text-left">
						{[
							t("convertBullet1"),
							t("convertBullet2"),
							t("convertBullet3"),
						].map((bullet, i) => (
							<div key={i} className="flex items-start gap-3">
								<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
									<CheckIcon className="size-3 text-primary" />
								</span>
								<p className="text-sm leading-relaxed text-chrome-text-secondary">
									{bullet}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Right: Signup form — light canvas */}
			<div className="flex flex-col items-center justify-center px-8 py-12 lg:flex-1 lg:px-16">
				<div className="w-full max-w-sm">
					<div className="mb-8">
						<h1 className="text-2xl font-display text-foreground">
							{t("saveScan")}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("saveDescription", { count: risksCount, process: processName })}
						</p>
					</div>

					<div className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium text-foreground">
								{t("name")}
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("namePlaceholder")}
								disabled={loading}
								className="min-h-[44px] w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-foreground">
								{t("email")}
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="tu@empresa.com"
								disabled={loading}
								className="min-h-[44px] w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-foreground">
								{t("companyName")} <span className="text-muted-foreground">{t("optional")}</span>
							</label>
							<input
								type="text"
								value={orgName}
								onChange={(e) => setOrgName(e.target.value)}
								placeholder={t("companyNamePlaceholder")}
								disabled={loading}
								className="min-h-[44px] w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
							/>
						</div>

						{error && (
							<div className={`rounded-lg border px-4 py-3 text-sm ${
								existingUser
									? "border-primary bg-accent text-foreground"
									: "border-destructive bg-destructive/10 text-destructive"
							}`}>
								{error}
								{existingUser && (
									<a href="/login" className="mt-2 block font-medium text-primary underline">
										{t("goToLogin")}
									</a>
								)}
							</div>
						)}

						<button
							type="button"
							onClick={handleSubmit}
							disabled={!canSubmit || loading}
							className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors disabled:opacity-50"
						>
							{loading ? (
								<>
									<Spinner className="size-4 text-primary-foreground" />
									{t("creatingAccount")}
								</>
							) : (
								<>
									{t("createAccount")}
									<ArrowRightIcon className="size-4" />
								</>
							)}
						</button>

						<p className="text-center text-xs text-muted-foreground">
							{t("termsNotice")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
