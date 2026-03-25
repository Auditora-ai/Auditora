import { AnalyticsScript } from "@analytics";
import { config } from "@config";
import { config as i18nConfig } from "@i18n/config";
import { cn } from "@repo/ui";
import { ClientProviders } from "@shared/components/ClientProviders";
import { ConsentBanner } from "@shared/components/ConsentBanner";
import { ConsentProvider } from "@shared/components/ConsentProvider";
import { Footer } from "@shared/components/Footer";
import { LenisProvider } from "@shared/components/LenisProvider";
import { NavBar } from "@shared/components/NavBar";
import { Geist } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
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

const displayFont = Instrument_Serif({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-display",
	style: ["normal", "italic"],
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
	const consentCookie = cookieStore.get("consent");

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
				<ConsentProvider
					initialConsent={consentCookie?.value === "true"}
				>
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
								<AnalyticsScript />
							</ThemeProvider>
						</ClientProviders>
					</NextIntlClientProvider>
				</ConsentProvider>
			</body>
		</html>
	);
}
