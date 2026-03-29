"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<h1 className="mb-2 text-3xl font-display text-foreground">
						{t("saveScan")}
					</h1>
					<p className="text-sm text-muted-foreground">
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
						className="min-h-[44px] w-full rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors disabled:opacity-50"
					>
						{loading ? (
							<span className="flex items-center justify-center gap-2">
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								{t("creatingAccount")}
							</span>
						) : (
							t("createAccount")
						)}
					</button>

					<p className="text-center text-xs text-muted-foreground">
						{t("termsNotice")}
					</p>
				</div>
			</div>
		</div>
	);
}
