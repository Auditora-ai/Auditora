import { config } from "@config";
import { LocaleLink } from "@i18n/routing";
import { Logo } from "@repo/ui";
import { useTranslations } from "next-intl";
import { CookieSettingsButton } from "./CookieSettingsButton";

export function Footer() {
	const t = useTranslations();

	return (
		<footer className="border-t py-8 text-foreground/60 text-sm">
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-4">
				<div>
					<Logo className="opacity-70 grayscale" />
					<p className="mt-3 text-sm opacity-70">
						© {new Date().getFullYear()} {config.appName}. All rights reserved.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<span className="font-medium text-foreground/80">
						{t("common.footer.tools") || "Free Tools"}
					</span>
					<LocaleLink href="/tools/bpmn-generator" className="block">
						BPMN Generator
					</LocaleLink>
					<LocaleLink href="/tools/sipoc-generator" className="block">
						SIPOC Generator
					</LocaleLink>
					<LocaleLink href="/tools/raci-generator" className="block">
						RACI Generator
					</LocaleLink>
					<LocaleLink href="/tools/process-audit" className="block">
						Process Health Check
					</LocaleLink>
				</div>

				<div className="flex flex-col gap-2">
					<LocaleLink href="/blog" className="block">
						{t("common.footer.blog")}
					</LocaleLink>

					<a href="#features" className="block">
						{t("common.footer.features")}
					</a>

					<a href="/#pricing" className="block">
						{t("common.footer.pricing")}
					</a>
				</div>

				<div className="flex flex-col gap-2">
					<LocaleLink href="/legal/privacy-policy" className="block">
						{t("common.footer.privacyPolicy")}
					</LocaleLink>

					<LocaleLink href="/legal/terms" className="block">
						{t("common.footer.termsAndConditions")}
					</LocaleLink>

					<CookieSettingsButton />

					<LocaleLink href="/legal/privacy-policy#under-ccpa-california-usa" className="block">
						{t("common.footer.doNotSell")}
					</LocaleLink>
				</div>
			</div>
			<div className="container mt-6 border-t border-foreground/10 pt-4">
				<p className="text-xs opacity-50 leading-relaxed">
					{t("common.footer.aiDisclaimer")}
				</p>
			</div>
		</footer>
	);
}
