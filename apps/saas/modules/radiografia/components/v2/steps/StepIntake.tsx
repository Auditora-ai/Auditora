"use client";

import { useTranslations } from "next-intl";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { GlobeIcon } from "lucide-react";
import { INDUSTRIES, COMPANY_SIZES, COUNTRIES } from "@radiografia/lib/industries";

export interface IntakeData {
	industry: string;
	companySize: string;
	country: string;
	url: string;
	challenge: string;
}

interface StepIntakeProps {
	data: IntakeData;
	onChange: (patch: Partial<IntakeData>) => void;
	organizationName: string;
}

export function StepIntake({ data, onChange, organizationName }: StepIntakeProps) {
	const t = useTranslations("scan");

	return (
		<div className="mx-auto w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			<div className="space-y-1">
				<h2 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
					{t("discovery.intakeTitle", { company: organizationName })}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("discovery.intakeDesc")}
				</p>
			</div>

			{/* Industry */}
			<div className="space-y-2">
				<Label htmlFor="intake-industry">{t("discovery.industry")} *</Label>
				<Select
					value={data.industry}
					onValueChange={(v) => onChange({ industry: v })}
				>
					<SelectTrigger id="intake-industry">
						<SelectValue placeholder={t("discovery.industryPlaceholder")} />
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
				<Label htmlFor="intake-size">{t("discovery.companySize")}</Label>
				<Select
					value={data.companySize}
					onValueChange={(v) => onChange({ companySize: v })}
				>
					<SelectTrigger id="intake-size">
						<SelectValue placeholder={t("discovery.companySizePlaceholder")} />
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
				<Label htmlFor="intake-country">{t("discovery.country")}</Label>
				<Select
					value={data.country}
					onValueChange={(v) => onChange({ country: v })}
				>
					<SelectTrigger id="intake-country">
						<SelectValue placeholder={t("discovery.countryPlaceholder")} />
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

			{/* URL */}
			<div className="space-y-2">
				<Label htmlFor="intake-url" className="flex items-center gap-2">
					<GlobeIcon className="size-3.5 text-muted-foreground" />
					{t("discovery.urlOptional")}
				</Label>
				<Input
					id="intake-url"
					type="url"
					value={data.url}
					onChange={(e) => onChange({ url: e.target.value })}
					placeholder="www.miempresa.com"
				/>
				<p className="text-xs text-muted-foreground">{t("discovery.urlHelper")}</p>
			</div>

			{/* Challenge */}
			<div className="space-y-2">
				<Label htmlFor="intake-challenge">{t("discovery.challenge")}</Label>
				<Textarea
					id="intake-challenge"
					value={data.challenge}
					onChange={(e) => onChange({ challenge: e.target.value })}
					placeholder={t("discovery.challengePlaceholder")}
					rows={3}
					className="resize-none"
				/>
				<p className="text-xs text-muted-foreground">{t("discovery.challengeHelper")}</p>
			</div>
		</div>
	);
}
