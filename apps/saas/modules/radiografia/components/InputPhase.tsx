"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface InputPhaseProps {
	onSubmit: (
		input: { type: "url"; url: string } | { type: "text"; description: string },
		turnstileToken?: string,
	) => void;
	loading: boolean;
}

export function InputPhase({ onSubmit, loading }: InputPhaseProps) {
	const t = useTranslations("scan");
	const [mode, setMode] = useState<"url" | "text">("url");
	const [url, setUrl] = useState("");
	const [description, setDescription] = useState("");
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const turnstileRef = useRef<TurnstileInstance | null>(null);

	const canSubmit = mode === "url" ? url.trim().length > 3 : description.trim().length > 20;

	function handleSubmit() {
		if (!canSubmit || loading) return;
		if (mode === "url") {
			onSubmit({ type: "url", url: url.trim() }, captchaToken || undefined);
		} else {
			onSubmit({ type: "text", description: description.trim() }, captchaToken || undefined);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 bg-background">
			<div className="w-full max-w-xl text-center">
				<h1 className="mb-3 text-3xl md:text-5xl tracking-tight font-display text-foreground">
					{t("title")}
				</h1>
				<p className="mb-8 md:mb-10 text-base md:text-lg font-sans text-muted-foreground">
					{t("subtitle")}
				</p>

				{mode === "url" ? (
					<>
						<input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={t("urlPlaceholder")}
							disabled={loading}
							className="w-full rounded-lg border border-input bg-secondary px-4 py-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
							onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
						/>
						<button
							type="button"
							onClick={() => setMode("text")}
							className="mt-3 text-sm text-muted-foreground transition-colors hover:underline"
						>
							{t("noWebsite")}
						</button>
					</>
				) : (
					<>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("descriptionPlaceholder")}
							disabled={loading}
							rows={4}
							className="w-full resize-none rounded-lg border border-input bg-secondary px-4 py-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:bg-accent"
						/>
						<button
							type="button"
							onClick={() => setMode("url")}
							className="mt-3 text-sm text-muted-foreground transition-colors hover:underline"
						>
							{t("hasWebsite")}
						</button>
					</>
				)}

				{/* Turnstile captcha — invisible mode */}
				{TURNSTILE_SITE_KEY && (
					<div className="mt-4 flex justify-center">
						<Turnstile
							ref={turnstileRef}
							siteKey={TURNSTILE_SITE_KEY}
							onSuccess={(token) => setCaptchaToken(token)}
							onError={() => setCaptchaToken(null)}
							onExpire={() => {
								setCaptchaToken(null);
								turnstileRef.current?.reset();
							}}
							options={{
								size: "invisible",
								theme: "auto",
							}}
						/>
					</div>
				)}

				<button
					type="button"
					onClick={handleSubmit}
					disabled={!canSubmit || loading}
					className="mt-6 min-h-[44px] w-full rounded-lg bg-primary px-6 py-4 text-base font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							{t("generating")}
						</span>
					) : (
						t("generate")
					)}
				</button>

				<p className="mt-4 text-xs text-muted-foreground">
					{t("disclaimer")}
				</p>
			</div>
		</div>
	);
}
