import { config } from "@config";
import { LocaleLink } from "@i18n/routing";
import { Logo } from "@repo/ui";
import { useTranslations } from "next-intl";
import { CookieSettingsButton } from "./CookieSettingsButton";

function TwitterIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

function LinkedInIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	);
}

function GitHubIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
		</svg>
	);
}

function ShieldCheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

export function Footer() {
	const t = useTranslations();

	return (
		<footer className="bg-[#050A15] border-t border-white/10 text-white/70">
			{/* Main footer content */}
			<div className="container py-16">
				{/* Top row: Logo + tagline + social */}
				<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 pb-12 border-b border-white/10">
					<div className="max-w-sm">
						<Logo variant="dark" />
						<p className="mt-4 text-sm leading-relaxed text-white/50">
							{t("common.footer.tagline")}
						</p>
					</div>
					<div className="flex items-center gap-4">
						<a
							href="https://twitter.com/auditoraai"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
							aria-label="Twitter"
						>
							<TwitterIcon />
						</a>
						<a
							href="https://linkedin.com/company/auditora"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
							aria-label="LinkedIn"
						>
							<LinkedInIcon />
						</a>
						<a
							href="https://github.com/auditora"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
							aria-label="GitHub"
						>
							<GitHubIcon />
						</a>
					</div>
				</div>

				{/* 4-column nav grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
					{/* Product */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
							{t("common.footer.productTitle")}
						</h3>
						<ul className="space-y-3">
					<li>
						<a
							href={config.saasUrl ? `${config.saasUrl}/scan` : "/scan"}
							className="text-sm text-white/60 hover:text-white transition-colors"
						>
							{t("common.footer.scan")}
						</a>
					</li>
							<li>
								<LocaleLink
									href="/processes"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.processes")}
								</LocaleLink>
							</li>
							<li>
								<LocaleLink
									href="/evaluations"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.evaluations")}
								</LocaleLink>
							</li>
							<li>
								<LocaleLink
									href="/#pricing"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.pricing")}
								</LocaleLink>
							</li>
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
							{t("common.footer.resourcesTitle")}
						</h3>
						<ul className="space-y-3">
							<li>
								<LocaleLink
									href="/blog"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.blog")}
								</LocaleLink>
							</li>
							<li>
								<a
									href={config.docsUrl ?? "/docs"}
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.docs")}
								</a>
							</li>
							<li>
								<a
									href={config.docsUrl ? `${config.docsUrl}/api` : "/docs/api"}
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.api")}
								</a>
							</li>
							<li>
								<LocaleLink
									href="/changelog"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.changelog")}
								</LocaleLink>
							</li>
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
							{t("common.footer.companyTitle")}
						</h3>
						<ul className="space-y-3">
							<li>
								<LocaleLink
									href="/about"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.about")}
								</LocaleLink>
							</li>
							<li>
								<LocaleLink
									href="/contact"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.contact")}
								</LocaleLink>
							</li>
						<li>
							<LocaleLink
								href="/careers"
								className="text-sm text-white/60 hover:text-white transition-colors"
							>
								{t("common.footer.careers")}
							</LocaleLink>
						</li>
						<li>
							<LocaleLink
								href="/security"
								className="text-sm text-white/60 hover:text-white transition-colors"
							>
								{t("common.footer.security")}
							</LocaleLink>
						</li>
					</ul>
				</div>

				{/* Legal */}
					<div>
						<h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
							{t("common.footer.legalTitle")}
						</h3>
						<ul className="space-y-3">
							<li>
								<LocaleLink
									href="/legal/privacy-policy"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.privacyPolicy")}
								</LocaleLink>
							</li>
							<li>
								<LocaleLink
									href="/legal/terms"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.termsAndConditions")}
								</LocaleLink>
							</li>
						<li>
							<LocaleLink
								href="/legal/cookie-policy"
								className="text-sm text-white/60 hover:text-white transition-colors"
							>
								{t("common.footer.cookiePolicy")}
							</LocaleLink>
						</li>
						<li>
							<CookieSettingsButton />
						</li>
							<li>
								<LocaleLink
									href="/legal/privacy-policy#under-ccpa-california-usa"
									className="text-sm text-white/60 hover:text-white transition-colors"
								>
									{t("common.footer.ccpa")}
								</LocaleLink>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-white/10">
				<div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-xs text-white/40">
						{t("common.footer.copyright", {
							year: new Date().getFullYear(),
							appName: config.appName,
						})}
					</p>

				<div className="flex items-center gap-3">
					<LocaleLink href="/security" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[11px] font-medium text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-all">
						<ShieldCheckIcon />
						{t("common.footer.soc2")}
					</LocaleLink>
					<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[11px] font-medium text-white/50 border border-white/10">
						<ShieldCheckIcon />
						{t("common.footer.gdpr")}
					</span>
					<LocaleLink href="/security" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[11px] font-medium text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-all">
						<ShieldCheckIcon />
						{t("common.footer.iso27001")}
					</LocaleLink>
				</div>
				</div>

				{/* AI Disclaimer */}
				<div className="container pb-6">
					<p className="text-[11px] text-white/30 leading-relaxed max-w-3xl">
						{t("common.footer.aiDisclaimer")}
					</p>
				</div>
			</div>
		</footer>
	);
}
