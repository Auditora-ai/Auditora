import { CredibilitySection } from "@home/components/CredibilitySection";
import { CtaSection } from "@home/components/CtaSection";
import { DeepDiveSection } from "@home/components/DeepDiveSection";
import { FaqSection } from "@home/components/FaqSection";
import { HeroSection } from "@home/components/HeroSection";
import { LogoBar } from "@home/components/LogoBar";
import { MetricsSection } from "@home/components/MetricsSection";
import { PlatformFeaturesSection } from "@home/components/PlatformFeaturesSection";
import { PricingSection } from "@home/components/PricingSection";
import { ProblemSection } from "@home/components/ProblemSection";
import { SocialProofSection } from "@home/components/SocialProofSection";
import { SolutionSection } from "@home/components/SolutionSection";
import { TryItSection } from "@home/components/TryItSection";
import { setRequestLocale } from "next-intl/server";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div data-landing>
			<HeroSection />
			<LogoBar />
			<MetricsSection />
			<ProblemSection />
			<SolutionSection />
			<TryItSection />
			<DeepDiveSection />
			<PlatformFeaturesSection />
			<CredibilitySection />
			<SocialProofSection />
			<PricingSection />
			<FaqSection />
			<CtaSection />
		</div>
	);
}
