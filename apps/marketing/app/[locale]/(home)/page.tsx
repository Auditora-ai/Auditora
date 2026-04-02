import { HeroSection } from "@home/components/HeroSection";
import { TrustBar } from "@home/components/TrustBar";
import { ProblemSection } from "@home/components/ProblemSection";
import { ProductFlow } from "@home/components/ProductFlow";
import { SimulationShowcase } from "@home/components/SimulationShowcase";
import { FeaturesBento } from "@home/components/FeaturesBento";
import { HowItWorks } from "@home/components/HowItWorks";
import { UseCases } from "@home/components/UseCases";
import { CredibilitySection } from "@home/components/CredibilitySection";
import { PricingSection } from "@home/components/PricingSection";
import { FaqSection } from "@home/components/FaqSection";
import { FinalCta } from "@home/components/FinalCta";

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	return (
		<div data-landing className="dark bg-[#0A1428] text-slate-50">
			<HeroSection />
			<TrustBar />
			<ProblemSection />
			<ProductFlow />
			<SimulationShowcase />
			<FeaturesBento />
			<HowItWorks />
			<UseCases />
			<CredibilitySection />
			<PricingSection />
			<FaqSection />
			<FinalCta />
		</div>
	);
}
