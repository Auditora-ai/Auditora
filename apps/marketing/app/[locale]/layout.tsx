import { config } from "@config";
import { config as i18nConfig } from "@i18n/config";
import { cn } from "@repo/ui";
import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { ConsentGatedAnalytics } from "@shared/components/ConsentGatedAnalytics";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Footer } from "@shared/components/Footer";
import { LenisProvider } from "@shared/components/LenisProvider";
import { NavBar } from "@shared/components/NavBar";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "@shared/lib/consent-types";
import { Geist, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

const sansFont = Geist({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

const displayFont = Inter({
	weight: ["600", "700", "800"],
	subsets: ["latin"],
	variable: "--font-display",
});

const locales = Object.keys(i18nConfig.locales) as string[];

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{ params: Promise<{ locale: string }> }>) {
	const { locale } = await params;

	if (!locales.includes(locale)) {
		notFound();
	}

	setRequestLocale(locale);

	const messages = await getMessages();

	const cookieStore = await cookies();
	const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME);
	const initialConsent = parseConsentCookie(consentCookie?.value);

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={`${sansFont.variable} ${displayFont.variable}`}
		>
			<body
				className={cn(
					"min-h-screen overflow-x-hidden bg-background text-foreground antialiased",
				)}
			>
				<ConsentProvider initialConsent={initialConsent}>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<ClientProviders>
							<ThemeProvider
								attribute="class"
								disableTransitionOnChange
								enableSystem
								defaultTheme={config.defaultTheme}
								themes={Array.from(config.enabledThemes)}
							>
								<LenisProvider>
									<NavBar />

									<main className="min-h-screen">{children}</main>

									<Footer />
								</LenisProvider>

								<ConsentBanner />
								<ConsentGatedAnalytics />
							</ThemeProvider>
						</ClientProviders>
					</NextIntlClientProvider>
				</ConsentProvider>
			</body>
		</html>
	);
}
