import { BentoFeatureSection } from "@home/components/BentoFeatureSection";
import { CredibilitySection } from "@home/components/CredibilitySection";
import { CtaSection } from "@home/components/CtaSection";
import { DeepDiveSection } from "@home/components/DeepDiveSection";
import { FaqSection } from "@home/components/FaqSection";
import { HeroSection } from "@home/components/HeroSection";
import { LogoBar } from "@home/components/LogoBar";
import { MetricsSection } from "@home/components/MetricsSection";
import { PricingSection } from "@home/components/PricingSection";
import { ProblemSection } from "@home/components/ProblemSection";
import { ProductShowcaseSection } from "@home/components/ProductShowcaseSection";
import { SocialProofSection } from "@home/components/SocialProofSection";
import { SolutionSection } from "@home/components/SolutionSection";
import { WorkflowSection } from "@home/components/WorkflowSection";
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
			<ProductShowcaseSection />
			<BentoFeatureSection />
			<WorkflowSection />
			<DeepDiveSection />
			<CredibilitySection />
			<SocialProofSection />
			<PricingSection />
			<FaqSection />
			<CtaSection />
		</div>
	);
}
