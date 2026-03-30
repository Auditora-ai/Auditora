"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { GlobeIcon } from "lucide-react";
import { INDUSTRIES, COMPANY_SIZES, COUNTRIES } from "@radiografia/lib/industries";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export interface DatosBasicosData {
	companyName: string;
	industry: string;
	companySize: string;
	country: string;
	url: string;
}

interface StepDatosBasicosProps {
	data: DatosBasicosData;
	onChange: (patch: Partial<DatosBasicosData>) => void;
	onCaptchaToken: (token: string | null) => void;
	isAuthenticated?: boolean;
}

export function StepDatosBasicos({ data, onChange, onCaptchaToken, isAuthenticated }: StepDatosBasicosProps) {
	const t = useTranslations("scan");
	const turnstileRef = useRef<TurnstileInstance | null>(null);

	return (
		<div className="mx-auto w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
					{t("v2.stepDatosBasicosTitle")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("v2.stepDatosBasicosDesc")}
				</p>
			</div>

			{/* Company Name */}
			<div className="space-y-2">
				<Label htmlFor="companyName">{t("v2.companyName")} *</Label>
				<Input
					id="companyName"
					value={data.companyName}
					onChange={(e) => onChange({ companyName: e.target.value })}
					placeholder={t("v2.companyNamePlaceholder")}
					autoFocus
					required
				/>
			</div>

			{/* Industry */}
			<div className="space-y-2">
				<Label htmlFor="industry">{t("v2.industry")} *</Label>
				<Select
					value={data.industry}
					onValueChange={(v) => onChange({ industry: v })}
				>
					<SelectTrigger id="industry">
						<SelectValue placeholder={t("v2.industryPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{INDUSTRIES.map((ind) => (
							<SelectItem key={ind.value} value={ind.value}>
								{ind.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Company Size */}
			<div className="space-y-2">
				<Label htmlFor="companySize">{t("v2.companySize")}</Label>
				<Select
					value={data.companySize}
					onValueChange={(v) => onChange({ companySize: v })}
				>
					<SelectTrigger id="companySize">
						<SelectValue placeholder={t("v2.companySizePlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{COMPANY_SIZES.map((size) => (
							<SelectItem key={size.value} value={size.value}>
								{size.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Country */}
			<div className="space-y-2">
				<Label htmlFor="country">{t("v2.country")}</Label>
				<Select
					value={data.country}
					onValueChange={(v) => onChange({ country: v })}
				>
					<SelectTrigger id="country">
						<SelectValue placeholder={t("v2.countryPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{COUNTRIES.map((c) => (
							<SelectItem key={c.value} value={c.value}>
								{c.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Optional URL */}
			<div className="space-y-2">
				<Label htmlFor="url" className="flex items-center gap-2">
					<GlobeIcon className="size-3.5 text-muted-foreground" />
					{t("v2.urlOptional")}
				</Label>
				<Input
					id="url"
					type="url"
					value={data.url}
					onChange={(e) => onChange({ url: e.target.value })}
					placeholder="www.miempresa.com"
				/>
				<p className="text-xs text-muted-foreground">{t("v2.urlHelper")}</p>
			</div>

			{/* Hidden Turnstile */}
			{TURNSTILE_SITE_KEY && (
				<div className="fixed -left-[9999px]" aria-hidden>
					<Turnstile
						ref={turnstileRef}
						siteKey={TURNSTILE_SITE_KEY}
						onSuccess={(token) => onCaptchaToken(token)}
						onError={() => onCaptchaToken("__skip__")}
						onExpire={() => {
							onCaptchaToken(null);
							turnstileRef.current?.reset();
						}}
						options={{ size: "invisible", theme: "auto" }}
					/>
				</div>
			)}
		</div>
	);
}
