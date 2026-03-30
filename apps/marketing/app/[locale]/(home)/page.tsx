import { CredibilitySection } from "@home/components/CredibilitySection";
import { CtaSection } from "@home/components/CtaSection";
import { DeepDiveSection } from "@home/components/DeepDiveSection";
import { FaqSection } from "@home/components/FaqSection";
import { HeroSection } from "@home/components/HeroSection";
import { PlatformFeaturesSection } from "@home/components/PlatformFeaturesSection";
import { PricingSection } from "@home/components/PricingSection";
import { ProblemSection } from "@home/components/ProblemSection";
import { SolutionSection } from "@home/components/SolutionSection";
import { ToolsShowcaseSection } from "@home/components/ToolsShowcaseSection";
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
		<>
			<HeroSection />
			<ProblemSection />
			<SolutionSection />
			<TryItSection />
			<DeepDiveSection />
			<PlatformFeaturesSection />
			<CredibilitySection />
			<PricingSection />
			<FaqSection />
			<ToolsShowcaseSection />
			<CtaSection />
		</>
	);
}
